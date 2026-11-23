import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Columns3,
  CalendarDays,
  BookOpen,
  BarChart3,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  BookMarked,
  Award,
  Users,
  MessageCircle,
  Compass,
  HelpCircle,
  X,
  FileCode2,
  Workflow,
  Library,
  TrendingUp,
  ClipboardCheck,
  Trophy,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { soundManager } from '../utils/audio';
import { NavAccordionGroup, type NavChildItem } from './common/NavAccordionGroup';

interface SidebarProps {
  onOpenFormulaVault: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
  onOpenTour?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenFormulaVault,
  onOpenSettingsModal,
  onOpenAuthModal,
  onOpenTour,
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    activeView,
    setActiveView,
    tasks,
    daysRemaining,
    settings,
    currentUser,
    canManageContent,
    levelTests,
    testAttempts,
    coinBalance,
    streakInfo,
    resetToDefaults,
  } = useStudy();
  const [soundEnabled, setSoundEnabled] = React.useState(soundManager.isEnabled());

  const incompleteTasksCount = tasks.filter((t) => !t.completed).length;
  const activeTestsCount = levelTests.filter((t) => t.isActive).length;
  const attemptedTestIds = new Set(testAttempts.map((a) => a.testId));
  const pendingTestsCount = levelTests.filter(
    (t) => t.isActive && !attemptedTestIds.has(t.id)
  ).length;

  const toggleSound = () => {
    const next = !soundEnabled;
    soundManager.setEnabled(next);
    setSoundEnabled(next);
    if (next) soundManager.playCompletionChime();
  };

  // ── Standalone top-level items ──
  const dashboardItem = {
    id: 'Dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  };

  const chatItem = {
    id: 'Chat',
    label: 'Study Chat',
    icon: MessageCircle,
  };

  // ── Academic Workflow group ──
  const academicWorkflowChildren: NavChildItem[] = [
    {
      id: 'Daily',
      label: 'Daily Study',
      icon: CalendarCheck2,
      badge: incompleteTasksCount > 0 ? `${incompleteTasksCount} tasks` : null,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'Kanban',
      label: 'Kanban & Sprints',
      icon: Columns3,
      badge: '1-Wk Sprint',
      badgeColor: 'text-indigo-700 bg-indigo-50 font-mono font-medium',
    },
    {
      id: 'Weekly',
      label: 'Weekly Review',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'Calendar',
      label: 'Exam Calendar',
      icon: Calendar,
      badge: null,
    },
  ];

  // ── Subjects & Materials group ──
  const subjectsMaterialsChildren: NavChildItem[] = [
    {
      id: 'Subjects',
      label: 'Subjects & Curriculum',
      icon: BookOpen,
      badge: 'Notes & Tree',
      badgeColor: 'text-indigo-700 bg-indigo-50 font-mono font-bold',
    },
    {
      id: 'Tests',
      label: 'Tests & Results',
      icon: ClipboardCheck,
      badge:
        pendingTestsCount > 0
          ? `${pendingTestsCount} new`
          : activeTestsCount > 0
            ? `${activeTestsCount} tests`
            : 'All Tests',
      badgeColor:
        pendingTestsCount > 0
          ? 'text-amber-700 bg-amber-50 font-mono font-bold'
          : 'text-emerald-700 bg-emerald-50 font-mono font-bold',
    },
    {
      id: 'ContentStudio',
      label: 'Notes & Tests Studio',
      icon: FileCode2,
      badge: canManageContent ? 'Admin/CMS' : 'Add Tests',
      badgeColor: canManageContent
        ? 'text-emerald-700 bg-emerald-50 font-mono font-bold'
        : 'text-indigo-700 bg-indigo-50 font-mono',
    },
  ];

  // ── Performance & Insights group ──
  const performanceInsightsChildren: NavChildItem[] = [
    {
      id: 'Leaderboard',
      label: 'Coin Leaderboard',
      icon: Trophy,
      badge: `${coinBalance.toLocaleString()} Coins`,
      badgeColor: 'text-amber-800 bg-amber-50 font-mono font-bold',
    },
    {
      id: 'Analytics',
      label: 'Analytics & Telemetry',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'PeerCompare',
      label: 'Peer Benchmarking',
      icon: Users,
      badge: 'Compare',
      badgeColor: 'text-indigo-700 bg-indigo-50 font-mono',
    },
  ];

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    soundManager.playSubtleTick();
    if (onCloseMobile) onCloseMobile();
  };

  /** Render a standalone (non-grouped) navigation button */
  const renderStandaloneItem = (item: { id: string; label: string; icon: React.FC<{ className?: string }> }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-900 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-indigo-700' : 'text-slate-400'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>
      </button>
    );
  };

  const renderContent = (isMobile: boolean) => (
    <>
      {/* Top Brand Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              DA
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight truncate">
                GATE DA 2028
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Academic Study Tracker
              </p>
            </div>
          </div>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Menu"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Days Countdown Kicker */}
        <div className="mt-3.5 px-2.5 py-1.5 rounded-md bg-[#faf8ff] border border-indigo-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600">Target CBT</span>
          <span className="text-xs font-bold text-indigo-700 font-mono tracking-tight">
            {daysRemaining} Days
          </span>
        </div>
      </div>

      {/* Navigation Routes */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto sidebar-nav-scroll">

        {/* 1. Dashboard — standalone */}
        {renderStandaloneItem(dashboardItem)}

        {/* 2. Academic Workflow — collapsible group */}
        <NavAccordionGroup
          label="Academic Workflow"
          icon={Workflow}
          children={academicWorkflowChildren}
          activeView={activeView}
          onNavigate={handleNavClick}
        />

        {/* 3. Subjects & Materials — collapsible group */}
        <NavAccordionGroup
          label="Subjects & Materials"
          icon={Library}
          children={subjectsMaterialsChildren}
          activeView={activeView}
          onNavigate={handleNavClick}
        />

        {/* 4. Performance & Insights — collapsible group */}
        <NavAccordionGroup
          label="Performance & Insights"
          icon={TrendingUp}
          children={performanceInsightsChildren}
          activeView={activeView}
          onNavigate={handleNavClick}
        />

        {/* 5. Study Chat — standalone */}
        {renderStandaloneItem(chatItem)}

        {/* Quick Tools Section */}
        <div className="pt-3 px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Quick Tools
        </div>

        {/* Formula & Traps Vault temporarily disabled.
        <button
          onClick={() => {
            onOpenFormulaVault();
            if (isMobile && onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <BookMarked className="w-4 h-4 text-slate-400" />
          <span>Formula &amp; Traps Vault</span>
        </button>
        */}

        <button
          onClick={() => {
            onOpenSettingsModal();
            if (isMobile && onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Award className="w-4 h-4 text-slate-400" />
          <span>AIR Goals &amp; Config</span>
        </button>

        {/* Account Sign In temporarily disabled in sidebar.
        <button
          onClick={() => {
            onOpenAuthModal();
            if (isMobile && onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{currentUser ? 'Account Sign In' : 'Sign In / Register'}</span>
          </div>
        </button>
        */}

        {onOpenTour && (
          <button
            onClick={() => {
              onOpenTour();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200/60 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Platform Tour &amp; Guide</span>
          </button>
        )}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
        {/* Real Consistent Streak Indicator */}
        <div
          className="px-2.5 py-2 bg-white rounded-md border border-slate-200/80 space-y-1.5"
          title={`Current streak: ${streakInfo.currentStreak} day(s) • Best: ${streakInfo.longestStreak} day(s)`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-600">Consistent Streak</span>
            <span
              className={`font-bold font-mono tabular-nums flex items-center gap-1 ${
                streakInfo.currentStreak > 0 ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              <Sparkles
                className={`w-3 h-3 ${
                  streakInfo.studiedToday ? 'text-amber-500' : 'text-slate-400'
                }`}
              />
              {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          {/* Live Last-7-Days Activity Dots */}
          <div className="grid grid-cols-7 gap-1 pt-0.5">
            {streakInfo.last7Days.map((day) => (
              <div
                key={day.dateKey}
                className="flex flex-col items-center gap-0.5"
                title={`${day.dateKey}${day.isToday ? ' (Today)' : ''}: ${
                  day.active ? 'Studied' : 'No activity'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    day.active
                      ? 'bg-emerald-500 shadow-2xs'
                      : day.isToday
                        ? 'border-2 border-amber-400 bg-amber-50'
                        : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono leading-none ${
                    day.isToday
                      ? 'font-bold text-indigo-700'
                      : day.active
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-400'
                  }`}
                >
                  {day.dayShort}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-100">
            <span className={streakInfo.studiedToday ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {streakInfo.studiedToday
                ? 'Active today ✓'
                : 'Complete 1 task/test today'}
            </span>
            {streakInfo.longestStreak > 0 && (
              <span className="font-mono text-slate-400">
                Best {streakInfo.longestStreak}d
              </span>
            )}
          </div>
        </div>

        {/* User Card & Account Controls temporarily disabled in sidebar.
        <div className="flex items-center justify-between pt-0.5">
          <div
            onClick={() => {
              onOpenAuthModal();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
            title="Click to Sign In or Manage Account"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-semibold shrink-0 group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
              {currentUser ? currentUser.fullName.charAt(0).toUpperCase() : settings.userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                {currentUser ? currentUser.fullName : settings.userName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                AIR #{settings.targetAir} Target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset all progress and tasks to clean starting state (0%)?')) {
                  resetToDefaults();
                  if (isMobile && onCloseMobile) onCloseMobile();
                }
              }}
              title="Reset to 0% Clean Slate"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        */}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 select-none z-30">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-white h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
