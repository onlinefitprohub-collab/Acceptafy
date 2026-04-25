import { 
  LayoutDashboard, Mail, Shield, BarChart2, MessageCircle,
  Bell, Search, ChevronRight, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Zap, Award, Star, ArrowUpRight,
  MailCheck, Globe, Activity, BookOpen, Settings, User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

// ── Icon rail items ────────────────────────────────────────────────────────
const railItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Mail,            label: "Grader" },
  { icon: Shield,          label: "Health" },
  { icon: BarChart2,       label: "Stats" },
  { icon: BookOpen,        label: "Academy" },
  { icon: MessageCircle,   label: "Ask AI" },
];

// ── Contextual nav items ───────────────────────────────────────────────────
const ctxItems = [
  { label: "Overview",          active: true },
  { label: "Sender Reputation" },
  { label: "Inbox Placement" },
  { label: "Postmaster Data" },
  { label: "Email Sequences" },
];

// ── Metric cards ──────────────────────────────────────────────────────────
const metrics = [
  { label: "Avg Email Grade",    value: "B+",   sub: "+4 pts this week",  trend: "up",   icon: Mail },
  { label: "Inbox Placement",    value: "92%",  sub: "↑ 3% vs last 7d",  trend: "up",   icon: MailCheck },
  { label: "Domain Reputation",  value: "High", sub: "Google Postmaster", trend: "ok",   icon: Globe },
  { label: "Active Alerts",      value: "2",    sub: "1 critical",        trend: "warn", icon: AlertTriangle },
];

// ── Recent grades ──────────────────────────────────────────────────────────
const recentGrades = [
  { subject: "Q3 Product Launch – Final",     grade: "A",  score: 92, time: "2h ago" },
  { subject: "Win-back Series: Email 3 of 5", grade: "B+", score: 84, time: "5h ago" },
  { subject: "Weekly Newsletter – Aug",       grade: "B-", score: 74, time: "1d ago" },
  { subject: "Promo: Summer Sale Ends Soon",  grade: "C+", score: 68, time: "2d ago" },
];

const gradeColor = (g: string) => {
  if (g.startsWith("A")) return T.accent;
  if (g.startsWith("B")) return T.blue;
  if (g.startsWith("C")) return T.amber;
  return T.red;
};

// ── Top issues ─────────────────────────────────────────────────────────────
const topIssues = [
  { sev: "critical", label: "SPF record missing on mktg.acme.com",      tool: "DNS Checker" },
  { sev: "warning",  label: "Spam trigger words in 3 recent emails",     tool: "Grader" },
  { sev: "info",     label: "DMARC policy set to p=none — upgrade to quarantine", tool: "DNS Checker" },
];

const sevColor = (s: string) => s === "critical" ? T.red : s === "warning" ? T.amber : T.blue;
const sevLabel = (s: string) => s === "critical" ? "!" : s === "warning" ? "△" : "i";

// ── XP / tier ──────────────────────────────────────────────────────────────
const xp = { current: 1340, next: 1500, tier: "Pro", label: "160 XP to Expert" };

