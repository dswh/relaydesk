export type Priority = "urgent" | "high" | "normal" | "low";
export type TicketStatus = "open" | "pending" | "resolved";
export type Channel = "email" | "chat" | "api";

export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: "Enterprise" | "Scale" | "Growth" | "Starter";
  initials: string;
  since: string;
  timezone: string;
  health: "healthy" | "watch" | "risk";
  lifetimeValue: string;
};

export type Message = {
  id: string;
  author: string;
  role: "customer" | "agent" | "system";
  body: string;
  timestamp: string;
};

export type KnowledgeSource = {
  id: string;
  title: string;
  section: string;
  relevance: number;
};

export type Ticket = {
  id: string;
  subject: string;
  preview: string;
  customer: Customer;
  priority: Priority;
  status: TicketStatus;
  channel: Channel;
  assignee: string | null;
  updatedAt: string;
  waitingMinutes: number;
  slaMinutes: number;
  tags: string[];
  intent: string;
  sentiment: "positive" | "neutral" | "frustrated";
  summary: string;
  messages: Message[];
  sources: KnowledgeSource[];
  suggestedReply: string;
};

export type QueueFilter = "all" | "mine" | "unassigned" | "urgent";

export type QueueSummary = {
  all: number;
  mine: number;
  unassigned: number;
  urgent: number;
};
