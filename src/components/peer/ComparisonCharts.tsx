import React, { useState } from 'react';
import {
  UserProgressProfile,
  SubjectProgressSummary,
} from '../../types';
import {
  BarChart3,
  Compass,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles,
  Award,
  Zap,
  Info
} from 'lucide-react';

interface ComparisonChartsProps {
  profiles: UserProgressProfile[];
  currentUserProfile?: UserProgressProfile;
}

const PEER_COLORS = [
  { stroke: '#4f46e5', fill: 'rgba(79, 70, 229, 0.22)', border: '#818cf8', labelBg: 'bg-indigo-600', text: 'text-indigo-600' }, // Indigo (You)
  { stroke: '#059669', fill: 'rgba(5, 150, 105, 0.20)', border: '#34d399', labelBg: 'bg-emerald-600', text: 'text-emerald-600' }, // Emerald
  { stroke: '#d97706', fill: 'rgba(217, 119, 6, 0.20)', border: '#fbbf24', labelBg: 'bg-amber-600', text: 'text-amber-600' }, // Amber
  { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.20)', border: '#c4b5fd', labelBg: 'bg-purple-600', text: 'text-purple-600' }, // Purple
  { stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.20)', border: '#38bdf8', labelBg: 'bg-sky-600', text: 'text-sky-600' }, // Sky
  { stroke: '#e11d48', fill: 'rgba(225, 29, 72, 0.20)', border: '#fb7185', labelBg: 'bg-rose-600', text: 'text-rose-600' }, // Rose
];

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({
  profiles,
  currentUserProfile,
}) => {
  // Default selected: Current user and the top 2 peers
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    const defaultIds: string[] = [];
    if (currentUserProfile) defaultIds.push(currentUserProfile.id);
    profiles.forEach((p) => {
      if (defaultIds.length < 3 && !defaultIds.includes(p.id)) {
        defaultIds.push(p.id);
      }
    });
    return defaultIds.length > 0 ? defaultIds : profiles.slice(0, 3).map((p) => p.id);
  });

  const [activeChartTab, setActiveChartTab] = useState<'radar' | 'metrics' | 'subjects' | 'matrix'>('radar');

  const selectedProfiles = profiles.filter((p) => selectedUserIds.includes(p.id));

  const toggleSelectUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length <= 1) return; // keep at least 1
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    } else {
      if (selectedUserIds.length >= 4) {
        // limit to 4 for visual clarity
        setSelectedUserIds((prev) => [...prev.slice(1), userId]);
      } else {
        setSelectedUserIds((prev) => [...prev, userId]);
      }
    }
  };

  const handleSelectPreset = (preset: 'you_vs_top' | 'top_three' | 'all') => {
    if (preset === 'you_vs_top') {
      const topPeer = profiles.find((p) => !p.isCurrentUser) || profiles[1];
      const me = currentUserProfile || profiles.find((p) => p.isCurrentUser) || profiles[0];
      setSelectedUserIds(topPeer ? [me.id, topPeer.id] : [me.id]);
    } else if (preset === 'top_three') {
      setSelectedUserIds(profiles.slice(0, 3).map((p) => p.id));
    } else if (preset === 'all') {
      setSelectedUserIds(profiles.slice(0, 4).map((p) => p.id));
    }
  };

  // Standard subjects across all peers
  const subjectList = profiles[0]?.subjects || [];

  // Radar geometry
  const radarSize = 440;
  const center = radarSize / 2;
  const radius = 150;
  const numAxes = subjectList.length || 8;

  const getAxisPoint = (axisIndex: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / numAxes) * axisIndex - Math.PI / 2;
    const r = radius * Math.min(1, Math.max(0, valueRatio));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  return (
    <div className="space-y-6">
      {/* Peer Selector Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Select Aspirants to Compare (Max 4)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {selectedProfiles.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-overlay comparison of syllabus coverage, accuracy, logged study hours, and mock performance.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => handleSelectPreset('you_vs_top')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            >
              You vs Top Peer
            </button>
            <button
              onClick={() => handleSelectPreset('top_three')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Top 3 Leaders
            </button>
            <button
              onClick={() => handleSelectPreset('all')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Top 4 Cohort
            </button>
          </div>
        </div>

        {/* Peer Selection Chips */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {profiles.map((p, idx) => {
            const isSelected = selectedUserIds.includes(p.id);
            const colorIdx = selectedUserIds.indexOf(p.id);
            const peerColor = colorIdx >= 0 ? PEER_COLORS[colorIdx % PEER_COLORS.length] : null;

            return (
              <button
                key={p.id}
                onClick={() => toggleSelectUser(p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isSelected && peerColor ? peerColor.stroke : '#cbd5e1',
                  }}
                />
                <span className="font-semibold">
                  {p.fullName} {p.isCurrentUser && '(You)'}
                </span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  AIR #{p.targetAir} · {p.syllabusPercent}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Database real users note if 1 user */}
        {profiles.length <= 1 && (
          <div className="mt-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center gap-2 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Real Database Mode:</strong> Displaying telemetry for the 1 currently registered user. When additional peers sign up or sync in Supabase, their real progress polygons will automatically appear for comparison.
            </span>
          </div>
        )}
      </section>

      {/* Chart Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveChartTab('radar')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeChartTab === 'radar'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>8-Subject Radar Polygon</span>
        </button>

        <button
          onClick={() => setActiveChartTab('metrics')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeChartTab === 'metrics'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Core Metric Side-by-Side</span>
        </button>

        <button
          onClick={() => setActiveChartTab('subjects')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeChartTab === 'subjects'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Subject-by-Subject Delta Bars</span>
        </button>

        <button
          onClick={() => setActiveChartTab('matrix')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeChartTab === 'matrix'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Hours vs Accuracy Matrix</span>
        </button>
      </div>

      {/* CHART 1: 8-Subject Spider/Radar Chart */}
      {activeChartTab === 'radar' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* SVG Radar Chart */}
            <div className="relative flex-1 flex items-center justify-center w-full max-w-[480px]">
              <svg
                width={radarSize}
                height={radarSize}
                viewBox={`0 0 ${radarSize} ${radarSize}`}
                className="overflow-visible"
              >
                {/* Concentric Grid Rings */}
                {[0.25, 0.5, 0.75, 1.0].map((ringRatio, rIdx) => {
                  const r = radius * ringRatio;
                  const ringPoints = subjectList.map((_, i) => {
                    const pt = getAxisPoint(i, ringRatio);
                    return `${pt.x},${pt.y}`;
                  }).join(' ');

                  return (
                    <g key={rIdx}>
                      <polygon
                        points={ringPoints}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray={ringRatio === 1 ? 'none' : '3 3'}
                      />
                      <text
                        x={center + 6}
                        y={center - r + 10}
                        fontSize="9"
                        fill="#94a3b8"
                        className="font-mono"
                      >
                        {Math.round(ringRatio * 100)}%
                      </text>
                    </g>
                  );
                })}

                {/* Spoke Axes & Labels */}
                {subjectList.map((sub, i) => {
                  const outerPt = getAxisPoint(i, 1.0);
                  const labelPt = getAxisPoint(i, 1.22);

                  return (
                    <g key={sub.subjectId}>
                      <line
                        x1={center}
                        y1={center}
                        x2={outerPt.x}
                        y2={outerPt.y}
                        stroke="#e2e8f0"
                        strokeWidth="1.2"
                      />
                      <text
                        x={labelPt.x}
                        y={labelPt.y + 4}
                        fontSize="11"
                        fontWeight="700"
                        fill="#334155"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {sub.shortCode}
                      </text>
                    </g>
                  );
                })}

                {/* User Polygons */}
                {selectedProfiles.map((prof, pIdx) => {
                  const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                  const points = subjectList.map((sub, sIdx) => {
                    const profSub = prof.subjects.find((s) => s.subjectId === sub.subjectId);
                    const pct = (profSub?.completionPercent || 0) / 100;
                    const pt = getAxisPoint(sIdx, pct);
                    return pt;
                  });

                  const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');

                  return (
                    <g key={prof.id}>
                      <polygon
                        points={pointsString}
                        fill={color.fill}
                        stroke={color.stroke}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                      {points.map((pt, ptIdx) => (
                        <circle
                          key={ptIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill={color.stroke}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Radar Legend & Subject Details */}
            <div className="w-full lg:w-[380px] space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block font-mono">
                  Polygon Legend
                </span>
                <div className="mt-2 space-y-2">
                  {selectedProfiles.map((p, pIdx) => {
                    const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded shrink-0"
                            style={{ backgroundColor: color.stroke }}
                          />
                          <span className="font-bold text-slate-800">
                            {p.fullName} {p.isCurrentUser && '(You)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                          <span>AIR #{p.targetAir}</span>
                          <span className="font-bold text-slate-900">{p.syllabusPercent}% Avg</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject Breakdown List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block font-mono">
                  Subject Codes Reference
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 font-mono">
                  {subjectList.map((sub) => (
                    <div key={sub.subjectId} className="p-1.5 bg-white border border-slate-200 rounded truncate">
                      <strong className="text-indigo-700">{sub.shortCode}:</strong> {sub.subjectName}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CHART 2: Core Metric Side-by-Side Grouped Bars */}
      {activeChartTab === 'metrics' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Side-by-Side Key Academic Performance Indicators
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct comparison across Syllabus Coverage, Problem Solving Accuracy, Total Logged Hours, and Mock Tests.
            </p>
          </div>

          <div className="space-y-6">
            {/* Metric 1: Syllabus Coverage (%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-mono">
                <span>1. SYLLABUS COMPLETION RATE (%)</span>
                <span className="text-slate-400">Target: 100%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedProfiles.map((p, pIdx) => {
                  const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{p.fullName}</span>
                        <span className="font-extrabold font-mono text-sm" style={{ color: color.stroke }}>
                          {p.syllabusPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.syllabusPercent}%`,
                            backgroundColor: color.stroke,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metric 2: PYQ Accuracy (%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-mono">
                <span>2. PREVIOUS YEAR QUESTIONS ACCURACY (%)</span>
                <span className="text-slate-400">Target: &gt; 85%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedProfiles.map((p, pIdx) => {
                  const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{p.fullName}</span>
                        <span className="font-extrabold font-mono text-sm" style={{ color: color.stroke }}>
                          {p.overallPyqAccuracy}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.overallPyqAccuracy}%`,
                            backgroundColor: color.stroke,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono text-right">
                        {p.totalPyqsSolved}/{p.totalPyqsOverall} Solved
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metric 3: Logged Study Hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-mono">
                <span>3. LOGGED STUDY HOURS (HRS)</span>
                <span className="text-slate-400">Goal: 600+ Hrs for 2028</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedProfiles.map((p, pIdx) => {
                  const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                  const hoursPct = Math.min(100, Math.round((p.totalHoursStudied / 600) * 100));
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{p.fullName}</span>
                        <span className="font-extrabold font-mono text-sm" style={{ color: color.stroke }}>
                          {p.totalHoursStudied}h
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${hoursPct}%`,
                            backgroundColor: color.stroke,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono text-right">
                        Streak: {p.studyStreakDays} Days
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metric 4: Mock Test Average */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-mono">
                <span>4. MOCK TEST AVERAGE SCORE (/100)</span>
                <span className="text-slate-400">Target: 75+ for AIR &lt; 50</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedProfiles.map((p, pIdx) => {
                  const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{p.fullName}</span>
                        <span className="font-extrabold font-mono text-sm" style={{ color: color.stroke }}>
                          {p.mockAverageScore} / 100
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.mockAverageScore}%`,
                            backgroundColor: color.stroke,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono text-right">
                        {p.mockTestsTaken} Tests Attempted
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CHART 3: Subject-by-Subject Delta Bars */}
      {activeChartTab === 'subjects' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Subject-Wise Head-to-Head Delta Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct comparison of mastery per subject across the 8 GATE DA curriculum modules.
            </p>
          </div>

          <div className="space-y-4">
            {subjectList.map((sub) => {
              return (
                <div key={sub.subjectId} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                        {sub.shortCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {sub.subjectName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Total Topics: {sub.totalTopics}
                    </span>
                  </div>

                  {/* Comparative Bars */}
                  <div className="space-y-2">
                    {selectedProfiles.map((prof, pIdx) => {
                      const color = PEER_COLORS[pIdx % PEER_COLORS.length];
                      const profSub = prof.subjects.find((s) => s.subjectId === sub.subjectId);
                      const pct = profSub?.completionPercent || 0;

                      return (
                        <div key={prof.id} className="flex items-center gap-3">
                          <span className="w-24 text-[11px] font-medium text-slate-700 truncate">
                            {prof.fullName}
                          </span>
                          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color.stroke,
                              }}
                            />
                          </div>
                          <span className="w-16 text-right text-[11px] font-mono font-bold" style={{ color: color.stroke }}>
                            {pct}% ({profSub?.completedTopics}/{profSub?.totalTopics})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CHART 4: Hours vs Accuracy Quadrant Matrix */}
      {activeChartTab === 'matrix' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Prep Intensity vs Problem Accuracy Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quadrant benchmark: Total Study Hours (X) vs PYQ Accuracy (Y).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Elite Zone (&gt;350 hrs &amp; &gt;85% Acc)</span>
            </div>
          </div>

          <div className="relative border border-slate-200 rounded-xl bg-slate-50/60 p-6 h-[380px] flex items-center justify-center overflow-hidden">
            {/* Center Axes */}
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-300 pointer-events-none" />

            {/* Quadrant Labels */}
            <div className="absolute top-4 right-4 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              TOP PERFORMERS (Elite Zone)
            </div>
            <div className="absolute top-4 left-4 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
              PRECISION DRIVEN (Needs Volume)
            </div>
            <div className="absolute bottom-4 right-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
              HIGH GRIT (Needs PYQ Accuracy)
            </div>
            <div className="absolute bottom-4 left-4 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">
              EARLY FOUNDATION
            </div>

            {/* Plot Peer Bubbles */}
            {profiles.map((p, idx) => {
              // X: hours 150 to 500 hrs -> 10% to 90%
              const xPct = Math.min(90, Math.max(10, ((p.totalHoursStudied - 150) / 350) * 80 + 10));
              // Y: accuracy 70% to 95% -> bottom 10% to top 90%
              const yPct = Math.min(90, Math.max(10, ((p.overallPyqAccuracy - 70) / 25) * 80 + 10));

              const isSelected = selectedUserIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  style={{
                    left: `${xPct}%`,
                    bottom: `${yPct}%`,
                  }}
                  className={`absolute transform -translate-x-1/2 translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all ${
                    isSelected ? 'z-20 scale-110' : 'z-10 opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  onClick={() => toggleSelectUser(p.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 ${
                      p.isCurrentUser
                        ? 'bg-indigo-700 border-white ring-4 ring-indigo-200'
                        : 'bg-slate-800 border-white'
                    }`}
                  >
                    {p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="mt-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-2xs text-[10px] font-bold text-slate-800 font-mono whitespace-nowrap">
                    {p.fullName} (AIR #{p.targetAir})
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {p.totalHoursStudied}h · {p.overallPyqAccuracy}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-2">
            <span>&larr; Lower Hours (150h)</span>
            <span>Study Hours Logged &rarr; (500h+)</span>
          </div>
        </section>
      )}
    </div>
  );
};