export function Dashboard() {
  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── Icon rail (64px) ─────────────────────────────────────────── */}
      <aside style={{ width: 64, minWidth: 64, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 2, background: T.surface }}>
        {/* Logo mark */}
        <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 16, fontWeight: 700, color: "#0B0C0E" }}>A</div>

        {railItems.map(({ icon: Icon, label, active }) => (
          <div key={label} title={label} style={{
            width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: active ? T.accentDim : "transparent",
            color: active ? T.accent : T.faint,
            border: active ? `1px solid ${T.accent}30` : "1px solid transparent",
            transition: "all 0.15s",
          }}>
            <Icon size={20} />
          </div>
        ))}

        {/* Bottom: alerts + settings */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingBottom: 16 }}>
          <div style={{ position: "relative", width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: T.faint, cursor: "pointer" }}>
            <Bell size={20} />
            <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: T.faint, cursor: "pointer" }}>
            <Settings size={20} />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
            <User size={16} color={T.muted} />
          </div>
        </div>
      </aside>

      {/* ── Contextual column (240px) ─────────────────────────────────── */}
      <aside style={{ width: 240, minWidth: 240, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface, padding: "20px 0" }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Dashboard</p>
          {ctxItems.map(({ label, active }) => (
            <div key={label} style={{
              padding: "8px 12px", borderRadius: 6, cursor: "pointer", marginBottom: 2, fontSize: 13,
              background: active ? T.accentDim : "transparent",
              color: active ? T.accent : T.muted,
              fontWeight: active ? 500 : 400,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* XP progress */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Your progress</span>
            <span style={{ fontSize: 11, color: T.accent, background: T.accentDim, borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>{xp.tier}</span>
          </div>
          <Progress value={(xp.current / xp.next) * 100} style={{ height: 4, background: T.surface2 }} />
          <p style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>{xp.current} / {xp.next} XP · {xp.label}</p>
        </div>

        {/* Quick actions */}
        <div style={{ padding: "20px 16px 0" }}>
          <p style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Quick actions</p>
          {[
            { label: "Grade an email", icon: Mail },
            { label: "Check domain health", icon: Shield },
            { label: "Ask Acceptafy", icon: MessageCircle },
          ].map(({ label, icon: Icon }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, cursor: "pointer", marginBottom: 2, fontSize: 13, color: T.muted }}>
              <Icon size={15} color={T.faint} />
              {label}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, margin: 0 }}>Mission Control</h1>
            <p style={{ fontSize: 13, color: T.faint, margin: "4px 0 0" }}>Sunday, 27 Apr 2025 · acme.com</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              <Search size={14} color={T.faint} />
              <span style={{ fontSize: 13, color: T.faint }}>Search or ⌘K</span>
            </div>
            <button style={{ background: T.accent, color: "#0B0C0E", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={14} />
              Grade email
            </button>
          </div>
        </div>

        {/* Metric cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {metrics.map(({ label, value, sub, trend, icon: Icon }) => (
            <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: T.faint, margin: 0 }}>{label}</p>
                <Icon size={15} color={T.faint} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: trend === "warn" ? T.amber : T.text, fontVariantNumeric: "tabular-nums" }}>{value}</p>
              <p style={{ fontSize: 12, color: trend === "up" ? T.accent : trend === "warn" ? T.amber : T.muted, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                {trend === "up" ? <TrendingUp size={12} /> : trend === "warn" ? <AlertTriangle size={12} /> : <CheckCircle size={12} color={T.accent} />}
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column middle row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 28 }}>
          {/* Recent grades */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Recent Grades</h2>
              <button style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentGrades.map(({ subject, grade, score, time }) => (
                <div key={subject} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: "transparent" }}>
                  {/* Grade ring placeholder */}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${gradeColor(grade)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gradeColor(grade) }}>{grade}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, margin: 0, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subject}</p>
                    <p style={{ fontSize: 11, color: T.faint, margin: "2px 0 0" }}>{score}/100 · {time}</p>
                  </div>
                  <ArrowUpRight size={14} color={T.faint} />
                </div>
              ))}
            </div>
          </div>

          {/* Issues + alerts */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Active Alerts</h2>
              <span style={{ fontSize: 11, background: `${T.red}22`, color: T.red, borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>2 critical</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topIssues.map(({ sev, label, tool }) => (
                <div key={label} style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 8, background: sev === "critical" ? `${T.red}10` : "transparent", border: sev === "critical" ? `1px solid ${T.red}30` : `1px solid ${T.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${sevColor(sev)}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: sevColor(sev), flexShrink: 0 }}>
                    {sevLabel(sev)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: T.text, margin: 0, lineHeight: 1.4 }}>{label}</p>
                    <button style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>Fix in {tool} →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row: Postmaster chart placeholder + Academy card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          {/* Chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Inbox Rate · Last 30 days</h2>
              <span style={{ fontSize: 11, color: T.faint }}>Google Postmaster</span>
            </div>
            {/* Chart area placeholder */}
            <div style={{ height: 120, background: T.surface2, borderRadius: 8, display: "flex", alignItems: "flex-end", padding: "0 12px 12px", gap: 6, overflow: "hidden" }}>
              {[82,85,88,84,91,92,90,88,93,92,94,91,92,93,90,88,85,89,92,94,95,93,91,92,94,92,93,94,92,95].map((v, i) => (
                <div key={i} style={{ flex: 1, background: T.accent, opacity: 0.4 + (v - 80) / 100, borderRadius: "2px 2px 0 0", height: `${(v - 78) * 4}px`, transition: "height 0.3s" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontSize: 11, color: T.faint }}>Mar 28</span>
              <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>95% avg inbox rate</span>
              <span style={{ fontSize: 11, color: T.faint }}>Apr 27</span>
            </div>
          </div>

          {/* Academy card */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Award size={16} color={T.accent} />
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Academy</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "Mastering DMARC Alignment", badge: "Intermediate", done: true },
                { title: "Warm-up Strategy for Cold Domains", badge: "Advanced", done: false },
                { title: "Understanding Bounce Types", badge: "Beginner", done: false },
              ].map(({ title, badge, done }) => (
                <div key={title} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${done ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {done && <CheckCircle size={12} color={T.accent} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, margin: 0, color: T.text }}>{title}</p>
                    <span style={{ fontSize: 10, color: T.faint }}>{badge}</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer" }}>
              View all courses →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
