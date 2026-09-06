import type { ChatMessage } from "./types.ts";

const GEMINI_MODEL = "gemini-2.5-flash";
const API_TIMEOUT_MS = 25000;

export interface GeminiStreamOptions {
  systemPrompt: string;
  contextText: string;
  messages?: ChatMessage[];
  userPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Checks whether an API key is available in environment variables.
 */
export function isGeminiKeyConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

/**
 * Gets the Gemini API key from environment variables.
 */
function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file."
    );
  }
  return key.trim();
}

/**
 * Streams content from Gemini API using fetch and returns a Web ReadableStream of UTF-8 chunks.
 */
export async function streamGeminiContent(
  options: GeminiStreamOptions
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getGeminiApiKey();

  // Construct Gemini request body
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  // If chat messages exist, map them
  if (options.messages && options.messages.length > 0) {
    // Inject context into the first user message
    let isFirst = true;
    for (const msg of options.messages) {
      if (msg.role === "system") continue;
      const role = msg.role === "assistant" ? "model" : "user";
      let text = msg.content;
      if (isFirst && role === "user") {
        text = `[REPOSITORY CONTEXT]\n${options.contextText}\n\n[USER QUESTION]\n${msg.content}`;
        isFirst = false;
      }
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  } else if (options.userPrompt) {
    contents.push({
      role: "user",
      parts: [
        {
          text: `[REPOSITORY CONTEXT]\n${options.contextText}\n\n[TASK / PROMPT]\n${options.userPrompt}`,
        },
      ],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: options.systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 4096,
        },
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gemini API request timed out after ${API_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    let errorMessage = `Gemini API responded with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    clearTimeout(timeoutId);
    throw new Error("Gemini API response did not contain a readable stream body.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");
  const upstreamReader = response.body.getReader();

  return new ReadableStream<Uint8Array>({
    async start(streamController) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                streamController.enqueue(encoder.encode(textChunk));
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }

        clearTimeout(timeoutId);
        streamController.close();
      } catch (streamErr) {
        clearTimeout(timeoutId);
        streamController.error(streamErr);
      }
    },
  });
}
