import React, { useState, useEffect } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OmniboxModal } from './components/modals/OmniboxModal';
import { FormulaVaultModal } from './components/modals/FormulaVaultModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { BackupModal } from './components/modals/BackupModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AuthModal } from './components/modals/AuthModal';
import { PlatformTourModal } from './components/modals/PlatformTourModal';
import { LandingPageView } from './components/views/LandingPageView';
import { DashboardView } from './components/views/DashboardView';
import { DailyView } from './components/views/DailyView';
import { WeeklyView } from './components/views/WeeklyView';
import { SubjectsView } from './components/views/SubjectsView';
import { RoadmapView } from './components/views/RoadmapView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { CalendarView } from './components/views/CalendarView';
import { PeerCompareView } from './components/views/PeerCompareView';
import { GuideView } from './components/views/GuideView';
import { SubjectId } from './types';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    activeView,
    setActiveView,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginAsDemo,
  } = useStudy();

  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);
  const [isFormulaVaultOpen, setIsFormulaVaultOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId | undefined>('linear_algebra');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);

  // Global keyboard shortcut for Omnibox (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniboxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTopicFromOmnibox = (subjectId: string, topicId: string) => {
    setSelectedSubjectId(subjectId as SubjectId);
    setActiveView('Subjects');
  };

  const handleOpenFormula = (formulaId: string) => {
    setSelectedFormulaId(formulaId);
    setIsFormulaVaultOpen(true);
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId as SubjectId);
    setActiveView('Subjects');
  };

  // GATE 1: If user is not logged in, show the Home/Landing Page!
  // No unauthenticated visitor can enter the internal study portal.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#faf8ff]">
        <LandingPageView
          onOpenLogin={() => {
            setAuthModalTab('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthModalTab('register');
            setIsAuthModalOpen(true);
          }}
          onTryDemo={loginAsDemo}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </div>
    );
  }

  // GATE 2: Authenticated User Portal Workspace
  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8ff] text-slate-900 font-sans">
      {/* Pinned Desktop Sidebar & Mobile Slide-Over Drawer */}
      <Sidebar
        onOpenFormulaVault={() => {
          setSelectedFormulaId(null);
          setIsFormulaVaultOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Utility Header (56px) - Responsive & Clean */}
        <TopBar
          onOpenOmnibox={() => setIsOmniboxOpen(true)}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleMobileMenu={() => setIsMobileNavOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto">
          {activeView === 'Dashboard' && (
            <DashboardView
              onOpenFormulaVault={() => {
                setSelectedFormulaId(null);
                setIsFormulaVaultOpen(true);
              }}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {activeView === 'Daily' && (
            <DailyView onOpenAddTask={() => setIsAddTaskOpen(true)} />
          )}

          {activeView === 'Weekly' && <WeeklyView />}

          {activeView === 'Subjects' && (
            <SubjectsView
              initialSubjectId={selectedSubjectId}
              onOpenFormulaVault={() => {
                setSelectedFormulaId(null);
                setIsFormulaVaultOpen(true);
              }}
            />
          )}

          {activeView === 'Roadmap' && <RoadmapView />}

          {activeView === 'Analytics' && <AnalyticsView />}

          {activeView === 'Calendar' && <CalendarView />}

          {activeView === 'PeerCompare' && <PeerCompareView />}

          {activeView === 'Guide' && (
            <GuideView onOpenTour={() => setIsTourOpen(true)} />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <OmniboxModal
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
        onSelectTopic={handleSelectTopicFromOmnibox}
        onOpenFormula={handleOpenFormula}
      />

      <FormulaVaultModal
        isOpen={isFormulaVaultOpen}
        onClose={() => {
          setIsFormulaVaultOpen(false);
          setSelectedFormulaId(null);
        }}
        selectedFormulaId={selectedFormulaId}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      <PlatformTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onStartStudying={() => {
          setIsTourOpen(false);
          setActiveView('Daily');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StudyProvider>
        <MainAppContent />
      </StudyProvider>
    </ErrorBoundary>
  );
}
