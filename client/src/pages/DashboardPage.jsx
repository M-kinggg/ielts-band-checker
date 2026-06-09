import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, BarChart2, TrendingUp, Trophy,
  FileText, Award, Calendar, ChevronRight, X,
  Download, Loader2, Lock, Check
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ScoreDashboard from '../components/ScoreDashboard';
import FeedbackAccordion from '../components/FeedbackAccordion';
import AuthModal from '../components/AuthModal';
import ThreeBackground from '../components/ThreeBackground';
import Navbar from '../components/Navbar';

// ─── Constants ──────────────────────────────────────────────────────────────

const MOTIVATIONAL_QUOTES = [
  "Every band score point earned is proof of your dedication.",
  "Consistency beats talent when talent doesn't show up.",
  "The examiner rewards preparation — not luck.",
  "Your writing improves one essay at a time.",
  "Band 7 is a mindset, not just a score.",
  "Grammar is the foundation; vocabulary is the art.",
  "Coherence comes from clarity of thought.",
  "Each mistake is a lesson dressed in disguise.",
  "The path to Band 8 is paved with practice essays.",
  "Write like you mean it. Edit like you're the examiner."
];

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { id: 'analytics',     label: 'Performance',   icon: BarChart2 },
  { id: 'history',       label: 'Band History',  icon: TrendingUp },
  { id: 'achievements',  label: 'Achievements',  icon: Trophy },
];

const BADGE_DEFS = [
  {
    id: 'firstStep', emoji: '🏆', title: 'First Step', desc: 'Submit your first essay',
    check: s => s.length >= 1,
    getDate: s => [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at))[0]?.created_at,
  },
  {
    id: 'onARoll', emoji: '⚡', title: 'On a Roll', desc: 'Submit 3 essays in one week',
    check: s => {
      const sorted = [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
      return sorted.some((sub, i) => {
        const start = new Date(sub.created_at);
        const end   = new Date(start.getTime() + 7 * 86400000);
        return sorted.filter(x => { const d = new Date(x.created_at); return d >= start && d <= end; }).length >= 3;
      });
    },
    getDate: s => {
      const sorted = [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
      for (let i = 0; i < sorted.length; i++) {
        const start = new Date(sorted[i].created_at);
        const end   = new Date(start.getTime() + 7 * 86400000);
        const win = sorted.filter(x => { const d = new Date(x.created_at); return d >= start && d <= end; });
        if (win.length >= 3) return win[win.length-1].created_at;
      }
      return null;
    },
  },
  {
    id: 'improver', emoji: '📈', title: 'Improver', desc: 'Increase band score by 1.0+',
    check: s => {
      if (s.length < 2) return false;
      const sorted = [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
      return parseFloat(sorted[sorted.length-1].overall_band) - parseFloat(sorted[0].overall_band) >= 1.0;
    },
    getDate: s => {
      if (s.length < 2) return null;
      return [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)).slice(-1)[0]?.created_at;
    },
  },
  {
    id: 'band7Club', emoji: '🎯', title: 'Band 7 Club', desc: 'Achieve band 7.0 or above',
    check: s => s.some(x => parseFloat(x.overall_band) >= 7.0),
    getDate: s => [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)).find(x => parseFloat(x.overall_band) >= 7.0)?.created_at,
  },
  {
    id: 'taskMaster', emoji: '✍️', title: 'Task Master', desc: 'Submit both Task 1 and Task 2',
    check: s => s.some(x => x.task_type === 'task1') && s.some(x => x.task_type === 'task2'),
    getDate: s => {
      const t1 = s.find(x => x.task_type === 'task1');
      const t2 = s.find(x => x.task_type === 'task2');
      if (!t1 || !t2) return null;
      return [t1, t2].sort((a,b) => new Date(b.created_at)-new Date(a.created_at))[0].created_at;
    },
  },
  {
    id: 'streak', emoji: '🔥', title: 'Streak', desc: 'Submit essays 5 days in a row',
    check: s => {
      const dates = [...new Set(s.map(x => x.created_at.slice(0,10)))].sort();
      let max = 1, cur = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
        if (diff === 1) { cur++; if (cur > max) max = cur; } else cur = 1;
      }
      return max >= 5;
    },
    getDate: s => {
      const dates = [...new Set(s.map(x => x.created_at.slice(0,10)))].sort();
      let cur = 1, result = null;
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
        if (diff === 1) { cur++; if (cur >= 5) result = dates[i]; } else cur = 1;
      }
      return result;
    },
  },
  {
    id: 'elite', emoji: '💎', title: 'Elite', desc: 'Achieve band 8.0 or above',
    check: s => s.some(x => parseFloat(x.overall_band) >= 8.0),
    getDate: s => [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)).find(x => parseFloat(x.overall_band) >= 8.0)?.created_at,
  },
  {
    id: 'dedicated', emoji: '📚', title: 'Dedicated', desc: 'Submit 10+ total essays',
    check: s => s.length >= 10,
    getDate: s => s.length < 10 ? null : [...s].sort((a,b) => new Date(a.created_at)-new Date(b.created_at))[9]?.created_at,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLocalItem(item) {
  return {
    id: String(item.id),
    created_at: item.timestamp,
    task_type: item.taskType,
    essay_text: '',
    file_name: item.fileName || null,
    file_type: item.fileType || 'typed',
    overall_band: item.overallBand,
    score_ta:  item.report?.criteria?.taskAchievement?.score  || 0,
    score_cc:  item.report?.criteria?.coherenceCohesion?.score || 0,
    score_lr:  item.report?.criteria?.lexicalResource?.score   || 0,
    score_gra: item.report?.criteria?.grammaticalRange?.score  || 0,
    feedback_json: item.report || null,
  };
}

const avg = arr => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
const fmtShort  = d => new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
const fmtFull   = d => new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
const fmtMonth  = ym => { const [y,m] = ym.split('-'); return new Date(y,m-1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}); };

