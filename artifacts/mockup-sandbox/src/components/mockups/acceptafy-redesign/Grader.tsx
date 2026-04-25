import {
  LayoutDashboard, Mail, Shield, BarChart2, MessageCircle,
  Bell, AlertTriangle, CheckCircle, Zap, ArrowUpRight,
  BookOpen, Settings, User, Copy, Wand2, RefreshCw, Eye,
  Info, XCircle, ChevronRight, Sparkles, RotateCcw
} from "lucide-react";
import { useState } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:       "#0B0C0E",
  surface:  "#14161A",
  surface2: "#1E2025",
  border:   "#2A2D34",
  accent:   "#6DBF73",
  accentDim:"#2A4D2C",
  text:     "#F2F4F7",
  muted:    "#9EA3AE",
  faint:    "#5C6070",
  red:      "#F04545",
  amber:    "#F5A623",
  blue:     "#4A90D9",
};

const railItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Mail,            label: "Grader", active: true },
  { icon: Shield,          label: "Health" },
  { icon: BarChart2,       label: "Stats" },
  { icon: BookOpen,        label: "Academy" },
  { icon: MessageCircle,   label: "Ask AI" },
];

const ctxItems = [
  { label: "Grade email",    active: true },
  { label: "Rewrite",        badge: "AI" },
  { label: "Follow-up gen",  badge: "AI" },
  { label: "A/B Subject Lab" },
  { label: "Spam Trigger Scan" },
];

// ── Live signal card data ──────────────────────────────────────────────────
const liveSignals = [
  { label: "Spam word score",   value: "Low",    color: T.accent,  icon: CheckCircle },
  { label: "Subject length",    value: "42 chars",color: T.accent,  icon: CheckCircle },
  { label: "Link density",      value: "1 link",  color: T.accent,  icon: CheckCircle },
  { label: "Caps ratio",        value: "2%",      color: T.accent,  icon: CheckCircle },
  { label: "Predicted grade",   value: "B+",      color: T.blue,    icon: Sparkles },
];

// ── Results data (right panel) ─────────────────────────────────────────────
const topFixes = [
  { pts: "+12", title: "Rewrite subject line — avoid spam phrases", action: "Rewrite", actionIcon: Wand2,      color: T.red },
  { pts: "+8",  title: "Add personalization token {first_name}",    action: "Rewrite", actionIcon: Wand2,      color: T.amber },
  { pts: "+6",  title: "Generate a follow-up sequence for this email", action: "Generate", actionIcon: Sparkles, color: T.blue },
];

const categoryScores = [
  { label: "Subject line",    score: 72,  max: 100, color: T.amber },
  { label: "Content quality", score: 88,  max: 100, color: T.accent },
  { label: "Deliverability",  score: 91,  max: 100, color: T.accent },
  { label: "Engagement bait", score: 95,  max: 100, color: T.accent },
  { label: "Auth signals",    score: 64,  max: 100, color: T.red },
];

const SAMPLE_EMAIL = `Subject: LIMITED TIME: 50% OFF - Don't miss out!!!

Hi there,

CLICK HERE NOW to claim your exclusive discount before it expires!

This is a one-time offer you absolutely CANNOT miss. Our premium subscription is now available at half price — but only for the next 24 hours.

>>> CLAIM YOUR DISCOUNT NOW <<<

Best,
The Acceptafy Team`;

// ── Grade ring SVG ─────────────────────────────────────────────────────────
function GradeRing({ score, grade }: { score: number; grade: string }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const gradeCol = score >= 80 ? T.accent : score >= 65 ? T.blue : score >= 50 ? T.amber : T.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={r} fill="none" stroke={T.surface2} strokeWidth={10} />
        <circle cx={60} cy={60} r={r} fill="none" stroke={gradeCol} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 0.6s ease-out" }} />
        <text x={60} y={56} textAnchor="middle" fill={gradeCol} fontSize={28} fontWeight={700} fontFamily="Inter, sans-serif">{grade}</text>
        <text x={60} y={74} textAnchor="middle" fill={T.faint} fontSize={12} fontFamily="Inter, sans-serif">{score}/100</text>
      </svg>
    </div>
  );
}

// ── Inline highlighted body ────────────────────────────────────────────────
function HighlightedBody({ text }: { text: string }) {
  // Highlight some phrases
  const highlights: { phrase: string; color: string; tip: string }[] = [
    { phrase: "LIMITED TIME",       color: T.red,   tip: "Spam trigger: urgency phrase" },
    { phrase: "Don't miss out!!!",  color: T.red,   tip: "Multiple exclamation marks flagged" },
    { phrase: "CLICK HERE NOW",     color: T.red,   tip: "All-caps CTA — high spam score" },
    { phrase: "CANNOT miss",        color: T.amber, tip: "Mild urgency language" },
    { phrase: ">>> CLAIM YOUR DISCOUNT NOW <<<", color: T.red, tip: "Symbol-wrapped CTAs are spam signals" },
  ];

  let result: React.ReactNode[] = [];
  let remaining = text;

  highlights.forEach(({ phrase, color, tip }) => {
    const idx = remaining.indexOf(phrase);
    if (idx !== -1) {
      result.push(<span key={remaining.slice(0, 20)}>{remaining.slice(0, idx)}</span>);
      result.push(
        <mark key={phrase} title={tip} style={{ background: `${color}28`, color, borderRadius: 3, padding: "1px 2px", cursor: "help", borderBottom: `1px solid ${color}60` }}>
          {phrase}
        </mark>
      );
      remaining = remaining.slice(idx + phrase.length);
    }
  });
  result.push(<span key="tail">{remaining}</span>);

  return <>{result}</>;
}

