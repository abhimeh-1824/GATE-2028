import React, { useState } from 'react';
import {
  Sigma,
  LogIn,
  UserPlus,
  BookOpen,
  Brain,
  Calculator,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Lock,
  ChevronRight,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface LandingPageViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onTryDemo: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenLogin,
  onOpenRegister,
  onTryDemo,
}) => {
  const { daysRemaining } = useStudy();

  const syllabusPreview = [
    { name: 'Probability & Statistics', weight: '18–22%', roi: 'Extreme', topics: 12, code: 'P&S' },
    { name: 'Linear Algebra', weight: '14–16%', roi: 'Extreme', topics: 10, code: 'LA' },
    { name: 'Calculus & Optimization', weight: '8–10%', roi: 'High', topics: 8, code: 'CALC' },
    { name: 'Programming & DSA', weight: '12–14%', roi: 'High', topics: 11, code: 'DSA' },
    { name: 'DBMS & Warehousing', weight: '10–12%', roi: 'High', topics: 9, code: 'DBMS' },
    { name: 'Machine Learning', weight: '18–20%', roi: 'Extreme', topics: 14, code: 'ML' },
    { name: 'Artificial Intelligence', weight: '10–12%', roi: 'High', topics: 8, code: 'AI' },
    { name: 'General Aptitude', weight: '15%', roi: 'Extreme', topics: 13, code: 'GA' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  GATE DA 2028
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">
                Data Science &amp; AI Preparation Engine
              </p>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#curriculum" className="hover:text-indigo-600 transition-colors">
              8-Subject Curriculum
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Cognitive Architecture
            </a>
            <a href="#theorems" className="hover:text-indigo-600 transition-colors">
              Formula Vault
            </a>
            <a href="#benchmarks" className="hover:text-indigo-600 transition-colors">
              IISc &amp; IIT Targets
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onTryDemo}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
              title="Instant Preview with Demo Aspirant Profile"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Demo</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Free</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-[#faf8ff] to-[#f4f0ff]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Target AIR Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated to IISc Bangalore &amp; IIT Top-50 Rank Aspirants</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Master GATE DA 2028 with{' '}
            <span className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-900 bg-clip-text text-transparent">
              Mathematical Precision.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            The all-in-one academic operating system for Data Science &amp; AI. 36 KaTeX formula proofs, active recall revision algorithms, deep Pomodoro focus logging, and 100-mark CBT mock analytics.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Your Student Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-2xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4 text-indigo-600" />
              <span>Sign In to Your Workspace</span>
            </button>

            <button
              onClick={onTryDemo}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Instant Guest Preview</span>
            </button>
          </div>

          {/* Security & Access Notice */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-3">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Private Student Data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Zero Ads • Strictly Academic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{daysRemaining} Days to GATE DA 2028</span>
            </div>
          </div>
        </div>
      </header>

      {/* Live Countdown & Pillar Highlights */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-1">
              <div className="text-3xl font-black text-indigo-700 font-mono">{daysRemaining}</div>
              <div className="text-xs font-bold text-slate-800">Days Remaining</div>
              <div className="text-[11px] text-slate-500">GATE DA 2028 Exam Window</div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-1">
              <div className="text-3xl font-black text-slate-900 font-mono">85</div>
              <div className="text-xs font-bold text-slate-800">Syllabus Topics</div>
              <div className="text-[11px] text-slate-500">Full 8 Subject Tree</div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-1">
              <div className="text-3xl font-black text-emerald-600 font-mono">36</div>
              <div className="text-xs font-bold text-slate-800">KaTeX Proofs &amp; Traps</div>
              <div className="text-[11px] text-slate-500">Dual Blackboard &amp; Paper</div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-1">
              <div className="text-3xl font-black text-purple-600 font-mono">AIR 1–50</div>
              <div className="text-xs font-bold text-slate-800">Target Benchmark</div>
              <div className="text-[11px] text-slate-500">IISc &amp; Top IITs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section id="features" className="py-16 bg-[#faf8ff] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-700 font-mono uppercase tracking-wider">
              ENGINEERED FOR EXTREME RETENTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why Traditional Trackers Fail at GATE DA
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              GATE DA is not about superficial checklist completion. It tests mathematical boundary conditions, MSQ traps, and rapid problem recall.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Cognitive Spaced Repetition
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mitigates the Ebbinghaus forgetting curve. Topics with low confidence (1–3 stars) or overdue revision dates automatically bubble up into your daily priority queue.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                KaTeX Formula &amp; Trap Vault
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dual Chalkboard and Paper rendering of 36 critical theorems (CLT, SVD, Gradient Descent, Normal equations) accompanied by dangerous examiner traps.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                100-Mark CBT Mock Analytics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simulate real exam pressure. Record full-length mock tests, track MSQ accuracy where zero partial marking applies, and benchmark against IISc cutoffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Subject Curriculum Grid */}
      <section id="curriculum" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-700 font-mono uppercase tracking-wider">
              OFFICIAL SYLLABUS ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              The 8-Subject GATE DA Weightage Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Structured to maximize Return on Study Time (ROI). Focus on pure mathematics and core machine learning foundations first.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {syllabusPreview.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-[#fbfbff] hover:border-indigo-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    {s.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.roi === 'Extreme'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ROI: {s.roi}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Weightage: <strong>{s.weight}</strong></span>
                  <span>{s.topics} Topics</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Aspirant Callout */}
      <section id="benchmarks" className="py-16 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Targeting AIR 1 to 50 in GATE DA 2028?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            M.Tech in Artificial Intelligence at IISc Bangalore and IIT Bombay requires top-tier percentiles. Consistency, revision cadence, and precision problem-solving make the difference.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-md hover:bg-slate-100 transition-colors"
            >
              Register &amp; Start Your Campaign
            </button>
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-indigo-400/40 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs">
              ∑
            </div>
            <span>GATE DA 2028 Academic Study Portal • Strictly Educational</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenLogin} className="hover:text-indigo-600">
              Sign In
            </button>
            <span>•</span>
            <button onClick={onOpenRegister} className="hover:text-indigo-600">
              Register Free
            </button>
            <span>•</span>
            <button onClick={onTryDemo} className="hover:text-indigo-600">
              Demo Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
