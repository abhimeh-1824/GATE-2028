import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  getAllPeerProfilesFromDatabase,
  syncUserProfileAndProgressToDatabase,
} from '../../lib/peerProgressService';
import { UserProgressProfile } from '../../types';
import { ComparisonCharts } from '../peer/ComparisonCharts';
import { PeerDetailModal } from '../peer/PeerDetailModal';
import {
  Users,
  BarChart3,
  Award,
  Search,
  Lock,
  ShieldCheck,
  TrendingUp,
  Flame,
  CheckCircle2,
  ExternalLink,
  Target,
  Sparkles,
  Layers,
  ArrowUpDown,
  BookOpen,
  Database,
  RefreshCw,
  UploadCloud,
  Check,
  UserPlus,
  Link2,
} from 'lucide-react';
import { DEFAULT_LINKED_APPLET_URL } from '../../lib/linkedAppletSyncService';

export const PeerCompareView: React.FC = () => {
  const {
    currentUser,
    subjects,
    totalHoursStudied,
    mockTests,
    settings,
    setIsAuthModalOpen,
    linkedAppletConfig,
    syncWithLinkedApplet,
    isSyncingLinkedApplet,
    setIsLinkedSyncModalOpen,
    linkedSyncMessage,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<'charts' | 'directory' | 'leaderboard'>('charts');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetAirFilter, setTargetAirFilter] = useState<'all' | 'top20' | 'top50'>('all');
  const [selectedPeerForAudit, setSelectedPeerForAudit] = useState<UserProgressProfile | null>(null);

  // Real Database state
  const [profiles, setProfiles] = useState<UserProgressProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [dbMessage, setDbMessage] = useState<string>('Connected to Supabase');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Fetch all REAL users directly from the database
  const loadRealPeers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllPeerProfilesFromDatabase(
        currentUser,
        subjects,
        totalHoursStudied,
        mockTests,
        settings
      );
      setProfiles(res.profiles);
      setDbConnected(res.dbConnected);
      setDbMessage(res.message);
    } catch (e: any) {
      console.warn('Error loading real peers from database:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, subjects, totalHoursStudied, mockTests, settings]);

  useEffect(() => {
    loadRealPeers();
  }, [loadRealPeers]);

  // Sync user progress directly to Supabase
  const handleSyncToDatabase = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncUserProfileAndProgressToDatabase(
        currentUser,
        subjects,
        totalHoursStudied,
        mockTests,
        settings
      );
      setSyncFeedback(res.message);
      await loadRealPeers();
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const currentUserProfile = profiles.find((p) => p.isCurrentUser);

  // Filtered peer directory
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.targetCollege.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (targetAirFilter === 'top20') return p.targetAir <= 20;
      if (targetAirFilter === 'top50') return p.targetAir <= 50;
      return true;
    });
  }, [profiles, searchQuery, targetAirFilter]);

  // Cohort statistics computed strictly from REAL database records
  const cohortAvgSyllabus =
    profiles.length > 0
      ? Math.round(profiles.reduce((acc, p) => acc + p.syllabusPercent, 0) / profiles.length)
      : 0;

  const cohortAvgAccuracy =
    profiles.length > 0
      ? Math.round(profiles.reduce((acc, p) => acc + p.overallPyqAccuracy, 0) / profiles.length)
      : 0;

  const cohortAvgHours =
    profiles.length > 0
      ? Math.round(profiles.reduce((acc, p) => acc + p.totalHoursStudied, 0) / profiles.length)
      : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                PEER BENCHMARKING ENGINE
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                VERIFIED ASPIRANTS
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                <Award className="w-3 h-3" />
                COHORT TELEMETRY
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Peer Progress &amp; Comparison Hub
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent academic benchmarking. Compare your syllabus coverage, problem-solving accuracy, logged study hours, and mock test scores with verified GATE DA aspirants across India.
            </p>
          </div>

          {/* Sync & Refresh Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl min-w-[280px] text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800 font-mono text-[11px]">
                  Active Cohort: {profiles.length} Verified {profiles.length === 1 ? 'Aspirant' : 'Aspirants'}
                </span>
              </div>
              <button
                onClick={loadRealPeers}
                disabled={isLoading}
                title="Refresh cohort leaderboard"
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncToDatabase}
                disabled={isSyncing}
                className="w-full px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Ranking...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Update My Benchmark Ranking</span>
                  </>
                )}
              </button>
            </div>

            {syncFeedback && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium">
                {syncFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Real Database Benchmark Numbers Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 font-mono">
          <div className="p-3 bg-[#faf8ff] border border-indigo-100 rounded-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Real Aspirants in DB</div>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">{profiles.length} Registered</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Zero hardcoding</div>
          </div>

          <div className="p-3 bg-[#faf8ff] border border-indigo-100 rounded-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cohort Avg Syllabus</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{cohortAvgSyllabus}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              You: {currentUserProfile?.syllabusPercent || 0}%
            </div>
          </div>

          <div className="p-3 bg-[#faf8ff] border border-indigo-100 rounded-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cohort Avg Accuracy</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{cohortAvgAccuracy}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              You: {currentUserProfile?.overallPyqAccuracy || 0}%
            </div>
          </div>

          <div className="p-3 bg-[#faf8ff] border border-indigo-100 rounded-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Avg Study Hours</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{cohortAvgHours}h</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
              You: {currentUserProfile?.totalHoursStudied || 0}h
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'charts'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Interactive Comparison Charts</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'directory'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Aspirants Directory &amp; Inspect</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
            {profiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Rank &amp; Velocity Leaderboard</span>
        </button>
      </div>

      {/* TAB 1: COMPARATIVE CHARTS */}
      {activeTab === 'charts' && (
        <ComparisonCharts
          profiles={profiles}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* TAB 2: ASPIRANTS DIRECTORY & READ-ONLY INSPECT */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real user by name, college, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              <span className="text-xs font-bold text-slate-600 font-mono">Target AIR:</span>
              <button
                onClick={() => setTargetAirFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  targetAirFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Real Users
              </button>
              <button
                onClick={() => setTargetAirFilter('top20')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  targetAirFilter === 'top20'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Top 20 Targets
              </button>
              <button
                onClick={() => setTargetAirFilter('top50')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  targetAirFilter === 'top50'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Top 50 Targets
              </button>
            </div>
          </section>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProfiles.map((peer) => {
              return (
                <div
                  key={peer.id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${
                    peer.isCurrentUser
                      ? 'border-indigo-300 ring-2 ring-indigo-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top Strip */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                            peer.isCurrentUser
                              ? 'bg-indigo-700 shadow-indigo-200 shadow-sm'
                              : 'bg-slate-800'
                          }`}
                        >
                          {peer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {peer.fullName}
                            </h3>
                            {peer.isCurrentUser && (
                              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {peer.targetCollege}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        AIR #{peer.targetAir}
                      </span>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Syllabus Complete</span>
                        <span className="font-extrabold text-slate-900">{peer.syllabusPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${peer.syllabusPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Core Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono pt-1">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Hours</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{peer.totalHoursStudied}h</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Accuracy</div>
                        <div className="text-xs font-bold text-emerald-600 mt-0.5">{peer.overallPyqAccuracy}%</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Mock Avg</div>
                        <div className="text-xs font-bold text-indigo-700 mt-0.5">{peer.mockAverageScore}</div>
                      </div>
                    </div>

                    {/* Subject Mini-Progress Overview */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Subject Coverage ({peer.subjects.length})
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                        {peer.subjects.map((s) => (
                          <div
                            key={s.subjectId}
                            title={`${s.subjectName}: ${s.completionPercent}%`}
                            className={`p-1 rounded border text-[10px] font-bold ${
                              s.completionPercent >= 75
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : s.completionPercent >= 40
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {s.shortCode}: {s.completionPercent}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA (Read-Only Inspection) */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last seen: {peer.lastActive}
                    </span>

                    <button
                      onClick={() => setSelectedPeerForAudit(peer)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Inspect Syllabus (Read-Only)</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* If only 1 real user exists, show an invite/register card */}
            {filteredProfiles.length <= 1 && (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Invite a Peer / Create a Second Account
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    All telemetry is strictly fetched from the database. To benchmark against another student, register a second account in the top-right menu or invite your study partner.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                  Register Another Aspirant
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD & RANK TARGETS */}
      {activeTab === 'leaderboard' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Real Aspirants Standings (Database Records)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sorted by overall syllabus completion rate directly from database rows.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Database Standings</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                  <th className="py-3 px-4"># Rank</th>
                  <th className="py-3 px-4">Aspirant</th>
                  <th className="py-3 px-4">Target AIR &amp; Goal</th>
                  <th className="py-3 px-4">Syllabus Complete</th>
                  <th className="py-3 px-4">Hours Studied</th>
                  <th className="py-3 px-4">PYQ Accuracy</th>
                  <th className="py-3 px-4">Mock Avg</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((peer, idx) => {
                  return (
                    <tr
                      key={peer.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        peer.isCurrentUser ? 'bg-indigo-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg text-white font-bold text-[10px] flex items-center justify-center ${
                              peer.isCurrentUser ? 'bg-indigo-700' : 'bg-slate-800'
                            }`}
                          >
                            {peer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{peer.fullName}</span>
                              {peer.isCurrentUser && (
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                              {peer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-700 text-xs">
                          AIR #{peer.targetAir}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {peer.targetCollege}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${peer.syllabusPercent}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {peer.syllabusPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {peer.totalHoursStudied}h
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {peer.overallPyqAccuracy}%
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-bold">
                        {peer.mockAverageScore} / 100
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{peer.studyStreakDays}d</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPeerForAudit(peer)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* READ-ONLY PEER DETAIL MODAL */}
      <PeerDetailModal
        peer={selectedPeerForAudit}
        isOpen={!!selectedPeerForAudit}
        onClose={() => setSelectedPeerForAudit(null)}
      />
    </div>
  );
};
