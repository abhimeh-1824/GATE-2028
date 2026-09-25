import React, { useState } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Timer,
  Database,
  Users,
  Download,
  BookOpen,
  Calculator,
  Target,
  Brain,
  Layers,
  Calendar,
  Volume2,
  ArrowRight,
} from 'lucide-react';

interface PlatformTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStudying?: () => void;
}

interface TourStep {
  stepNumber: number;
  tabLabel: string;
  title: string;
  subtitle: string;
  sectionHeader: string;
  items: Array<{
    title: string;
    description: string;
    shortcut?: string;
  }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    tabLabel: '01 Goal Tracking',
    title: 'Target AIR & Exam Goal Tracking',
    subtitle: 'Define your destination, countdown clock, and required weekly study pace',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Target AIR & Institution Benchmark',
        description: 'Set your target rank (e.g. AIR 10) and college (IISc Bangalore / IIT Bombay) in Settings to calibrate your preparation trajectory.',
      },
      {
        title: 'Live Exam Countdown',
        description: 'Real-time countdown to GATE DA 2028 keeps daily focus aligned with long-term compounding.',
      },
      {
        title: 'Weekly Study Pace Targets',
        description: 'Track logged hours against your weekly goal (e.g. 25 hrs/wk) to maintain disciplined study velocity.',
      },
      {
        title: 'Dynamic Syllabus Progress Gauge',
        description: 'Live percentage calculation across all 85 topics reflecting in-depth conceptual completion.',
      },
    ],
  },
  {
    stepNumber: 2,
    tabLabel: '02 Daily Study',
    title: 'Daily Action Block & Task Execution',
    subtitle: 'Turn multi-year aspirations into executable, trackable daily study blocks',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Daily Task Management',
        description: 'Create and organize tasks by priority, target topic, and estimated minutes. Filter completed and pending tasks with one click.',
      },
      {
        title: 'Integrated Pomodoro Focus Timer',
        description: 'Run 25-minute deep focus sprints. Completed sessions automatically log studied hours into your subject records.',
      },
      {
        title: 'Audio Chime Feedback',
        description: 'Subtle acoustic rewards upon completing study sprints and checking off difficult syllabus tasks.',
      },
      {
        title: 'Quick Add Task Anywhere',
        description: 'Click "+ New Task" in the top bar from any screen to capture incoming problem sets or revision items.',
      },
    ],
  },
  {
    stepNumber: 3,
    tabLabel: '03 Cognitive Science',
    title: 'Spaced Repetition & Retention Engine',
    subtitle: 'Mitigate the Ebbinghaus forgetting curve with automated revision scheduling',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Automated Needs-Revision Engine',
        description: 'Topics with low confidence (1–3 stars) or overdue revision dates automatically surface in your priority queue.',
      },
      {
        title: '1-to-5 Star Confidence Rating',
        description: 'Rate your mastery after studying a topic. Low confidence marks the topic for early spaced repetition.',
      },
      {
        title: 'Targeted Revision Action Sprints',
        description: 'Jump straight from the dashboard revision widget into the formula vault or topic lecture to patch memory lapses.',
      },
      {
        title: 'Active Retention Tracking',
        description: 'Track days elapsed since last revision to ensure no theorem or algorithm goes cold before the exam.',
      },
    ],
  },
  {
    stepNumber: 4,
    tabLabel: '04 KaTeX Math Engine',
    title: 'Formula & Theorem Vault with KaTeX',
    subtitle: 'High-yield mathematical proofs, core theorems, and dangerous GATE DA edge-cases',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Dual Blackboard & Paper Modes',
        description: 'Toggle between Chalkboard (high-contrast dark mode with glowing green chalk) and Paper (clean academic ink).',
      },
      {
        title: 'Precision KaTeX Rendering',
        description: '36 critical theorems rendered in crisp mathematical notation without blurry images or formatting errors.',
      },
      {
        title: 'Formula / LaTeX / Text Mode Switcher',
        description: 'Switch any theorem card between rendered KaTeX math, copyable raw LaTeX source code, and intuitive plain text.',
      },
      {
        title: 'GATE DA Edge-Case & Trap Alerts',
        description: 'Every formula includes highlighted examiner traps (e.g. CLT finite variance requirement, Bayes false positive fallacy).',
      },
    ],
  },
  {
    stepNumber: 5,
    tabLabel: '05 Active Recall',
    title: 'PYQ Accuracy & Mock CBT Analytics',
    subtitle: 'Measure problem-solving accuracy and simulate exam pressure',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Topic-Level PYQ Tracking',
        description: 'Log total Previous Year Questions solved versus attempted to maintain transparent accuracy percentages.',
      },
      {
        title: 'Mock Test Simulator & Score History',
        description: 'Record full 100-mark mock test results, time taken, percentile, and detailed diagnostic breakdown of weak vs strong areas.',
      },
      {
        title: 'MSQ (Multiple Select) Accuracy Isolation',
        description: 'Pay special attention to MSQ practice where zero partial marking demands rigorous truth verification for all 4 options.',
      },
      {
        title: 'Predicted Percentile & Cutoff Benchmarking',
        description: 'Compare your mock scores with IISc Bangalore / IIT Bombay M.Tech AI cutoff requirements.',
      },
    ],
  },
  {
    stepNumber: 6,
    tabLabel: '06 Curriculum & Resources',
    title: '8-Subject Curriculum, Videos & Textbooks',
    subtitle: 'Comprehensive syllabus tree with multi-format learning resources',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Complete 8-Subject Syllabus Structure',
        description: 'Browse Probability & Stats, Linear Algebra, Calculus, Python/DSA, DBMS, ML, AI, and General Aptitude.',
      },
      {
        title: 'Curated Video Lectures & NPTEL Links',
        description: 'Direct links to high-yield playlists and academic lectures matched to specific subtopics.',
      },
      {
        title: 'Canonical Textbooks Directory',
        description: 'Chapter-by-chapter reading guides for Gilbert Strang, Sheldon Ross, Bishop PRML, Russell & Norvig, and CLRS.',
      },
      {
        title: 'Custom User Resource Attachments',
        description: 'Attach your own Google Drive links, personal notes, and PDF bookmarks directly to any topic.',
      },
    ],
  },
  {
    stepNumber: 7,
    tabLabel: '07 Strategic Roadmap',
    title: '4-Year Roadmap & Exam Calendar',
    subtitle: 'Multi-phase milestones from foundation to full mock test series',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Phase-by-Phase Preparation Campaign',
        description: 'Follow 4 strategic phases: Pure Mathematics Foundations, Computational Core, Advanced ML/AI, and CBT Mock Drills.',
      },
      {
        title: 'Milestone Deliverable Tracking',
        description: 'Clear topic coverage targets and deliverables mapped to your academic semesters.',
      },
      {
        title: 'Interactive Study & Exam Calendar',
        description: 'View scheduled revision cycles, mock tests, and milestone deadlines in a clean monthly calendar.',
      },
      {
        title: 'Custom Study Block Scheduling',
        description: 'Add custom revision blocks or test events with specific subject tags and durations.',
      },
    ],
  },
  {
    stepNumber: 8,
    tabLabel: '08 Platform Guide',
    title: 'Platform Guide & Feature Tour',
    subtitle: 'Learn where key features are located and how to maximize your GATE DA prep',
    sectionHeader: 'KEY CAPABILITIES & HOW TO USE:',
    items: [
      {
        title: 'Global Omnibox (Cmd+K / Ctrl+K)',
        description: 'Search any theorem, formula, topic, or subject instantaneously from anywhere in the app.',
        shortcut: '⌘K / Ctrl+K',
      },
      {
        title: 'Focus Timer',
        description: 'Track 25–minute Pomodoro study sprints that automatically log into your daily study hours.',
      },
      {
        title: 'Cloud Database Sync',
        description: 'Connect with Supabase to preserve your progress across multiple devices and browser sessions.',
      },
      {
        title: 'Peer Benchmarking Hub',
        description: 'Compare your syllabus coverage, logged hours, and accuracy with real registered aspirants in the database.',
      },
      {
        title: 'Offline Backup & JSON Export',
        description: 'Export your complete study data to JSON or restore a snapshot anytime with 1-click.',
      },
      {
        title: 'Audio Feedback & Focus Controls',
        description: 'Toggle audio feedback for focus sprints and task achievements from the sidebar sound toggle.',
      },
    ],
  },
];

