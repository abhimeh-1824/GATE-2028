import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Flame,
  MessageSquare,
  Check,
  Sigma,
  ChevronRight,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import heroWorkspaceImg from '../../assets/images/hero_gate_workspace_1795432760775.jpg';
import academicLibraryImg from '../../assets/images/academic_library_focus_1795432761253.jpg';

interface LandingPageViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onTryDemo: () => void;
}

type ModuleId = 'notes' | 'tests' | 'rewards' | 'planner';

interface AppModuleSpec {
  id: ModuleId;
  tabLabel: string;
  index: string;
  title: string;
  summary: string;
  highlights: string[];
  benefitHeading: string;
  benefitText: string;
  previewRows: Array<{ label: string; meta: string; status: string }>;
}

const APP_MODULES: AppModuleSpec[] = [
  {
    id: 'notes',
    tabLabel: 'Notes & Syllabus',
    index: '01.',
    title: 'Hierarchical Subject, Topic & Subtopic Notes',
    summary:
      'Every level of the GATE DA syllabus carries both Complete Study Notes and Short Revision Notes. Read clean interactive notes with equations, tables, code blocks, diagrams, and visual explanations without leaving the topic.',
    highlights: [
      'Exact 3-level structure: Subject → Topic → Subtopic with breadcrumb navigation',
      'Switch between deep Complete Notes and quick Short Revision Notes at any level',
      'Track topic mastery, confidence ratings, and revision status alongside your notes',
    ],
    benefitHeading: 'Zero scattered folders',
    benefitText:
      'Instead of digging through random PDFs, Drive links, and notebooks before an exam, every concept and short note stays anchored to its exact syllabus topic.',
    previewRows: [
      { label: 'Probability & Statistics', meta: 'Complete Notes · Short Notes', status: '12 topics' },
      { label: 'Bayes Theorem & Distributions', meta: 'Topic Notes · Practice Test', status: 'In progress' },
      { label: 'Eigenvalues & SVD Decomposition', meta: 'Subtopic Short Notes', status: 'Revised' },
    ],
  },
  {
    id: 'tests',
    tabLabel: 'Tests Hub',
    index: '02.',
    title: 'Dedicated Tests Hub with Attempt & Accuracy Tracking',
    summary:
      'Browse every Subject, Topic, and Subtopic test in one structured table. Filter by level, see who created each test, check duration, and immediately distinguish attempted tests from pending ones.',
    highlights: [
      'Filter tests instantly by Subject, Topic, Subtopic, or Attempted / Not Attempted',
      'Timed MCQ runner with instant score, right vs wrong count, and full solution review',
      'Anyone can contribute practice tests via CSV/Excel import to grow the shared question bank',
    ],
    benefitHeading: 'Instant clarity on readiness',
    benefitText:
      'Stop guessing which chapters you actually tested yourself on — every test row shows your exact correct answers, wrong answers, and best score.',
    previewRows: [
      { label: 'Linear Algebra Full Subject Drill', meta: 'Subject Test · 45 min', status: 'Attempted · 21/25' },
      { label: 'Gradient Descent & Convexity', meta: 'Topic Test · 20 min', status: 'Attempted · 9/10' },
      { label: 'SQL Joins & Normalization', meta: 'Subtopic Test · 10 min', status: 'Not attempted' },
    ],
  },
  {
    id: 'rewards',
    tabLabel: 'Coins, Streak & Rank',
    index: '03.',
    title: 'Consistent Study Streak, Coins & Live Leaderboard',
    summary:
      'Stay accountable every single day. Completing tasks, revising topics, and attempting or creating tests automatically builds your daily streak and awards coins that rank you on the live leaderboard.',
    highlights: [
      'Automatic 7-day consistent study streak calendar — updates live when you study',
      'Earn coins when you create quality tests, complete attempts, and beat personal bests',
      'Rank & Velocity Leaderboard compares all aspirants transparently by coins and progress',
    ],
    benefitHeading: 'Momentum that lasts months',
    benefitText:
      'GATE preparation is a marathon. Visible streaks, coin rewards, and healthy peer ranking keep daily effort steady even during difficult math weeks.',
    previewRows: [
      { label: 'Daily Study Streak', meta: '7-day live calendar · Auto-tracked', status: 'Active today' },
      { label: 'Test Creation & Accuracy Rewards', meta: '+Coins on creation & high scores', status: 'Live ledger' },
      { label: 'Rank & Velocity Leaderboard', meta: 'All aspirants ranked by coins', status: 'Real-time' },
    ],
  },
  {
    id: 'planner',
    tabLabel: 'Planner & Study Chat',
    index: '04.',
    title: 'Daily Execution, Revision Flags & Focused Study Chat',
    summary:
      'Turn long-term syllabus goals into daily tasks, weekly sprints, and Kanban columns. Automatically surface weak topics that need revision and discuss doubts in the moderated GATE Study Group.',
    highlights: [
      'Daily task planner, Kanban board, weekly sprint tracker, and exam calendar',
      'Automatic Needs Revision alerts whenever topic confidence or PYQ accuracy dips',
      'Built-in GATE Study Group & private anonymous-ID direct chat with admin moderation',
    ],
    benefitHeading: 'Plan, revise, and discuss in one place',
    benefitText:
      'No switching between noisy messaging apps, spreadsheets, and to-do lists — keep your schedule, weak-topic drills, and study discussions distraction-free.',
    previewRows: [
      { label: 'Needs Revision Queue', meta: 'Score < 6.0 or PYQ Acc < 60%', status: 'Auto-flagged' },
      { label: 'Weekly Sprint & Kanban', meta: 'Daily goals · Focus tracking', status: 'Synced' },
      { label: 'GATE Study Group Chat', meta: 'Anonymous Chat ID · Moderated', status: 'Active' },
    ],
  },
];

