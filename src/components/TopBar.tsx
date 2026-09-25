import React, { useState, useRef, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Search,
  Plus,
  Compass,
  Download,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface TopBarProps {
  onOpenOmnibox: () => void;
  onOpenAddTask: () => void;
  onOpenBackup: () => void;
  onOpenAuthModal?: () => void;
  onOpenTour?: () => void;
  onOpenSettings?: () => void;
  onToggleMobileMenu?: () => void;
}

const ACADEMIC_MOTTOS = [
  'Consistency compounds into AIR 1',
  'Master the boundary cases & proofs',
  'Zero partial marking in MSQ: Verify all 4 options',
  'Target: IISc Bangalore & IIT Bombay',
  'Every theorem understood is 2 marks secured',
];

export const TopBar: React.FC<TopBarProps> = ({
  onOpenOmnibox,
  onOpenAddTask,
  onOpenBackup,
  onOpenAuthModal,
  onOpenTour,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const {
    activeView,
    setActiveView,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    currentUser,
    logout,
    settings,
  } = useStudy();

  const [mottoIndex, setMottoIndex] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  // Cycle mottos on click
  const cycleMotto = () => {
    setMottoIndex((prev) => (prev + 1) % ACADEMIC_MOTTOS.length);
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format timer seconds into mm:ss
  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DA';

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Drawer Trigger + Today's Date & Academic Motto */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
            {todayFormatted}
          </span>
        </div>

        <div
          onClick={cycleMotto}
          className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors select-none truncate"
          title="Click to cycle daily preparation focus rule"
        >
          <span className="text-slate-300">/</span>
          <span className="truncate italic font-medium">{ACADEMIC_MOTTOS[mottoIndex]}</span>
        </div>
      </div>

      {/* Right Controls: Focus Timer, Search, New Task & Unified Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Focus Timer Widget */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50/80 shadow-2xs">
          <Timer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-800 w-11 text-center">
            {formatTimerTime(timerState.timeLeft)}
          </span>
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1">
            {timerState.isRunning ? (
              <button
                onClick={pauseTimer}
                title="Pause Focus Session"
                className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200 transition-colors"
              >
                <Pause className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                title="Start Focus Session"
                className="p-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-200 transition-colors"
              >
                <Play className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={resetTimer}
              title="Reset Timer"
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Global Omnibox Search (⌘K) */}
        <button
          onClick={onOpenOmnibox}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs transition-colors shadow-2xs"
          title="Search syllabus, formulas, and proofs (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline text-slate-500">Search</span>
          <kbd className="hidden md:inline-block px-1 py-0.5 text-[9px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Task */}
        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Unified Profile & Utility Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            title="Account & Portal Tools"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
              {currentUser?.fullName?.split(' ')[0] || 'Aspirant'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Profile Dropdown Popover */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* User Info Header */}
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">
                  {currentUser?.fullName || 'GATE Aspirant'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    Target AIR #{settings.targetAir}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {settings.targetCollege?.split('(')[0] || 'IISc Bangalore'}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="py-1">
                {onOpenTour && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenTour();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-purple-50 text-purple-700 font-medium transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span>Platform Tour &amp; Guide</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setActiveView('Guide');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Preparation Guide &amp; Blueprint</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Backup &amp; Export Data</span>
                </button>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Goal &amp; Profile Settings</span>
                  </button>
                )}
              </div>

              {/* Sign Out / Switch Account */}
              <div className="pt-1 border-t border-slate-100">
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-indigo-700 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Switch Aspirant Profile</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-rose-50 text-rose-700 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Log Out of Portal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
