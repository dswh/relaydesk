"use client";

import {
  ArrowUp,
  AtSign,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Inbox,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { getSlaProgress, getSlaState } from "@/lib/inbox";
import type { QueueFilter, QueueSummary, Ticket } from "@/lib/types";

const filters: { id: QueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Unassigned" },
  { id: "urgent", label: "Urgent" },
];

const compactCount = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function channelIcon(channel: Ticket["channel"]) {
  if (channel === "chat") return <MessageCircle size={13} aria-hidden="true" />;
  if (channel === "api") return <Zap size={13} aria-hidden="true" />;
  return <Mail size={13} aria-hidden="true" />;
}

export function InboxWorkspace({
  initialFilter,
  initialQuery,
  initialSummary,
  initialTickets,
}: {
  initialFilter: QueueFilter;
  initialQuery: string;
  initialSummary: QueueSummary;
  initialTickets: Ticket[];
}) {
  const router = useRouter();
  const [ticketState, setTicketState] = useState(initialTickets);
  const [filter, setFilter] = useState<QueueFilter>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState(initialTickets[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [generatedCitationIds, setGeneratedCitationIds] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"fixture" | "gateway" | null>(null);
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();

  const summary = initialSummary;
  const visibleTickets = ticketState;
  const selectedTicket =
    ticketState.find((ticket) => ticket.id === selectedId) ?? visibleTickets[0];

  useEffect(() => {
    if (query === initialQuery && filter === initialFilter) return;

    const timeout = window.setTimeout(() => {
      const parameters = new URLSearchParams();
      if (query.trim()) parameters.set("q", query.trim());
      if (filter !== "all") parameters.set("filter", filter);
      const destination = parameters.size ? `/inbox?${parameters}` : "/inbox";
      startSearchTransition(() => router.replace(destination, { scroll: false }));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filter, initialFilter, initialQuery, query, router]);

  async function selectTicket(id: string) {
    setSelectedId(id);
    setDraft("");
    setGeneratedCitationIds([]);
    setGenerationMode(null);
    setNotice(null);

    const ticket = ticketState.find((item) => item.id === id);
    if (!ticket || ticket.detailsLoaded !== false) return;

    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Ticket detail request failed with ${response.status}`);
      const payload = (await response.json()) as { data: Ticket };
      setTicketState((current) =>
        current.map((item) => (item.id === id ? payload.data : item)),
      );
    } catch {
      setNotice("Could not load the full conversation. Try again.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function assignToMe() {
    if (!selectedTicket) return;
    setTicketState((current) =>
      current.map((ticket) =>
        ticket.id === selectedTicket.id ? { ...ticket, assignee: "You" } : ticket,
      ),
    );
    setNotice(`${selectedTicket.id} assigned to you`);
  }

  function resolveTicket() {
    if (!selectedTicket) return;
    setTicketState((current) =>
      current.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: "resolved", waitingMinutes: 0 }
          : ticket,
      ),
    );
    setNotice(`${selectedTicket.id} resolved`);
  }

  async function generateReply() {
    if (!selectedTicket || !selectedTicket.sources.length) return;
    setIsGenerating(true);
    setDraft("");
    setGeneratedCitationIds([]);
    setGenerationMode(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(selectedTicket.id)}/suggested-reply`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        data?: {
          citationIds: string[];
          mode: "fixture" | "gateway";
          text: string;
        };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? `Reply generation failed with ${response.status}`);
      }
      setDraft(payload.data.text);
      setGeneratedCitationIds(payload.data.citationIds);
      setGenerationMode(payload.data.mode);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate a grounded reply.");
    } finally {
      setIsGenerating(false);
    }
  }

  function sendReply() {
    if (!selectedTicket || !draft.trim()) return;
    setTicketState((current) =>
      current.map((ticket) =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              status: composerMode === "reply" ? "pending" : ticket.status,
              messages: [
                ...ticket.messages,
                {
                  id: `msg_${ticket.id}_${ticket.messages.length + 1}`,
                  author: composerMode === "reply" ? "Arun S." : "Internal note",
                  role: "agent",
                  timestamp: "Just now",
                  body: draft.trim(),
                },
              ],
            }
          : ticket,
      ),
    );
    setDraft("");
    setGeneratedCitationIds([]);
    setGenerationMode(null);
    setNotice(composerMode === "reply" ? "Reply sent" : "Note added");
  }

  return (
    <div className="inbox-screen">
      <header className="inbox-header">
        <div>
          <div className="page-kicker"><span /> Live queue</div>
          <h1>Inbox</h1>
        </div>
        <div className="header-actions">
          <div className="coverage-pill">
            <span className="coverage-avatars"><i>AS</i><i>SR</i><i>LK</i></span>
            <span><strong>3 agents</strong> covering now</span>
          </div>
          <button className="icon-button" type="button" aria-label="More inbox actions">
            <MoreHorizontal size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="signal-strip" role="status">
        <span className="signal-strip-icon"><Zap size={15} aria-hidden="true" /></span>
        <p><strong>Queue signal:</strong> First response time is 14% faster than last week.</p>
        <span className="signal-value">11m median</span>
      </div>

      <div className="inbox-grid">
        <section className="queue-panel" aria-busy={isSearching} aria-label="Ticket queue">
          <div className="queue-toolbar">
            <label className="queue-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search conversations</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations"
                type="search"
                value={query}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </label>
            <div className="queue-filters" aria-label="Queue filters">
              {filters.map((item) => (
                <button
                  aria-pressed={filter === item.id}
                  className={filter === item.id ? "active" : ""}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  type="button"
                >
                  {item.label}
                  <span>{compactCount.format(summary[item.id])}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="queue-meta">
            <span>
              {isSearching ? "Refreshing queue" : `${visibleTickets.length} conversations`}
            </span>
            <button type="button">Priority <ChevronDown size={13} aria-hidden="true" /></button>
          </div>

          <div className="ticket-list">
            {visibleTickets.map((ticket) => {
              const selected = ticket.id === selectedTicket?.id;
              const slaState = getSlaState(ticket);
              return (
                <button
                  aria-pressed={selected}
                  className={`ticket-row ${selected ? "selected" : ""}`}
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  type="button"
                >
                  <span className={`priority-pin ${ticket.priority}`} aria-label={`${ticket.priority} priority`} />
                  <span className="ticket-avatar">{ticket.customer.initials}</span>
                  <span className="ticket-row-body">
                    <span className="ticket-row-topline">
                      <strong>{ticket.customer.name}</strong>
                      <time>{ticket.updatedAt}</time>
                    </span>
                    <span className="ticket-subject">{ticket.subject}</span>
                    <span className="ticket-preview">{ticket.preview}</span>
                    <span className="ticket-row-footer">
                      <span className="ticket-channel">{channelIcon(ticket.channel)} {ticket.channel}</span>
                      {ticket.assignee ? <span>{ticket.assignee}</span> : <span className="unassigned">Unassigned</span>}
                      {ticket.status === "pending" && <span className="pending-label">Pending</span>}
                    </span>
                  </span>
                  <span className={`sla-line ${slaState}`}>
                    <i style={{ width: `${getSlaProgress(ticket)}%` }} />
                  </span>
                </button>
              );
            })}
            {visibleTickets.length === 0 && (
              <div className="empty-queue">
                <Inbox size={24} aria-hidden="true" />
                <strong>No matching conversations</strong>
                <span>Try a different customer, topic, or queue.</span>
              </div>
            )}
          </div>
        </section>

        {selectedTicket ? (
          <>
            <section className="conversation-panel" aria-label={`Conversation ${selectedTicket.id}`}>
              <div className="conversation-header">
                <div>
                  <span className="ticket-id">{selectedTicket.id}</span>
                  <h2>{selectedTicket.subject}</h2>
                  <p>{selectedTicket.customer.name} at {selectedTicket.customer.company}</p>
                </div>
                <div className="conversation-actions">
                  {selectedTicket.assignee !== "You" && (
                    <button className="secondary-button" type="button" onClick={assignToMe}>
                      <UserPlus size={15} aria-hidden="true" /> Assign to me
                    </button>
                  )}
                  <button
                    className={`resolve-button ${selectedTicket.status === "resolved" ? "done" : ""}`}
                    disabled={selectedTicket.status === "resolved"}
                    onClick={resolveTicket}
                    type="button"
                  >
                    <Check size={16} aria-hidden="true" />
                    {selectedTicket.status === "resolved" ? "Resolved" : "Resolve"}
                  </button>
                  <button className="icon-button" type="button" aria-label="More conversation actions">
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {notice && (
                <div className="notice" role="status">
                  <Check size={14} aria-hidden="true" /> {notice}
                  <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="conversation-scroll">
                <div className="summary-card">
                  <span className="summary-icon"><Sparkles size={15} aria-hidden="true" /></span>
                  <div>
                    <span className="eyebrow">Conversation brief</span>
                    <p>{selectedTicket.summary}</p>
                  </div>
                  <span className="confidence">94% confidence</span>
                </div>

                <div className="message-thread">
                  {isDetailLoading && (
                    <div className="conversation-loading" role="status">
                      Loading the complete conversation
                    </div>
                  )}
                  {selectedTicket.messages.map((message) => (
                    <article className={`message ${message.role}`} key={message.id}>
                      <span className="message-avatar">
                        {message.role === "system" ? <Bot size={16} aria-hidden="true" /> : message.author.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </span>
                      <div className="message-content">
                        <header>
                          <strong>{message.author}</strong>
                          <time>{message.timestamp}</time>
                        </header>
                        <p>{message.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="composer">
                <div className="composer-tabs">
                  <button className={composerMode === "reply" ? "active" : ""} onClick={() => setComposerMode("reply")} type="button">
                    Reply
                  </button>
                  <button className={composerMode === "note" ? "active" : ""} onClick={() => setComposerMode("note")} type="button">
                    Internal note
                  </button>
                  <span />
                  <button className="composer-to" type="button">
                    <AtSign size={13} aria-hidden="true" /> {selectedTicket.customer.email}
                  </button>
                </div>
                <div className="composer-body">
                  {isGenerating ? (
                    <div className="draft-loading" role="status">
                      <span /><span /><span /> Reviewing the conversation and approved sources
                    </div>
                  ) : (
                    <>
                      <textarea
                        aria-label={composerMode === "reply" ? "Reply to customer" : "Internal note"}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={composerMode === "reply" ? "Write a reply, or generate one from approved sources..." : "Add context for your team..."}
                        value={draft}
                      />
                      {generatedCitationIds.length > 0 && generationMode && (
                        <div className="grounding-note" role="status">
                          <ShieldCheck size={13} aria-hidden="true" />
                          Grounded in {generatedCitationIds.length} approved {generatedCitationIds.length === 1 ? "source" : "sources"}
                          <span>{generationMode === "gateway" ? "AI Gateway" : "Verified fixture"}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="composer-footer">
                  <div className="composer-tools">
                    <button type="button" aria-label="Attach a file"><Paperclip size={17} aria-hidden="true" /></button>
                    <button type="button" aria-label="Insert saved reply"><FileText size={17} aria-hidden="true" /></button>
                    <button
                      className="ai-button"
                      disabled={isGenerating || !selectedTicket.sources.length}
                      onClick={generateReply}
                      type="button"
                    >
                      <Sparkles size={15} aria-hidden="true" /> Generate grounded reply
                    </button>
                  </div>
                  <button className="send-button" disabled={!draft.trim()} onClick={sendReply} type="button">
                    {composerMode === "reply" ? "Send reply" : "Add note"}
                    <ArrowUp size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>

            <aside className="context-panel" aria-label="Customer and conversation context">
              <section className="customer-profile">
                <span className="profile-avatar">{selectedTicket.customer.initials}</span>
                <div>
                  <h3>{selectedTicket.customer.name}</h3>
                  <p>{selectedTicket.customer.company}</p>
                </div>
                <button type="button" aria-label="More customer actions"><MoreHorizontal size={17} aria-hidden="true" /></button>
              </section>

              <section className="context-section">
                <h4>Conversation</h4>
                <dl className="context-list">
                  <div><dt>Status</dt><dd><span className={`status-dot ${selectedTicket.status}`} /> {selectedTicket.status}</dd></div>
                  <div><dt>Priority</dt><dd className={`priority-text ${selectedTicket.priority}`}>{selectedTicket.priority}</dd></div>
                  <div><dt>Assignee</dt><dd>{selectedTicket.assignee ?? "Unassigned"}</dd></div>
                  <div><dt>Intent</dt><dd>{selectedTicket.intent}</dd></div>
                </dl>
                <div className={`sla-card ${getSlaState(selectedTicket)}`}>
                  <div>
                    <span><Clock3 size={14} aria-hidden="true" /> First response SLA</span>
                    <strong>{Math.max(0, selectedTicket.slaMinutes - selectedTicket.waitingMinutes)}m remaining</strong>
                  </div>
                  <span className="sla-track"><i style={{ width: `${getSlaProgress(selectedTicket)}%` }} /></span>
                </div>
              </section>

              <section className="context-section">
                <h4>Customer</h4>
                <dl className="context-list">
                  <div><dt>Plan</dt><dd>{selectedTicket.customer.plan}</dd></div>
                  <div><dt>Customer since</dt><dd>{selectedTicket.customer.since}</dd></div>
                  <div><dt>Local time</dt><dd>{selectedTicket.customer.timezone}</dd></div>
                  <div><dt>Lifetime value</dt><dd>{selectedTicket.customer.lifetimeValue}</dd></div>
                </dl>
              </section>

              <section className="context-section sources-section">
                <div className="section-title-row">
                  <h4>Grounding sources</h4>
                  <span><ShieldCheck size={13} aria-hidden="true" /> approved</span>
                </div>
                {selectedTicket.sources.length ? (
                  <div className="source-list">
                    {selectedTicket.sources.map((source) => (
                      <button
                        className={`source-card ${generatedCitationIds.includes(source.id) ? "cited" : ""}`}
                        key={source.id}
                        type="button"
                      >
                        <span className="source-icon"><FileText size={15} aria-hidden="true" /></span>
                        <span>
                          <strong>{source.title}</strong>
                          <small>{source.section}</small>
                        </span>
                        <i>{source.relevance}%</i>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-sources">No source is needed for this conversation.</p>
                )}
              </section>

              <section className="context-section tag-section">
                <h4>Tags</h4>
                <div className="tag-list">
                  {selectedTicket.tags.map((tag) => <span key={tag}><Tag size={11} aria-hidden="true" /> {tag}</span>)}
                  <button type="button" aria-label="Add tag">+</button>
                </div>
              </section>
            </aside>
          </>
        ) : (
          <section className="no-selection">
            <Inbox size={28} aria-hidden="true" />
            <h2>Select a conversation</h2>
            <p>Choose a ticket from the queue to review its history and customer context.</p>
          </section>
        )}
      </div>
    </div>
  );
}
