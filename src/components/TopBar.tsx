import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Download,
  Upload,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Link2,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface TopBarProps {
  onOpenOmnibox: () => void;
  onOpenAddTask: () => void;
  onOpenBackup: () => void;
  onOpenAuthModal?: () => void;
  onOpenTour?: () => void;
}

const ACADEMIC_MOTTOS = [
  'Rigor precedes brilliance',
  'Depth over speed · Proofs over assumptions',
  'Consistency compounds into AIR 1',
  'Measure what matters, master every theorem',
  'Accuracy first, speed follows organically',
];

export const TopBar: React.FC<TopBarProps> = ({
  onOpenOmnibox,
  onOpenAddTask,
  onOpenBackup,
  onOpenAuthModal,
  onOpenTour,
}) => {
  const {
    activeView,
    setActiveView,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    currentUser,
  } = useStudy();
  const [mottoIndex, setMottoIndex] = useState(0);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setMottoIndex((prev) => (prev + 1) % ACADEMIC_MOTTOS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & Motto */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">GATE DA</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-semibold">{activeView}</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-400">
          <span>{todayFormatted}</span>
          <span>·</span>
          <span className="italic text-slate-500 font-serif">"{ACADEMIC_MOTTOS[mottoIndex]}"</span>
        </div>
      </div>

      {/* Center/Right Utility Items */}
      <div className="flex items-center gap-3">
        {/* Quick Search Omnibox Trigger */}
        <button
          onClick={onOpenOmnibox}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-[#faf8ff] text-slate-500 hover:text-slate-800 hover:border-slate-300 text-xs transition-colors w-48 xl:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate flex-1 text-left">Search syllabus, formulas...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Focus Timer Mini Pill Widget */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white">
          <Timer className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono text-xs font-bold text-slate-800 w-11 text-center">
            {formatTimerTime(timerState.timeLeft)}
          </span>
          <div className="flex items-center gap-0.5 border-l border-slate-100 pl-1">
            {timerState.isRunning ? (
              <button
                onClick={pauseTimer}
                title="Pause Focus Session"
                className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
              >
                <Pause className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                title="Start Focus Session"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                <Play className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={resetTimer}
              title="Reset Timer"
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Task Button */}
        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {/* Prep Guide Quick Switch */}
        <button
          onClick={() => setActiveView('Guide')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            activeView === 'Guide'
              ? 'border-indigo-600 bg-indigo-700 text-white shadow-2xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
          title="Open GATE DA Master Preparation Guide & Strategy Handbook"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prep Guide</span>
        </button>

        {/* Platform Tour & How to Operate */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-all shadow-2xs"
            title="Platform Guide & Feature Tour - Learn how to operate this platform"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">Platform Tour</span>
          </button>
        )}

        {/* Backup / Export Trigger */}
        <button
          onClick={onOpenBackup}
          title="Backup & Restore Data"
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* User Account / Cloud Sync Trigger */}
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-xs font-semibold transition-colors"
            title="Supabase Cloud Account & Aspirant Switcher"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[100px]">
              {currentUser ? currentUser.fullName.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
