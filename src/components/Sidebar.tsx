import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  BookOpen,
  MapPin,
  BarChart3,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  BookMarked,
  Award
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { soundManager } from '../utils/audio';

interface SidebarProps {
  onOpenFormulaVault: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenFormulaVault,
  onOpenSettingsModal,
  onOpenAuthModal,
}) => {
  const {
    activeView,
    setActiveView,
    tasks,
    subjects,
    syllabusPercent,
    daysRemaining,
    settings,
    currentUser,
    allUsers,
    logout,
    resetToDefaults,
  } = useStudy();
  const [soundEnabled, setSoundEnabled] = React.useState(soundManager.isEnabled());

  const incompleteTasksCount = tasks.filter((t) => !t.completed).length;

  const toggleSound = () => {
    const next = !soundEnabled;
    soundManager.setEnabled(next);
    setSoundEnabled(next);
    if (next) soundManager.playCompletionChime();
  };

  const navItems = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'Daily',
      label: 'Daily Study',
      icon: CalendarCheck2,
      badge: incompleteTasksCount > 0 ? `${incompleteTasksCount} tasks` : null,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'Weekly',
      label: 'Weekly Review',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'Subjects',
      label: 'Subjects Mastery',
      icon: BookOpen,
      badge: `${subjects.length} Total`,
      badgeColor: 'text-slate-600 bg-slate-100',
    },
    {
      id: 'Roadmap',
      label: 'Roadmap 2028',
      icon: MapPin,
      badge: `${syllabusPercent}%`,
      badgeColor: 'text-indigo-700 bg-indigo-50 font-mono',
    },
    {
      id: 'Analytics',
      label: 'Analytics & Telemetry',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'Calendar',
      label: 'Exam Calendar',
      icon: Calendar,
      badge: null,
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
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

        {/* Days Countdown Kicker */}
        <div className="mt-3.5 px-2.5 py-1.5 rounded-md bg-[#faf8ff] border border-indigo-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600">Target CBT</span>
          <span className="text-xs font-bold text-indigo-700 font-mono tracking-tight">
            {daysRemaining} Days
          </span>
        </div>
      </div>

      {/* Navigation Routes */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Curriculum & Workflow
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                soundManager.playSubtleTick();
              }}
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

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded text-center shrink-0 ${
                    item.badgeColor || 'text-slate-500 bg-slate-100'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Tools Section */}
        <div className="pt-3 px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Quick Tools
        </div>

        <button
          onClick={onOpenFormulaVault}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <BookMarked className="w-4 h-4 text-slate-400" />
          <span>Formula & Traps Vault</span>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Award className="w-4 h-4 text-slate-400" />
          <span>AIR Goals & Config</span>
        </button>

        <button
          onClick={onOpenAuthModal}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{currentUser ? 'Switch Aspirant' : 'Sign In / Register'}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
            {allUsers.length > 0 ? `${allUsers.length} Users` : '0% Base'}
          </span>
        </button>
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
        {/* Streak Indicator */}
        <div className="px-2 py-1.5 bg-white rounded-md border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-medium text-slate-600">Consistent Streak</span>
            <span className="font-bold text-emerald-600 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {settings.streakCount} Days
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-emerald-500">
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span className="text-slate-300">○</span>
          </div>
        </div>

        {/* User Card & Controls */}
        <div className="flex items-center justify-between pt-0.5">
          <div
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
            title="Click to Switch User or Manage Accounts"
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
                }
              }}
              title="Reset to 0% Clean Slate"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