export function Grader() {
  const [activeTab, setActiveTab] = useState<"input" | "results">("results");

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── Icon rail ──────────────────────────────────────────────────── */}
      <aside style={{ width: 64, minWidth: 64, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 2, background: T.surface }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 16, fontWeight: 700, color: "#0B0C0E" }}>A</div>
        {railItems.map(({ icon: Icon, label, active }) => (
          <div key={label} title={label} style={{ width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: active ? T.accentDim : "transparent", color: active ? T.accent : T.faint, border: active ? `1px solid ${T.accent}30` : "1px solid transparent" }}>
            <Icon size={20} />
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingBottom: 16 }}>
          <div style={{ position: "relative", width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: T.faint }}>
            <Bell size={20} />
            <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: T.faint }}>
            <Settings size={20} />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
            <User size={16} color={T.muted} />
          </div>
        </div>
      </aside>

      {/* ── Contextual column ──────────────────────────────────────────── */}
      <aside style={{ width: 240, minWidth: 240, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface, padding: "20px 0" }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Email Tools</p>
          {ctxItems.map(({ label, active, badge }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, cursor: "pointer", marginBottom: 2, fontSize: 13, background: active ? T.accentDim : "transparent", color: active ? T.accent : T.muted, fontWeight: active ? 500 : 400 }}>
              <span>{label}</span>
              {badge && <span style={{ fontSize: 10, background: T.accentDim, color: T.accent, borderRadius: 3, padding: "1px 5px", fontWeight: 600 }}>{badge}</span>}
            </div>
          ))}
        </div>

        {/* Live signals card */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: `${T.amber}0F`, border: `1px solid ${T.amber}30`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Zap size={13} color={T.amber} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>Live signals</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {liveSignals.map(({ label, value, color, icon: Icon }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.faint }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon size={11} color={color} />
                    <span style={{ fontSize: 11, color, fontWeight: 500 }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div style={{ padding: "20px 16px 0" }}>
          <p style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Recent</p>
          {["Q3 Launch email", "Win-back #3"].map(g => (
            <div key={g} style={{ padding: "7px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: T.muted, display: "flex", justifyContent: "space-between" }}>
              <span>{g}</span>
              <ChevronRight size={12} color={T.faint} />
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main split panel ───────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>

        {/* Left: input panel */}
        <div style={{ borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Email composer</h1>
            <button style={{ fontSize: 12, color: T.faint, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <RotateCcw size={12} /> Clear
            </button>
          </div>

          {/* Subject */}
          <div style={{ padding: "16px 24px 0" }}>
            <label style={{ fontSize: 11, color: T.faint, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject line</label>
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: T.text }}>
              LIMITED TIME: 50% OFF - Don't miss out!!!
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "14px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 11, color: T.faint, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email body</label>
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", flex: 1, fontSize: 13, lineHeight: 1.7, color: T.muted, whiteSpace: "pre-wrap", overflow: "auto" }}>
              <HighlightedBody text={SAMPLE_EMAIL.split("\n\n").slice(1).join("\n\n")} />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {[{ c: T.red, l: "High risk" }, { c: T.amber, l: "Warning" }].map(({ c, l }) => (
                <span key={l} style={{ fontSize: 10, color: c, background: `${c}18`, borderRadius: 3, padding: "2px 6px" }}>{l}</span>
              ))}
              <span style={{ fontSize: 10, color: T.faint, marginLeft: "auto" }}>Hover triggers to see detail</span>
            </div>
          </div>

          {/* Grade CTA */}
          <div style={{ padding: "0 24px 20px" }}>
            <button style={{ width: "100%", padding: "12px", background: T.accent, color: "#0B0C0E", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Zap size={16} />
              Grade this email
            </button>
          </div>
        </div>

        {/* Right: results panel */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Grade results</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ fontSize: 12, color: T.muted, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Copy size={11} /> Copy report
              </button>
              <button style={{ fontSize: 12, color: T.muted, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <RefreshCw size={11} /> Regrade
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            {/* Grade ring + hero score */}
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 24, padding: "20px 20px", background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <GradeRing score={74} grade="C+" />
              <div>
                <p style={{ fontSize: 13, color: T.faint, margin: "0 0 6px" }}>Overall score</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px", color: T.amber }}>74 / 100</p>
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>This email has deliverability risks — fix before sending</p>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button style={{ fontSize: 12, background: T.accent, color: "#0B0C0E", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Wand2 size={12} /> Fix all with AI
                  </button>
                  <button style={{ fontSize: 12, background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                    <Eye size={12} /> Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Top 3 fixes */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Top 3 fixes · +26 pts potential</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topFixes.map(({ pts, title, action, actionIcon: ActionIcon, color }) => (
                  <div key={title} style={{ display: "flex", gap: 12, padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <div style={{ background: `${color}20`, color, borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, flexShrink: 0, height: "fit-content" }}>{pts}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, margin: 0, color: T.text }}>{title}</p>
                    </div>
                    <button style={{ fontSize: 12, color: T.accent, background: T.accentDim, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <ActionIcon size={11} /> {action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div>
              <p style={{ fontSize: 12, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Category breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categoryScores.map(({ label, score, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{score}</span>
                    </div>
                    <div style={{ height: 5, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 3, transition: "width 0.6s ease-out" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