function computeStats(subs) {
  if (!subs.length) return { total: 0, current: 0, best: 0, average: 0 };
  const bands = subs.map(s => parseFloat(s.overall_band));
  return {
    total:   subs.length,
    current: bands[0],
    best:    Math.max(...bands),
    average: Math.round(avg(bands) * 10) / 10,
  };
}

function computeRadarData(subs) {
  if (!subs.length) return [];
  const r = n => Math.round(n * 10) / 10;
  return [
    { subject: 'Task Achievement',    score: r(avg(subs.map(s => parseFloat(s.score_ta  || 0)))), fullMark: 9 },
    { subject: 'Coherence & Cohesion',score: r(avg(subs.map(s => parseFloat(s.score_cc  || 0)))), fullMark: 9 },
    { subject: 'Lexical Resource',    score: r(avg(subs.map(s => parseFloat(s.score_lr  || 0)))), fullMark: 9 },
    { subject: 'Grammar Range',       score: r(avg(subs.map(s => parseFloat(s.score_gra || 0)))), fullMark: 9 },
  ];
}

function computeDistribution(subs) {
  const buckets = [
    { range: '4.0–4.5', min: 0,   max: 4.99, count: 0 },
    { range: '5.0–5.5', min: 5.0, max: 5.99, count: 0 },
    { range: '6.0–6.5', min: 6.0, max: 6.99, count: 0 },
    { range: '7.0–7.5', min: 7.0, max: 7.99, count: 0 },
    { range: '8.0–8.5', min: 8.0, max: 8.99, count: 0 },
    { range: '9.0',     min: 9.0, max: 9.0,  count: 0 },
  ];
  subs.forEach(s => {
    const b = parseFloat(s.overall_band);
    const bkt = buckets.find((bk,i) => i === buckets.length-1 ? b >= bk.min : b >= bk.min && b < buckets[i+1].min);
    if (bkt) bkt.count++;
  });
  return buckets;
}

function computeConsistency(subs) {
  if (subs.length < 2) return null;
  const bands = subs.slice(0,10).map(s => parseFloat(s.overall_band));
  const mean  = avg(bands);
  const stdDev = Math.sqrt(avg(bands.map(b => (b - mean) ** 2)));
  return Math.max(0, Math.round((1 - stdDev / 4.5) * 100));
}

