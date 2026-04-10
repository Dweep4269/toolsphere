"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChatMessage,
  ChatSession,
  createChat,
  updateChat,
  getChat,
  getAllChats,
  deleteChat,
} from "@/lib/chat-store";
import "./nlp.css";

type NlpResponse = {
  type: "question" | "recommendation";
  text: string;
  items?: string[];
};

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NlpSearch() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<NlpResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);

  const endRef = useRef<HTMLDivElement>(null);

  const refreshHistory = useCallback(() => {
    setHistory(getAllChats());
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastResponse]);

  function startNewChat() {
    const s = createChat();
    setSession(s);
    setMessages([]);
    setLastResponse(null);
    setInput("");
    setShowHistory(false);
    refreshHistory();
  }

  function loadChat(id: string) {
    const s = getChat(id);
    if (!s) return;
    setSession(s);
    setMessages(s.messages);
    setLastResponse(null);
    setShowHistory(false);

    const lastAssistant = [...s.messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      try {
        setLastResponse(JSON.parse(lastAssistant.content));
      } catch {}
    }
  }

  function handleDeleteChat(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteChat(id);
    refreshHistory();
    if (session?.id === id) {
      setSession(null);
      setMessages([]);
      setLastResponse(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentSession = session;
    if (!currentSession) {
      currentSession = createChat();
      setSession(currentSession);
    }

    const userMessage: ChatMessage = { role: "user", content: input };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);
    setLastResponse(null);

    updateChat(currentSession.id, newHistory);
    refreshHistory();

    try {
      const response = await fetch("/api/search/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const botData = data.data as NlpResponse;
        setLastResponse(botData);
        const fullMessages: ChatMessage[] = [...newHistory, { role: "assistant", content: JSON.stringify(botData) }];
        setMessages(fullMessages);
        updateChat(currentSession.id, fullMessages);
        refreshHistory();
      } else {
        setLastResponse({ type: "question", text: "I'm having trouble connecting right now. Try again?" });
      }
    } catch {
      setLastResponse({ type: "question", text: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const hasConversation = messages.length > 0 || isLoading || lastResponse;
  const nonEmptyHistory = history.filter((h) => h.messages.length > 0);

  return (
    <section className="nlp-hero-section">
      <div className="nlp-container">

        {/* History toggle + New chat controls */}
        <div className="nlp-topbar">
          {nonEmptyHistory.length > 0 && (
            <button
              type="button"
              className="nlp-history-toggle"
              onClick={() => setShowHistory(!showHistory)}
              title="Chat history"
            >
              <HistoryIcon />
              <span>{nonEmptyHistory.length}</span>
            </button>
          )}
          {hasConversation && (
            <button type="button" className="nlp-new-chat" onClick={startNewChat} title="New chat">
              <PlusIcon /> <span>New</span>
            </button>
          )}
        </div>

        {/* History sidebar */}
        {showHistory && nonEmptyHistory.length > 0 && (
          <div className="nlp-history-panel">
            <div className="nlp-history-header">
              <span>Recent Conversations</span>
              <button type="button" className="nlp-history-close" onClick={() => setShowHistory(false)}>&times;</button>
            </div>
            <div className="nlp-history-list">
              {nonEmptyHistory.map((h) => (
                <button
                  type="button"
                  key={h.id}
                  className={`nlp-history-item ${session?.id === h.id ? "nlp-history-active" : ""}`}
                  onClick={() => loadChat(h.id)}
                >
                  <div className="nlp-history-title">{h.title}</div>
                  <div className="nlp-history-meta">
                    <span>{h.messages.filter((m) => m.role === "user").length} messages</span>
                    <span>{formatTime(h.updatedAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="nlp-history-delete"
                    onClick={(e) => handleDeleteChat(e, h.id)}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main area */}
        {!hasConversation ? (
          <div className="nlp-intro">
            <h1 className="nlp-title">What do you want to <span className="nlp-accent">build</span>?</h1>
            <p className="nlp-subtitle">Tell me your goal, and I&apos;ll route you to the exact AI tool, MCP, or CLI skill you need.</p>
          </div>
        ) : (
          <div className="nlp-conversation">
            {messages.map((m, idx) => {
              if (m.role === "user") {
                return (
                  <div key={idx} className="nlp-bubble nlp-bubble-user">
                    {m.content}
                  </div>
                );
              }
              try {
                const parsed = JSON.parse(m.content) as NlpResponse;
                const formattedText = parsed.text.replace(
                  /\[([^\]]+)\]\(([^)]+)\)/g,
                  '<a href="$2" style="color:var(--gold);text-decoration:underline;">$1</a>'
                );

                return (
                  <div key={idx} className="nlp-bubble nlp-bubble-bot">
                    <p dangerouslySetInnerHTML={{ __html: formattedText }}></p>
                    {parsed.items && parsed.items.length > 0 && (
                      <div className="nlp-rec-cards">
                        {parsed.items.map((item, i) => (
                          <div key={i} className="nlp-rec-card">
                            <div className="nlp-rec-icon"><BoltIcon /></div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } catch {
                return null;
              }
            })}
            {isLoading && (
              <div className="nlp-bubble nlp-bubble-bot nlp-loading">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="nlp-form">
          <input
            type="text"
            className="nlp-input"
            placeholder="e.g. I need to analyze my local server logs with Claude..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" className="nlp-submit" disabled={!input.trim() || isLoading}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

      </div>
    </section>
  );
}