export const PlatformTourModal: React.FC<PlatformTourModalProps> = ({
  isOpen,
  onClose,
  onStartStudying,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(7); // Default to Step 8 (as in screenshot) or Step 1

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header (Matches Screenshot) */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentStep.title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 font-mono">
                  Step {currentStep.stepNumber} of {TOUR_STEPS.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs Horizontal Scroller (Matches Screenshot exactly) */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-100 bg-[#fbfbff]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {TOUR_STEPS.map((step, idx) => {
              const isSelected = idx === currentStepIndex;
              return (
                <button
                  key={step.stepNumber}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {step.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Key Capabilities & How to Use (Matches Screenshot) */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{currentStep.sectionHeader}</span>
          </div>

          <div className="space-y-3">
            {currentStep.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl border border-indigo-100/80 bg-white shadow-2xs hover:border-indigo-200 transition-all flex items-start gap-3.5"
              >
                <div className="w-5 h-5 rounded-full border border-indigo-500/80 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500 shrink-0">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation Toolbar (Matches Screenshot exactly: < Previous, Start Studying ->, Finish Tour >) */}
        <div className="p-3 sm:px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-xs font-semibold transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onStartStudying) onStartStudying();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-colors"
          >
            <span>Start Studying</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {currentStepIndex < TOUR_STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Finish Tour</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