function computeMonthly(subs) {
  const grouped = {};
  [...subs].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)).forEach(s => {
    const k = s.created_at.slice(0,7);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(s);
  });
  const entries = Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a));
  return entries.map(([key, msubs], idx) => {
    const bands  = msubs.map(s => parseFloat(s.overall_band));
    const keys   = ['score_ta','score_cc','score_lr','score_gra'];
    const names  = ['Task Achievement','Coherence & Cohesion','Lexical Resource','Grammar Range'];
    let mostImproved = null;
    if (idx < entries.length - 1) {
      const prevSubs = entries[idx+1][1];
      let maxDiff = -Infinity;
      keys.forEach((k,i) => {
        const diff = avg(msubs.map(s => parseFloat(s[k]||0))) - avg(prevSubs.map(s => parseFloat(s[k]||0)));
        if (diff > maxDiff) { maxDiff = diff; mostImproved = { name: names[i], diff }; }
      });
    }
    return { key, count: msubs.length, avg: Math.round(avg(bands)*10)/10, best: Math.max(...bands), mostImproved };
  });
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection]     = useState('overview');
  const [submissions, setSubmissions]         = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen]       = useState(false);

  const todayQuote = useMemo(() => MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length], []);

  // Fetch data — Supabase first, localStorage fallback
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (user && supabase) {
        try {
          const { data, error } = await supabase
            .from('submissions').select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!error && data) { setSubmissions(data); setIsLoading(false); return; }
        } catch {}
      }
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('ielts_essay_history');
        if (stored) setSubmissions(JSON.parse(stored).map(normalizeLocalItem));
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [user]);

  // Derived analytics (memoised for performance)
  const stats        = useMemo(() => computeStats(submissions),       [submissions]);
  const radarData    = useMemo(() => computeRadarData(submissions),   [submissions]);
  const distribution = useMemo(() => computeDistribution(submissions),[submissions]);
  const consistency  = useMemo(() => computeConsistency(submissions), [submissions]);
  const monthlyData  = useMemo(() => computeMonthly(submissions),     [submissions]);
  const badges       = useMemo(() => BADGE_DEFS.map(b => ({
    ...b, unlocked: b.check(submissions), unlockDate: b.getDate(submissions),
  })), [submissions]);

  const openDrawer = sub => {
    setActiveSubmission(sub);
    setIsDrawerOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans select-none text-slate-100">
      <ThreeBackground />
      <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(12,10,9,0.55)', zIndex:1, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:2 }} className="flex flex-col min-h-screen">
        <Navbar onSignInClick={() => setIsAuthModalOpen(true)} />

        {/* ── Auth Guard ─────────────────────────────────────────── */}
        {!user && !isLoading && (
          <main className="flex-1 flex items-center justify-center px-4 py-20">
            <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 border border-[#CA8A04]/25 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[#CA8A04]/3 pointer-events-none" />
              <div className="relative">
                <div className="p-4 bg-[#CA8A04]/10 rounded-full w-16 h-16 flex items-center justify-center text-[#CA8A04] mx-auto border border-[#CA8A04]/20 animate-pulse mb-4">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                <h1 className="text-lg font-bold text-slate-200 mb-2">Personal Analytics Dashboard</h1>
                <p className="text-xs text-slate-400 font-light leading-relaxed mb-6">
                  Sign in to access your personal dashboard. Track band scores, review performance analytics, and unlock achievements based on your writing journey.
                </p>
                <button onClick={() => setIsAuthModalOpen(true)} className="btn-gold w-full text-xs font-bold uppercase tracking-wider py-3.5">
                  Sign In to Access Dashboard
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ── Loading ────────────────────────────────────────────── */}
        {isLoading && (
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 text-[#CA8A04] animate-spin" />
              <p className="text-xs text-slate-400 font-light">Loading your dashboard...</p>
            </div>
          </main>
        )}

        {/* ── Dashboard Layout ───────────────────────────────────── */}
        {user && !isLoading && (
          <div className="flex flex-1 min-h-0">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-[#44403C]/40 bg-[#1C1917]/70 backdrop-blur-xl p-4 gap-1 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 mb-3">Navigation</p>
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer w-full text-left ${
                    activeSection === id
                      ? 'bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/30 shadow-[0_0_12px_rgba(202,138,4,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              {/* Quick stat at bottom of sidebar */}
              <div className="mt-auto pt-4 border-t border-[#44403C]/40">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Essays</p>
                  <p className="text-2xl font-black text-[#CA8A04]">{stats.total}</p>
                  <p className="text-[10px] text-slate-500">submitted</p>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
              {activeSection === 'overview'      && <OverviewSection     submissions={submissions} stats={stats}     todayQuote={todayQuote} onOpenDrawer={openDrawer} />}
              {activeSection === 'analytics'     && <AnalyticsSection    submissions={submissions} radarData={radarData} distribution={distribution} consistency={consistency} />}
              {activeSection === 'history'       && <BandHistorySection  submissions={submissions} monthlyData={monthlyData} />}
              {activeSection === 'achievements'  && <AchievementsSection badges={badges} />}
            </main>

            {/* Mobile Bottom Tabs */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1C1917]/92 backdrop-blur-xl border-t border-[#44403C]/50 z-40 flex">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    activeSection === id ? 'text-[#CA8A04]' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeSection === id ? 'text-[#CA8A04]' : ''}`} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* ── Report Drawer ──────────────────────────────────────── */}
      {isDrawerOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div onClick={closeDrawer} className="absolute inset-0 bg-[#0C0A09]/80 backdrop-blur-sm animate-in fade-in duration-300" />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-3xl p-6 overflow-y-auto z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out"
            style={{ background:'rgba(28,25,23,0.92)', backdropFilter:'blur(20px)', borderLeft:'1px solid rgba(202,138,4,0.3)' }}
          >
            <div className="flex justify-between items-center border-b border-[#44403C]/50 pb-4 mb-6 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${activeSubmission.task_type === 'task1' ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-white/10 text-slate-200'}`}>
                    {activeSubmission.task_type === 'task1' ? 'Task 1' : 'Task 2'}
                  </span>
                  <span className="text-xs text-slate-500">{fmtFull(activeSubmission.created_at)}</span>
                </div>
                <h2 className="text-sm font-bold text-slate-200 truncate max-w-md">{activeSubmission.file_name || 'Typed Essay'}</h2>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#CA8A04] transition-all cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-6">
              {activeSubmission.feedback_json ? (
                <>
                  <ScoreDashboard report={activeSubmission.feedback_json} targetBand={activeSubmission.feedback_json?.targetBand || 7.0} />
                  <FeedbackAccordion report={activeSubmission.feedback_json} />
                </>
              ) : (
                <div className="glass rounded-2xl p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">Detailed feedback unavailable for this submission.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

// ─── Section 1: Overview ────────────────────────────────────────────────────

function OverviewSection({ submissions, stats, todayQuote, onOpenDrawer }) {
  const { user } = useAuth();
  const username  = user ? user.email.split('@')[0] : 'Learner';
  const dateStr   = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const recent    = submissions.slice(0, 5);

  const statCards = [
    { label: 'Total Essays',   value: stats.total,                                  icon: FileText },
    { label: 'Current Band',   value: stats.total ? stats.current.toFixed(1) : '—', icon: Award    },
    { label: 'Best Band Ever', value: stats.total ? stats.best.toFixed(1)    : '—', icon: Trophy   },
    { label: 'Average Band',   value: stats.total ? stats.average.toFixed(1) : '—', icon: BarChart2},
  ];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Greeting Card */}
      <div className="glass-gold rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-[#CA8A04]/8 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FAFAF9] mb-0.5">
            Welcome back, <span className="text-[#CA8A04]">{username}</span>! 👋
          </h1>
          <p className="text-xs text-slate-400 mb-4">{dateStr}</p>
          <div className="flex items-start gap-2.5 bg-[#1C1917]/50 rounded-xl p-3.5 border border-[#44403C]/50">
            <span className="text-base mt-0.5 shrink-0">💡</span>
            <p className="text-sm text-slate-300 font-light italic leading-relaxed">"{todayQuote}"</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-[#44403C]/40 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300 relative overflow-hidden group cursor-default">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#CA8A04]/3 blur-2xl rounded-full pointer-events-none group-hover:bg-[#CA8A04]/8 transition-all" />
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-tight">{label}</span>
              <div className="p-1.5 bg-[#CA8A04]/10 rounded-lg border border-[#CA8A04]/20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-[#CA8A04]" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#CA8A04]">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="glass rounded-2xl overflow-hidden border border-[#44403C]/40">
        <div className="px-5 py-4 border-b border-[#44403C]/40 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#CA8A04]" />
            Recent Activity
          </h2>
          <span className="text-[10px] text-slate-500">Last {Math.min(5, submissions.length)} submissions — click to view full report</span>
        </div>

        {recent.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <FileText className="h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500 font-light">No submissions yet.</p>
            <p className="text-xs text-slate-600">Grade your first essay from the Write Essay page.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#44403C]/40">
            {recent.map(sub => (
              <button
                key={sub.id}
                onClick={() => onOpenDrawer(sub)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#CA8A04]/5 transition-all duration-200 cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold shrink-0 ${sub.task_type === 'task1' ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-white/10 text-slate-300'}`}>
                    {sub.task_type === 'task1' ? 'T1' : 'T2'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{sub.file_name || 'Typed Essay'}</p>
                    <p className="text-[10px] text-slate-500">{fmtShort(sub.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-extrabold text-[#CA8A04] bg-[#CA8A04]/10 border border-[#CA8A04]/25 rounded-lg px-2.5 py-1">
                    {parseFloat(sub.overall_band).toFixed(1)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#CA8A04] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section 2: Performance Analytics ──────────────────────────────────────

function AnalyticsSection({ submissions, radarData, distribution, consistency }) {
  const task1 = submissions.filter(s => s.task_type === 'task1');
  const task2 = submissions.filter(s => s.task_type === 'task2');
  const taskStats = [task1, task2].map((t, i) => {
    const bands = t.map(s => parseFloat(s.overall_band));
    return { label: i === 0 ? 'Task 1' : 'Task 2', count: t.length, avg: bands.length ? Math.round(avg(bands)*10)/10 : 0, best: bands.length ? Math.max(...bands) : 0 };
  });

  const BarTooltip = ({ active, payload }) => active && payload?.length ? (
    <div className="bg-[#1C1917] border border-[#CA8A04]/30 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-[#FAFAF9]">{payload[0].payload.range}</p>
      <p className="text-[#CA8A04]">{payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  ) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-[#FAFAF9]">Performance Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Deep insights into your IELTS writing performance across all submissions</p>
      </div>

      {submissions.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-[#44403C]/30">
          <BarChart2 className="h-14 w-14 mx-auto text-slate-700 mb-4" />
          <p className="text-sm text-slate-500">Grade some essays to unlock your analytics.</p>
        </div>
      ) : (
        <>
          {/* Row 1: Radar + Consistency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Weakness Radar */}
            <div className="glass rounded-2xl p-5 border border-[#44403C]/40">
              <h2 className="text-sm font-bold text-slate-200 mb-0.5">Weakness Radar</h2>
              <p className="text-xs text-slate-500 mb-4">Average scores across all 4 criteria</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#44403C" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill:'#cbd5e1', fontSize:9, fontWeight:'600' }} />
                    <PolarRadiusAxis angle={30} domain={[0,9]} tick={{ fill:'#44403C', fontSize:8 }} stroke="#44403C" />
                    <Radar name="Avg" dataKey="score" stroke="#CA8A04" fill="#CA8A04" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {radarData.map(d => (
                  <div key={d.subject} className="flex justify-between items-center bg-[#1C1917]/50 rounded-lg px-2.5 py-1.5 border border-[#44403C]/40">
                    <span className="text-[10px] text-slate-400 truncate pr-1">{d.subject.split(' ')[0]}</span>
                    <span className="text-xs font-bold text-[#CA8A04] shrink-0">{d.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency Score */}
            <div className="glass rounded-2xl p-5 border border-[#44403C]/40 flex flex-col">
              <h2 className="text-sm font-bold text-slate-200 mb-0.5">Consistency Score</h2>
              <p className="text-xs text-slate-500 mb-4">Based on standard deviation of last {Math.min(10, submissions.length)} submissions</p>
              {consistency === null ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-slate-500 text-center px-4">Submit at least 2 essays<br/>to see your consistency score.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                      <circle cx="72" cy="72" r="60" stroke="#44403C" strokeWidth="10" fill="transparent" />
                      <circle cx="72" cy="72" r="60" stroke="url(#cGrad)" strokeWidth="10" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - consistency / 100)}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                      <defs>
                        <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#CA8A04" />
                          <stop offset="100%" stopColor="#FAFAF9" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-[#CA8A04]">{consistency}%</span>
                      <span className="text-[10px] text-slate-400">consistent</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-semibold text-slate-200">
                      {consistency >= 80 ? 'Very Consistent 🏆' : consistency >= 60 ? 'Fairly Consistent 📈' : 'Keep Practicing 💪'}
                    </p>
                    <p className="text-xs text-slate-500 font-light leading-relaxed max-w-xs">
                      {consistency >= 80
                        ? 'Your band scores are very stable. Excellent discipline and technique!'
                        : consistency >= 60
                        ? 'Good consistency overall. Minor score fluctuations are totally normal.'
                        : 'Your scores vary quite a bit. Focus on your weakest criterion.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Task Comparison */}
          <div className="glass rounded-2xl p-5 border border-[#44403C]/40">
            <h2 className="text-sm font-bold text-slate-200 mb-0.5">Task 1 vs Task 2</h2>
            <p className="text-xs text-slate-500 mb-4">Side-by-side performance breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {taskStats.map((ts, i) => (
                <div key={ts.label} className="bg-[#1C1917]/50 rounded-xl p-5 border border-[#44403C]/50 hover:border-[#CA8A04]/30 transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${i === 0 ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-white/10 text-slate-200'}`}>{ts.label}</span>
                    <span className="text-[10px] text-slate-500">{ts.count} submission{ts.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Avg Band</p>
                      <p className="text-2xl font-black text-[#CA8A04]">{ts.count ? ts.avg.toFixed(1) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Best Band</p>
                      <p className="text-2xl font-black text-[#CA8A04]">{ts.count ? ts.best.toFixed(1) : '—'}</p>
                    </div>
                  </div>
                  {ts.count === 0 && <p className="text-[11px] text-slate-600 italic mt-1">No {ts.label} submissions yet</p>}
                  {ts.count > 0 && taskStats[0].count > 0 && taskStats[1].count > 0 && (
                    <div className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg ${ts.avg < (i === 0 ? taskStats[1].avg : taskStats[0].avg) ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {ts.avg < (i === 0 ? taskStats[1].avg : taskStats[0].avg) ? '⚠️ Needs more practice' : '✅ Your stronger task'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Score Distribution */}
          <div className="glass rounded-2xl p-5 border border-[#44403C]/40">
            <h2 className="text-sm font-bold text-slate-200 mb-0.5">Score Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">How your submissions spread across band ranges</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top:5, right:10, left:-25, bottom:5 }}>
                  <CartesianGrid stroke="#44403C" strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="range" tick={{ fill:'#94a3b8', fontSize:10 }} stroke="#44403C" />
                  <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} stroke="#44403C" allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="count" fill="#CA8A04" radius={[4,4,0,0]} fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section 3: Band History ─────────────────────────────────────────────────

function BandHistorySection({ submissions, monthlyData }) {
  const [showTA,  setShowTA]  = useState(false);
  const [showCC,  setShowCC]  = useState(false);
  const [showLR,  setShowLR]  = useState(false);
  const [showGRA, setShowGRA] = useState(false);
  const [zoom, setZoom]         = useState('all');
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef(null);

  const chronData = useMemo(() =>
    [...submissions].reverse().map(s => ({
      name: fmtShort(s.created_at),
      'Overall Band':        parseFloat(s.overall_band),
      'Task Achievement':    parseFloat(s.score_ta  || 0),
      'Coherence & Cohesion':parseFloat(s.score_cc  || 0),
      'Lexical Resource':    parseFloat(s.score_lr  || 0),
      'Grammar Range':       parseFloat(s.score_gra || 0),
    })), [submissions]);

  const displayData = zoom === 'last5' ? chronData.slice(-5) : zoom === 'last10' ? chronData.slice(-10) : chronData;

  const handleExport = async () => {
    if (!chartRef.current || exporting) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, { backgroundColor:'#1C1917', scale:2, logging:false });
      const a = document.createElement('a');
      a.download = `ielts-band-history-${new Date().toISOString().slice(0,10)}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (err) { console.error('Export failed:', err); }
    finally { setExporting(false); }
  };

  const LineTooltip = ({ active, payload, label }) => active && payload?.length ? (
    <div className="bg-[#1C1917] border border-[#CA8A04]/30 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[120px]">
      <p className="font-bold text-[#FAFAF9] mb-1.5 border-b border-[#44403C]/50 pb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color:p.color }} className="text-[11px]">{p.dataKey}: {p.value?.toFixed(1)}</p>)}
    </div>
  ) : null;

  const toggleDefs = [
    ['Task Achievement',    showTA,  setShowTA,  '#f472b6'],
    ['Coherence & Cohesion',showCC,  setShowCC,  '#22d3ee'],
    ['Lexical Resource',    showLR,  setShowLR,  '#c084fc'],
    ['Grammar Range',       showGRA, setShowGRA, '#34d399'],
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-[#FAFAF9]">Band History</h1>
        <p className="text-xs text-slate-500 mt-1">Your overall band score trajectory over time</p>
      </div>

      {submissions.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-[#44403C]/30">
          <TrendingUp className="h-14 w-14 mx-auto text-slate-700 mb-4" />
          <p className="text-sm text-slate-500">Grade some essays to see your progress chart.</p>
        </div>
      ) : (
        <>
          {/* Progress Chart */}
          <div className="glass rounded-2xl p-5 border border-[#44403C]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200">Progress Trajectory</h2>
                <p className="text-xs text-slate-500">Chronological band score analysis</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom selector */}
                <div className="flex bg-[#1C1917]/70 border border-[#44403C]/50 rounded-lg p-0.5">
                  {[['all','All'],['last10','Last 10'],['last5','Last 5']].map(([v,l]) => (
                    <button key={v} onClick={() => setZoom(v)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200 cursor-pointer ${zoom === v ? 'bg-[#CA8A04] text-[#0C0A09]' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
                  ))}
                </div>
                {/* Export */}
                <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#44403C]/40 hover:bg-[#CA8A04]/10 border border-[#44403C]/60 hover:border-[#CA8A04]/40 rounded-lg text-[10px] font-bold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer disabled:opacity-50">
                  <Download className="h-3 w-3" />
                  {exporting ? 'Saving…' : 'Export PNG'}
                </button>
              </div>
            </div>

            {/* Chart container (captured for export) */}
            <div ref={chartRef} className="bg-transparent rounded-xl overflow-hidden">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData} margin={{ top:10, right:15, left:-25, bottom:5 }}>
                    <CartesianGrid stroke="#44403C" strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} stroke="#44403C" />
                    <YAxis domain={[0,9]} ticks={[0,1,2,3,4,5,6,7,8,9]} tick={{ fill:'#94a3b8', fontSize:10 }} stroke="#44403C" />
                    <Tooltip content={<LineTooltip />} />
                    <ReferenceLine y={7} stroke="#CA8A04" strokeDasharray="4 4" label={{ value:'Band 7', fill:'#CA8A04', fontSize:9, position:'insideTopRight', fontWeight:'bold' }} />
                    <Line type="monotone" dataKey="Overall Band" stroke="#CA8A04" strokeWidth={3} dot={{ r:4, fill:'#CA8A04', stroke:'#1C1917', strokeWidth:2 }} activeDot={{ r:6, fill:'#CA8A04', stroke:'#FAFAF9' }} animationDuration={800} />
                    {showTA  && <Line type="monotone" dataKey="Task Achievement"    stroke="#f472b6" strokeWidth={1.5} dot={false} animationDuration={500} />}
                    {showCC  && <Line type="monotone" dataKey="Coherence & Cohesion" stroke="#22d3ee" strokeWidth={1.5} dot={false} animationDuration={500} />}
                    {showLR  && <Line type="monotone" dataKey="Lexical Resource"    stroke="#c084fc" strokeWidth={1.5} dot={false} animationDuration={500} />}
                    {showGRA && <Line type="monotone" dataKey="Grammar Range"       stroke="#34d399" strokeWidth={1.5} dot={false} animationDuration={500} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subscore toggles */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#44403C]/30 pt-3 mt-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Subscores:</span>
              {toggleDefs.map(([label, checked, setter, color]) => (
                <label key={label} className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                  <input type="checkbox" checked={checked} onChange={e => setter(e.target.checked)} className="accent-[#CA8A04] rounded" />
                  <span className="text-[11px] font-medium" style={{ color: checked ? color : undefined }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="glass rounded-2xl p-5 border border-[#44403C]/40">
            <h2 className="text-sm font-bold text-slate-200 mb-0.5">Monthly Summary</h2>
            <p className="text-xs text-slate-500 mb-4">Performance breakdown grouped by month</p>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {monthlyData.map(m => (
                <div key={m.key} className="shrink-0 w-44 bg-[#1C1917]/60 border border-[#44403C]/50 rounded-xl p-4 hover:border-[#CA8A04]/40 transition-all duration-300">
                  <p className="text-[10px] uppercase font-bold text-[#CA8A04] tracking-wider mb-3">{fmtMonth(m.key)}</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Submissions</span>
                      <span className="text-[11px] font-bold text-slate-200">{m.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Avg Band</span>
                      <span className="text-[11px] font-bold text-[#CA8A04]">{m.avg.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Best Band</span>
                      <span className="text-[11px] font-bold text-[#CA8A04]">{m.best.toFixed(1)}</span>
                    </div>
                    {m.mostImproved && (
                      <div className="border-t border-[#44403C]/40 pt-2">
                        <p className="text-[9px] text-slate-500 mb-0.5">Most improved vs prev. month</p>
                        <p className={`text-[10px] font-semibold truncate ${m.mostImproved.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.mostImproved.name.split(' ')[0]} {m.mostImproved.diff > 0 ? `+${m.mostImproved.diff.toFixed(1)}` : m.mostImproved.diff.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section 4: Achievements ─────────────────────────────────────────────────

function AchievementsSection({ badges }) {
  const unlocked = badges.filter(b => b.unlocked).length;
  const pct = Math.round((unlocked / badges.length) * 100);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAF9]">Achievements</h1>
          <p className="text-xs text-slate-500 mt-1">Milestones earned through your IELTS journey</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-[#CA8A04] leading-none">
            {unlocked}<span className="text-slate-500 text-lg font-normal">/{badges.length}</span>
          </p>
          <p className="text-[10px] text-slate-500">badges unlocked</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="glass rounded-2xl p-4 border border-[#44403C]/40">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">{unlocked} of {badges.length} badges earned</span>
          <span className="text-[#CA8A04] font-bold">{pct}%</span>
        </div>
        <div className="w-full bg-[#1C1917] rounded-full h-2.5 border border-[#44403C]/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#CA8A04] to-yellow-300 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`glass rounded-2xl p-5 border transition-all duration-300 text-center relative overflow-hidden ${
              badge.unlocked
                ? 'border-[#CA8A04]/40 shadow-[0_0_24px_rgba(202,138,4,0.12)] bg-[#CA8A04]/5 hover:shadow-[0_0_32px_rgba(202,138,4,0.2)] hover:-translate-y-0.5'
                : 'border-[#44403C]/30 opacity-45 grayscale'
            }`}
          >
            {badge.unlocked && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#CA8A04]/10 blur-2xl rounded-full pointer-events-none" />
            )}
            <div className="relative">
              <div className="text-3xl mb-3">{badge.emoji}</div>
              <h3 className={`text-sm font-bold mb-1 ${badge.unlocked ? 'text-[#CA8A04]' : 'text-slate-500'}`}>
                {badge.title}
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">{badge.desc}</p>

              {badge.unlocked && badge.unlockDate ? (
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">Earned {fmtShort(badge.unlockDate)}</span>
                </div>
              ) : !badge.unlocked ? (
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3 text-slate-600" />
                  <span className="text-[10px] text-slate-600 font-medium">Locked</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {unlocked === badges.length && (
        <div className="glass-gold rounded-2xl p-5 text-center border border-[#CA8A04]/40 shadow-[0_0_40px_rgba(202,138,4,0.15)]">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm font-bold text-[#CA8A04]">All badges unlocked! You're an IELTS legend.</p>
        </div>
      )}
    </div>
  );
}
