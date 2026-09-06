import type { ChatMessage } from "./types.ts";

export interface AiGatewayConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface AiStreamOptions {
  systemPrompt: string;
  contextText: string;
  messages?: ChatMessage[];
  userPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_FALLBACK_MODEL = "gpt-oss-20b";
const DEFAULT_LOCAL_GATEWAY_URL = "http://127.0.0.1:20128/v1";

/**
 * Resolves the active AI gateway configuration from environment variables.
 * Supports OMNIROUTE_*, AI_*, and OPENAI_* configuration.
 */
export function getAiConfig(): AiGatewayConfig {
  const baseUrl = (
    process.env.OMNIROUTE_BASE_URL ||
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    DEFAULT_LOCAL_GATEWAY_URL
  ).trim().replace(/\/+$/, "");

  const apiKey = (
    process.env.OMNIROUTE_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "local-gateway-key"
  ).trim();

  const model = (
    process.env.OMNIROUTE_MODEL ||
    process.env.AI_MODEL ||
    DEFAULT_FALLBACK_MODEL
  ).trim();

  return {
    baseUrl,
    apiKey,
    model,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Checks if the AI gateway has the necessary configuration to make requests.
 */
export function isAiConfigured(): boolean {
  const config = getAiConfig();
  return Boolean(config.baseUrl && config.model);
}

/**
 * Validates configuration and returns detailed error information if misconfigured.
 */
export function validateAiConfig(): { valid: boolean; error?: string } {
  const config = getAiConfig();

  if (!config.baseUrl) {
    return {
      valid: false,
      error: "OMNIROUTE_BASE_URL / AI_BASE_URL is not configured. Please set OMNIROUTE_BASE_URL in your .env.local file.",
    };
  }

  if (!config.model) {
    return {
      valid: false,
      error: "OMNIROUTE_MODEL / AI_MODEL is not configured. Please set OMNIROUTE_MODEL in your .env.local file.",
    };
  }

  return { valid: true };
}

/**
 * Converts RepoLens prompt & context options into OpenAI-compatible chat messages format.
 */
export function formatOpenAiMessages(options: AiStreamOptions): Array<{ role: string; content: string }> {
  const formattedMessages: Array<{ role: string; content: string }> = [];

  // Always include system prompt with grounded context instructions
  formattedMessages.push({
    role: "system",
    content: options.systemPrompt,
  });

  if (options.messages && options.messages.length > 0) {
    let isFirstUser = true;
    for (const msg of options.messages) {
      if (msg.role === "system") continue;
      const role = msg.role === "assistant" ? "assistant" : "user";
      let content = msg.content;

      // Inject repository grounding context into the first user message
      if (isFirstUser && role === "user") {
        content = `[REPOSITORY CONTEXT]\n${options.contextText}\n\n[USER QUESTION]\n${msg.content}`;
        isFirstUser = false;
      }

      formattedMessages.push({ role, content });
    }
  } else if (options.userPrompt) {
    formattedMessages.push({
      role: "user",
      content: `[REPOSITORY CONTEXT]\n${options.contextText}\n\n[TASK / PROMPT]\n${options.userPrompt}`,
    });
  }

  return formattedMessages;
}

/**
 * Provider-agnostic streaming client that connects to an OpenAI-compatible AI gateway (e.g. OmniRoute).
 * Returns a Web Standard ReadableStream emitting UTF-8 chunks.
 */
export async function streamAiCompletion(
  options: AiStreamOptions
): Promise<ReadableStream<Uint8Array>> {
  const config = getAiConfig();
  const validation = validateAiConfig();
  if (!validation.valid) {
    throw new Error(validation.error || "AI configuration error.");
  }

  const endpoint = config.baseUrl.endsWith("/chat/completions")
    ? config.baseUrl
    : `${config.baseUrl}/chat/completions`;

  const messages = formatOpenAiMessages(options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  const requestBody = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxOutputTokens ?? 4096,
    stream: true,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`AI Gateway request timed out after ${config.timeoutMs / 1000}s.`);
    }
    const message = err instanceof Error ? err.message : "Failed to connect to AI gateway.";
    throw new Error(`Connection error to AI Gateway at ${config.baseUrl}: ${message}`);
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    let errorMessage = `AI Gateway returned status ${response.status} (${response.statusText})`;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) {
        errorMessage = errBody.error.message;
      }
    } catch {
      // Use fallback error message
    }
    // Redact any accidental credential leak
    if (config.apiKey && config.apiKey.length > 5) {
      errorMessage = errorMessage.split(config.apiKey).join("[REDACTED]");
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    clearTimeout(timeoutId);
    throw new Error("AI Gateway response did not contain a readable stream body.");
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
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (jsonStr === "[DONE]") {
              clearTimeout(timeoutId);
              try {
                streamController.close();
              } catch {
                // already closed
              }
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              // Ignore keepalives
              if (parsed?.id === "omniroute-keepalive") continue;

              // Check error objects inside stream
              if (parsed?.error?.message) {
                let errMsg = parsed.error.message;
                if (config.apiKey && config.apiKey.length > 5) {
                  errMsg = errMsg.split(config.apiKey).join("[REDACTED]");
                }
                streamController.error(new Error(errMsg));
                return;
              }

              // Extract chunk text from choices (OpenAI standard format)
              const textChunk =
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.choices?.[0]?.text ||
                parsed?.choices?.[0]?.message?.content;

              if (textChunk && typeof textChunk === "string") {
                streamController.enqueue(encoder.encode(textChunk));
              }
            } catch {
              // Ignore partial JSON chunks
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
