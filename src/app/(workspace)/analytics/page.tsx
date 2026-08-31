import { ArrowDownRight, ArrowUpRight, Clock3, Gauge, MessagesSquare, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
};

const bars = [42, 51, 47, 64, 59, 72, 69, 78, 83, 76, 88, 92, 84, 96];

export default function AnalyticsPage() {
  return (
    <div className="section-screen analytics-screen">
      <header className="section-header">
        <div>
          <div className="page-kicker"><span /> Service performance</div>
          <h1>Analytics</h1>
          <p>Understand customer effort, team load, and answer quality.</p>
        </div>
        <button className="secondary-button date-button" type="button">Last 30 days</button>
      </header>

      <div className="metric-grid">
        <section className="metric-card">
          <span className="metric-icon teal"><Clock3 size={17} aria-hidden="true" /></span>
          <span>First response</span>
          <strong>11m 24s</strong>
          <small className="positive"><ArrowDownRight size={13} aria-hidden="true" /> 14.2% faster</small>
        </section>
        <section className="metric-card">
          <span className="metric-icon blue"><MessagesSquare size={17} aria-hidden="true" /></span>
          <span>Conversations resolved</span>
          <strong>1,284</strong>
          <small className="positive"><ArrowUpRight size={13} aria-hidden="true" /> 8.7% more</small>
        </section>
        <section className="metric-card">
          <span className="metric-icon coral"><Gauge size={17} aria-hidden="true" /></span>
          <span>SLA attainment</span>
          <strong>96.8%</strong>
          <small className="positive"><ArrowUpRight size={13} aria-hidden="true" /> 1.9 points</small>
        </section>
        <section className="metric-card">
          <span className="metric-icon violet"><Sparkles size={17} aria-hidden="true" /></span>
          <span>AI assisted</span>
          <strong>64%</strong>
          <small>82% accepted after edit</small>
        </section>
      </div>

      <div className="analytics-grid">
        <section className="volume-card">
          <header><div><span className="eyebrow">Conversation volume</span><h2>Demand and resolution</h2></div><span className="chart-legend"><i /> Resolved</span></header>
          <div className="volume-chart" aria-label="Resolved conversation volume over 14 days">
            {bars.map((bar, index) => <span key={`${bar}-${index}`} style={{ height: `${bar}%` }}><i>{bar}</i></span>)}
          </div>
          <div className="chart-labels"><span>Aug 18</span><span>Aug 24</span><span>Aug 31</span></div>
        </section>
        <section className="quality-card">
          <span className="eyebrow">Answer quality</span>
          <h2>Grounded replies</h2>
          <div className="quality-ring" style={{ "--score": "91%" } as React.CSSProperties}>
            <span><strong>91</strong><small>quality score</small></span>
          </div>
          <dl>
            <div><dt>Source coverage</dt><dd>94%</dd></div>
            <div><dt>Policy adherence</dt><dd>98%</dd></div>
            <div><dt>Helpful resolution</dt><dd>86%</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
