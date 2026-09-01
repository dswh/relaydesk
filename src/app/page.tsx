import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "RelayDesk brings every customer signal, approved source, SLA, and response decision into one accountable support workspace.",
  title: "AI support operations with an audit trail",
};

const operatingSteps = [
  {
    number: "01",
    title: "See the whole signal",
    copy: "Conversation history, account context, urgency, and ownership arrive together, so agents start from understanding.",
  },
  {
    number: "02",
    title: "Ground the decision",
    copy: "RelayDesk finds approved policies and knowledge, then shows exactly what supports every suggested response.",
  },
  {
    number: "03",
    title: "Keep a human accountable",
    copy: "Agents review, edit, send, and resolve. Every action stays visible to the team that owns the outcome.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav" aria-label="Primary navigation">
          <Link href="/" aria-label="RelayDesk home">
            <BrandMark />
          </Link>
          <div className="landing-nav-links">
            <a href="#operating-model">How it works</a>
            <a href="#control-plane">Platform</a>
            <Link href="/blog">Field notes</Link>
            <Link className="landing-nav-cta" href="/inbox">
              Open workspace <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-kicker">
              <span /> AI support operations
            </p>
            <h1>Turn every support signal into an accountable response.</h1>
            <p className="landing-lede">
              RelayDesk brings the customer, the queue, approved knowledge, and the
              next action into one operating surface. Your team moves faster without
              giving up judgment.
            </p>
            <div className="landing-actions">
              <Link className="landing-primary-action" href="/inbox">
                Enter the live workspace <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a className="landing-text-action" href="#operating-model">
                See the operating model
              </a>
            </div>
            <div className="landing-assurance" aria-label="Product assurances">
              <span><ShieldCheck size={14} aria-hidden="true" /> Approved sources</span>
              <span><FileCheck2 size={14} aria-hidden="true" /> Complete audit trail</span>
              <span><Gauge size={14} aria-hidden="true" /> SLA aware</span>
            </div>
          </div>

          <div className="relay-visual" aria-label="A support request moving through RelayDesk">
            <div className="relay-visual-header">
              <span><i /> Live operation</span>
              <small>RD-1842</small>
            </div>

            <article className="relay-signal-card">
              <span className="relay-avatar">MC</span>
              <div>
                <p>Maya at Atlas Health</p>
                <strong>SSO verification is blocking 120 agents</strong>
              </div>
              <time>4m</time>
            </article>

            <div className="relay-track" aria-hidden="true">
              <span className="relay-pulse" />
              <i />
            </div>

            <div className="relay-decisions">
              <div>
                <span><CheckCircle2 size={14} /></span>
                <p>Context joined</p>
                <small>Enterprise, SLA at risk</small>
              </div>
              <div>
                <span><ShieldCheck size={14} /></span>
                <p>Policy matched</p>
                <small>2 approved sources</small>
              </div>
              <div>
                <span><Sparkles size={14} /></span>
                <p>Reply ready</p>
                <small>Human review required</small>
              </div>
            </div>

            <article className="relay-outcome-card">
              <span><Clock3 size={17} aria-hidden="true" /></span>
              <div>
                <p>Next accountable action</p>
                <strong>Restart verification and confirm before training</strong>
              </div>
              <CheckCircle2 size={19} aria-hidden="true" />
            </article>
          </div>
        </div>

        <div className="landing-proof" aria-label="RelayDesk operating principles">
          <p>Built for teams that measure the quality of the decision, not just ticket volume.</p>
          <div>
            <span><strong>One</strong> shared queue</span>
            <span><strong>Every</strong> source visible</span>
            <span><strong>Human</strong> confirms send</span>
          </div>
        </div>
      </section>

      <section className="operating-model" id="operating-model">
        <div className="landing-section-heading">
          <p>Operating model</p>
          <h2>The queue is not the work. The decision is.</h2>
          <span>
            RelayDesk reduces the distance between a customer signal and a defensible
            next action.
          </span>
        </div>
        <div className="operating-steps">
          {operatingSteps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="control-plane" id="control-plane">
        <div className="control-plane-copy">
          <p>Support control plane</p>
          <h2>Operational clarity for every role around the queue.</h2>
          <p>
            Agents get context. Leads get service signals. Knowledge owners see what
            customers cannot find. Platform teams get a traceable path from failure to
            correction.
          </p>
          <Link href="/inbox">
            Explore the product <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="control-plane-grid">
          <article>
            <span>Queue</span>
            <strong>SLA risk before it becomes a breach</strong>
            <small>Priority, ownership, and waiting time in one view</small>
          </article>
          <article>
            <span>Knowledge</span>
            <strong>Approved guidance at the point of response</strong>
            <small>Citations stay attached to the draft they support</small>
          </article>
          <article>
            <span>Quality</span>
            <strong>Answers measured against explicit policy</strong>
            <small>Evaluation that can improve without moving the rubric</small>
          </article>
          <article>
            <span>Operations</span>
            <strong>Failures that lead to verified corrections</strong>
            <small>Signals, traces, and regression evidence stay connected</small>
          </article>
        </div>
      </section>

      <section className="landing-field-notes" aria-labelledby="field-notes-heading">
        <div className="landing-field-notes-heading">
          <p><BookOpen size={15} aria-hidden="true" /> RelayDesk field notes</p>
          <h2 id="field-notes-heading">Deep guidance for teams building reliable support systems.</h2>
          <Link href="/blog">Browse all field notes <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
        <div className="landing-field-notes-grid">
          {blogPosts.filter((post) => post.featured).map((post, index) => (
            <article key={post.id}>
              <span>{String(index + 1).padStart(2, "0")} / {post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <Link href={`/blog/${post.slug}`}>Read article <ArrowRight size={13} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <p>Fast is useful. Accountable is durable.</p>
        <h2>Give your support team both.</h2>
        <Link href="/inbox">
          Open RelayDesk <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <footer className="landing-footer">
        <BrandMark />
        <p>AI customer support operations for reliable service teams.</p>
        <div>
          <Link href="/blog">Field notes</Link>
          <Link href="/inbox">Product workspace</Link>
        </div>
      </footer>
    </main>
  );
}
