import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Menu,
  Coins,
  Trophy,
  X,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface TopBarProps {
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
  onOpenBackup,
  onOpenAuthModal,
  onOpenTour,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const {
    activeView,
    setActiveView,
    currentUser,
    logout,
    settings,
    coinBalance,
    lastCoinToast,
    dismissCoinToast,
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

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DA';

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs relative">
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

      {/* Right Controls: Coin Balance Pill & Unified Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Live Coin Balance Button -> Opens Competitive Leaderboard */}
        <button
          type="button"
          onClick={() => setActiveView('Leaderboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs ${
            activeView === 'Leaderboard'
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/80'
          }`}
          title="View Coin Balance & Competitive Leaderboard"
        >
          <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-mono tabular-nums font-bold">
            {coinBalance.toLocaleString()}
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-amber-800">
            Coins
          </span>
          <Trophy className="w-3 h-3 text-amber-600/80 hidden sm:inline shrink-0" />
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

                {/* Prep Guide temporarily disabled.
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
                */}

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

              {/* Sign Out / Account Sign In */}
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
                    <span>Sign In with Another Account</span>
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

      {/* Floating Coin Earned Notification Toast */}
      {lastCoinToast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-lg text-amber-950 animate-in fade-in slide-in-from-top-2 duration-200 max-w-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold font-mono text-amber-900">
              +{lastCoinToast.amount} Coins Earned!
            </div>
            <div className="text-[11px] text-amber-800 truncate">{lastCoinToast.reason}</div>
          </div>
          <button
            type="button"
            onClick={dismissCoinToast}
            className="p-1 rounded text-amber-700 hover:bg-amber-200/60 shrink-0"
            aria-label="Dismiss coin notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
