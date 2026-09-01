"use client";

import { ArrowUp, BookOpenText, RefreshCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import type {
  HelpChatCitation,
  HelpChatMessage,
  HelpChatOutcome,
  HelpChatStreamEvent,
} from "@/lib/ai/help-chat";

type DisplayMessage = HelpChatMessage & {
  citations?: HelpChatCitation[];
  id: number;
  outcome?: HelpChatOutcome;
};

const suggestions = [
  "How long can SSO domain verification take?",
  "Why are webhooks duplicated, and how should I handle them?",
  "Does RelayDesk support SCIM group push?",
];

export function HelpChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Ready for a question");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const messageId = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  function nextId() {
    messageId.current += 1;
    return messageId.current;
  }

  function updateAssistant(id: number, updater: (message: DisplayMessage) => DisplayMessage) {
    setMessages((current) =>
      current.map((message) => (message.id === id ? updater(message) : message)),
    );
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const userMessage: DisplayMessage = {
      content: trimmed,
      id: nextId(),
      role: "user",
    };
    const assistantId = nextId();
    const assistantMessage: DisplayMessage = {
      content: "",
      id: assistantId,
      role: "assistant",
    };
    const history: HelpChatMessage[] = [
      ...messages.map(({ content, role }) => ({ content, role })),
      { content: trimmed, role: "user" },
    ];

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setError("");
    setPending(true);
    setStatus("Searching approved RelayDesk guidance");

    try {
      const response = await fetch("/api/help/answers", {
        body: JSON.stringify({ messages: history }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok || !response.body) {
        throw new Error("The help service did not accept the question.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as HelpChatStreamEvent;

          if (event.type === "start") {
            setStatus(
              event.outcome === "answered"
                ? "Writing an answer from approved sources"
                : event.outcome === "clarify"
                  ? "One detail is needed"
                  : "No verified answer was found",
            );
            updateAssistant(assistantId, (message) => ({
              ...message,
              outcome: event.outcome,
            }));
          }
          if (event.type === "delta") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              content: message.content + event.text,
            }));
          }
          if (event.type === "sources") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              citations: event.citations,
            }));
          }
          if (event.type === "done") {
            setStatus("Answer complete");
          }
          if (event.type === "error") throw new Error(event.message);
        }
        if (done) break;
      }

      responseRef.current?.focus();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "RelayDesk could not complete this answer.";
      setError(message);
      setStatus("Answer failed");
      updateAssistant(assistantId, (assistant) => ({
        ...assistant,
        content: assistant.content || "I could not complete that answer. Please try again.",
        outcome: "not_found",
      }));
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ask(input);
  }

  function reset() {
    setMessages([]);
    setInput("");
    setError("");
    setStatus("Ready for a question");
    inputRef.current?.focus();
  }

  return (
    <section className="help-chat-shell" aria-labelledby="help-chat-title">
      <div className="help-chat-intro">
        <div>
          <span><Sparkles size={14} aria-hidden="true" /> Approved knowledge only</span>
          <h1 id="help-chat-title">Ask RelayDesk</h1>
          <p>
            Get a direct answer from verified public guidance. Every supported answer
            includes the articles used to create it.
          </p>
        </div>
        {messages.length > 0 && (
          <button className="help-chat-reset" onClick={reset} type="button">
            <RefreshCcw size={14} aria-hidden="true" /> New chat
          </button>
        )}
      </div>

      <div className="help-chat-panel" aria-busy={pending}>
        <div className="help-chat-conversation">
          {messages.length === 0 ? (
            <div className="help-chat-empty">
              <BookOpenText size={26} aria-hidden="true" />
              <h2>What can we help you find?</h2>
              <p>Try a product question, a troubleshooting step, or an exact policy detail.</p>
              <div aria-label="Suggested questions" className="help-chat-suggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => void ask(suggestion)} type="button">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="help-chat-messages">
              {messages.map((message, index) => (
                <article
                  className={`help-chat-message ${message.role}`}
                  key={message.id}
                  ref={message.role === "assistant" && index === messages.length - 1 ? responseRef : undefined}
                  tabIndex={message.role === "assistant" && index === messages.length - 1 ? -1 : undefined}
                >
                  <span>{message.role === "user" ? "You" : "RelayDesk"}</span>
                  <div className="help-chat-answer">
                    {message.content || (pending ? "Reviewing the approved help center..." : "")}
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="help-chat-sources" aria-label="Sources used">
                      <strong>Sources</strong>
                      {message.citations.map((citation) => (
                        <Link href={citation.url} key={citation.sourceId}>
                          <span>{citation.sourceId}</span>
                          <b>{citation.title}</b>
                          <small>{citation.heading}</small>
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <form className="help-chat-composer" onSubmit={submit}>
          <label htmlFor="help-chat-question">Ask a RelayDesk question</label>
          <div>
            <textarea
              id="help-chat-question"
              maxLength={2000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask about SSO, exports, webhooks, invitations, or AI knowledge..."
              ref={inputRef}
              rows={2}
              value={input}
            />
            <button aria-label="Send question" disabled={pending || !input.trim()} type="submit">
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </div>
          <p>RelayDesk answers only from approved public help articles.</p>
        </form>
      </div>

      <p className="help-chat-status" role="status" aria-live="polite">
        {status}
      </p>
      {error && <p className="help-chat-error" role="alert">{error}</p>}
    </section>
  );
}
