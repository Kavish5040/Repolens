"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessageItem } from "./ChatMessageItem.tsx";
import { PromptSuggestions } from "./PromptSuggestions.tsx";
import type { ChatMessage } from "@/lib/ai/types.ts";

interface AskRepoLensChatProps {
  repoFullName: string;
  defaultBranch: string;
  detectedTechnologies?: string[];
  activeFilePath?: string | null;
  onSelectFile?: (path: string) => void;
}

export function AskRepoLensChat({
  repoFullName,
  defaultBranch,
  detectedTechnologies = [],
  activeFilePath,
  onSelectFile,
}: AskRepoLensChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliedFiles, setSuppliedFiles] = useState<string[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto scroll on new messages or stream chunks
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isStreaming) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, initialAssistantMsg]);
    setInputValue("");
    setError(null);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/repo/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repoFullName,
          branch: defaultBranch,
          query,
          activeFile: activeFilePath,
          messages: updatedMessages,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) errMessage = errData.error.message;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      // Capture supplied files for citation validation
      const filesHeader = res.headers.get("X-Supplied-Files");
      if (filesHeader) {
        try {
          const parsed = JSON.parse(filesHeader);
          setSuppliedFiles((prev) => Array.from(new Set([...prev, ...parsed])));
        } catch {
          // ignore
        }
      }

      if (!res.body) {
        throw new Error("No response body received from chat stream.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Failed to generate answer.";
      setError(errMsg);
      // Prune empty assistant placeholder if failed
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId || msg.content.length > 0));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
            💬
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Ask RepoLens
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Grounded repository conversational assistant with file citations
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Message Thread Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center text-xl">
              🔍
            </div>
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Ask anything about {repoFullName}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Answers are grounded in repository structure, READMEs, manifests, and source files with interactive file citations.
              </p>
            </div>

            <div className="w-full max-w-lg mt-2">
              <PromptSuggestions
                technologies={detectedTechnologies}
                onSelectPrompt={(p) => handleSendMessage(p)}
                disabled={isStreaming}
              />
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              suppliedFiles={suppliedFiles}
              onSelectFile={onSelectFile}
            />
          ))
        )}

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[10px] font-semibold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 flex flex-col gap-2">
        {activeFilePath && (
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
            <span>Active file context:</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{activeFilePath}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            disabled={isStreaming}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Waiting for response..."
                : `Ask a question about ${repoFullName}... (Enter to send)`
            }
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none shadow-2xs"
          />

          <button
            type="button"
            disabled={!inputValue.trim() || isStreaming}
            onClick={() => handleSendMessage()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
          >
            {isStreaming ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <>
                <span>Send</span>
                <span>➔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