const CORE_BENEFITS = [
  {
    num: '01.',
    title: 'Everything organized by syllabus hierarchy',
    description:
      'Subjects break cleanly into Topics and Subtopics, with Complete Notes, Short Notes, and practice tests sitting directly where you study.',
  },
  {
    num: '02.',
    title: 'Measurable test performance at every level',
    description:
      'See attempted vs pending tests at a glance, review right and wrong answers immediately, and filter down to the exact subtopic you need to drill.',
  },
  {
    num: '03.',
    title: 'Built-in discipline through streaks and coins',
    description:
      'Your daily streak tracks real study activity automatically, while coins and the live leaderboard reward consistent testing and contribution.',
  },
  {
    num: '04.',
    title: 'Distraction-free environment made strictly for GATE DA',
    description:
      'Zero ads, private cloud-synced study state, moderated study chat, and a curriculum tailored exclusively to the 8 official GATE Data Science & AI subjects.',
  },
];

const CURRICULUM_MATRIX = [
  { code: 'P&S', name: 'Probability & Statistics', weight: '18–22%', focus: 'High weightage', topics: 12 },
  { code: 'ML', name: 'Machine Learning', weight: '18–20%', focus: 'High weightage', topics: 14 },
  { code: 'GA', name: 'General Aptitude', weight: '15%', focus: 'High scoring', topics: 13 },
  { code: 'LA', name: 'Linear Algebra', weight: '14–16%', focus: 'Core foundation', topics: 10 },
  { code: 'DSA', name: 'Programming & DSA', weight: '12–14%', focus: 'Core foundation', topics: 11 },
  { code: 'DBMS', name: 'Database Management & Warehousing', weight: '10–12%', focus: 'Core foundation', topics: 9 },
  { code: 'AI', name: 'Artificial Intelligence', weight: '10–12%', focus: 'Core foundation', topics: 8 },
  { code: 'CALC', name: 'Calculus & Optimization', weight: '8–10%', focus: 'Math foundation', topics: 8 },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenLogin,
  onOpenRegister,
  onTryDemo,
}) => {
  const { daysRemaining } = useStudy();
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('notes');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [libraryImgFailed, setLibraryImgFailed] = useState(false);

  const activeModule = APP_MODULES.find((m) => m.id === activeModuleId) || APP_MODULES[0];

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Minimal Clean Top Bar: Brand + Login & Register only */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 rounded"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center shrink-0">
              <Sigma className="w-4 h-4" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              GATE DA 2028
            </span>
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 rounded-lg hover:bg-slate-100/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section: Balanced 2-Column Editorial Split */}
        <section className="bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-14 lg:pt-16 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Proposition Column */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                  <span>GATE Data Science &amp; AI</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {daysRemaining} days to exam
                  </span>
                </div>

                <h1 className="text-[clamp(2.2rem,3.8vw,3.45rem)] font-extrabold text-slate-900 tracking-tight leading-[1.08] [text-wrap:balance]">
                  One structured workspace for notes, tests, streaks, and rank.
                </h1>

                <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Keep your entire GATE DA 2028 preparation organized in one place. Study Complete
                  and Short notes by Subject, Topic, and Subtopic, practice timed MCQ tests with
                  instant answer breakdowns, track daily streaks, and stay motivated on the live
                  coin leaderboard.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Login to Workspace
                  </button>

                  <button
                    type="button"
                    onClick={onTryDemo}
                    className="inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explore Demo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span>Free student workspace</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Cloud synced progress</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Zero ads or distractions</span>
                </div>
              </div>

              {/* Right Visual Anchor Column */}
              <div className="lg:col-span-6 flex">
                <div className="relative w-full min-h-[300px] sm:min-h-[380px] lg:min-h-[430px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  {!heroImgFailed ? (
                    <img
                      src={heroWorkspaceImg}
                      alt="Minimalist academic study desk with linear algebra and probability notes beside a laptop"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 flex flex-col items-center justify-center p-8 text-center">
                      <Sigma className="w-10 h-10 text-indigo-700 mb-3" />
                      <p className="text-sm font-bold text-slate-800">GATE DA 2028 Study Workspace</p>
                      <p className="text-xs text-slate-500 mt-1">Notes · Tests · Streaks · Leaderboard</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-5 sm:p-6 text-white">
                    <p className="text-xs font-medium text-slate-200">
                      Built for IISc Bangalore &amp; IIT M.Tech AI aspirants
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                      Notes, timed tests, revision alerts, and peer leaderboard — unified.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width Key Numbers Strip (Clean Hairline Columns) */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {daysRemaining}
                </div>
                <div className="text-xs font-semibold text-slate-800">Days Until GATE DA 2028</div>
                <div className="text-xs text-slate-500">Live countdown synced to exam window</div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  8 Subjects
                </div>
                <div className="text-xs font-semibold text-slate-800">Complete Syllabus Tree</div>
                <div className="text-xs text-slate-500">Subject → Topic → Subtopic hierarchy</div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-indigo-700">
                  2 Note Modes
                </div>
                <div className="text-xs font-semibold text-slate-800">Complete &amp; Short Notes</div>
                <div className="text-xs text-slate-500">Math, tables, diagrams &amp; animations</div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  Coins + Streak
                </div>
                <div className="text-xs font-semibold text-slate-800">Competitive Motivation</div>
                <div className="text-xs text-slate-500">Daily streak calendar &amp; live peer rank</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive "Inside the Application" Explorer */}
        <section className="py-16 lg:py-24 bg-[#faf9fc] border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-indigo-700">Inside the workspace</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
                  What you get the moment you sign in
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Explore each core module of the platform to see how daily study, revision notes,
                  timed tests, and peer motivation work together.
                </p>
              </div>

              {/* Interactive Segmented Tab Control */}
              <div
                role="tablist"
                aria-label="Application modules"
                className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto shrink-0"
              >
                {APP_MODULES.map((mod) => {
                  const isActive = mod.id === activeModuleId;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mod.tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asymmetric 12-Column Module Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 7 Cols: Module Explanation & Highlights */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-700">
                    <span>{activeModule.index}</span>
                    <span className="font-sans text-slate-500">{activeModule.tabLabel}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {activeModule.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {activeModule.summary}
                  </p>

                  <ul className="space-y-3 pt-2">
                    {activeModule.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{activeModule.benefitHeading}</p>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-md">{activeModule.benefitText}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Start using this</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right 5 Cols: Clean Structured Module Preview */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">Workspace Snapshot</span>
                    <span className="font-mono">{activeModule.tabLabel}</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {activeModule.previewRows.map((row) => (
                      <div key={row.label} className="py-4 first:pt-1 last:pb-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900">{row.label}</span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-indigo-700 whitespace-nowrap shrink-0">
                            {row.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{row.meta}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>All 4 modules included in free account</span>
                  <button
                    type="button"
                    onClick={onTryDemo}
                    className="font-semibold text-slate-800 hover:text-indigo-700 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open Demo
                  </button>
                </div>
              </div>
            </div>

            {/* Compact 4-Item Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-slate-900">Complete &amp; Short Notes</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clean viewer supporting formulas, tables, diagrams, and interactive explanations at every syllabus level.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-slate-900">Level-Wise Practice Tests</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Subject, Topic, and Subtopic tests with timers, instant grading, right/wrong review, and filters.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <Flame className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-slate-900">Streaks &amp; Coin Leaderboard</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatic 7-day consistency tracking plus coins earned from creating and solving tests.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <MessageSquare className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-slate-900">Peer Compare &amp; Study Chat</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Benchmark preparation pace with peers and discuss questions in a moderated GATE Study Group.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Concrete Student Benefits + Editorial Visual */}
        <section className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-indigo-700">Why it works</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
                    Designed to turn daily study into measurable exam readiness
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Most students lose weeks juggling spreadsheets, Telegram channels, and scattered
                    PDFs. Bringing syllabus notes, tests, streaks, and peer comparison into one
                    system removes friction so you focus purely on learning.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/10]">
                  {!libraryImgFailed ? (
                    <img
                      src={academicLibraryImg}
                      alt="Calm university research library hall with natural daylight and wooden study desks"
                      referrerPolicy="no-referrer"
                      onError={() => setLibraryImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                      Focused Academic Study Environment
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 divide-y divide-slate-200 border-t border-b border-slate-200 flex flex-col justify-center">
                {CORE_BENEFITS.map((benefit) => (
                  <div key={benefit.num} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6">
                    <div className="sm:col-span-2 font-mono text-sm font-bold text-indigo-700 tabular-nums">
                      {benefit.num}
                    </div>
                    <div className="sm:col-span-10 space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900">{benefit.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Official 8-Subject GATE DA Curriculum Table */}
        <section className="py-16 lg:py-24 bg-[#faf9fc] border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-indigo-700">Complete syllabus coverage</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  All 8 GATE DA subjects, structured by weightage
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Every subject supports Complete Notes · Short Notes · Practice Tests
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-5">Code</th>
                      <th className="py-3.5 px-5">Subject</th>
                      <th className="py-3.5 px-5">Exam Weightage</th>
                      <th className="py-3.5 px-5">Focus</th>
                      <th className="py-3.5 px-5 text-right">Core Topics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {CURRICULUM_MATRIX.map((subject) => (
                      <tr key={subject.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-indigo-700">
                          {subject.code}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {subject.name}
                        </td>
                        <td className="py-3.5 px-5 font-mono tabular-nums text-xs font-semibold text-slate-800">
                          {subject.weight}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-600">
                          {subject.focus}
                        </td>
                        <td className="py-3.5 px-5 font-mono tabular-nums text-xs text-slate-600 text-right">
                          {subject.topics}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Focused Final Call to Action */}
        <section className="py-16 lg:py-20 bg-slate-950 text-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2.5 max-w-xl">
              <p className="text-xs font-semibold text-indigo-300">
                Start your GATE DA 2028 preparation
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                Build your streak, master every topic, and test yourself consistently.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Create your free student account in under a minute to sync your syllabus progress,
                notes, test history, and coins across every session.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Register Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-5 py-3 rounded-lg border border-slate-700 hover:bg-slate-900 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-7">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-700 text-white flex items-center justify-center">
              <Sigma className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-slate-800">GATE DA 2028</span>
            <span aria-hidden="true">·</span>
            <span>Data Science &amp; AI Study Workspace</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onOpenLogin}
              className="hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Register
            </button>
            <button
              type="button"
              onClick={onTryDemo}
              className="hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Demo Sandbox
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
