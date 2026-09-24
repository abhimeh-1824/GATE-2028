import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  Calendar,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const RoadmapView: React.FC = () => {
  const { milestones, totalTopics, completedTopics, syllabusPercent, daysRemaining } = useStudy();

  const [paceHoursPerDay, setPaceHoursPerDay] = useState(4.5);

  // Calculations for pace calculator
  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const avgHoursPerTopic = 5.5; // Average hours to master a GATE DA topic + PYQs
  const remainingHoursNeeded = remainingTopics * avgHoursPerTopic;
  const daysNeededToFinishSyllabus = Math.ceil(remainingHoursNeeded / paceHoursPerDay);

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeededToFinishSyllabus);

  const cushionDays = daysRemaining - daysNeededToFinishSyllabus;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Card */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
          <MapPin className="w-4 h-4" />
          <span>STRATEGIC 24-MONTH MASTER ROADMAP</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-normal">GATE DA 2028 Execution Framework</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Systematic 5-Phase Campaign to AIR 1
        </h1>

        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Structured in accordance with top ranker learning science: First principles theory $\to$ standard textbook problem sets $\to$ official GATE archives $\to$ full-length computer-based stress simulations.
        </p>

        {/* High level milestones bar */}
        <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-100">
          <span>Overall Syllabus: {syllabusPercent}% Mastered</span>
          <span>{daysRemaining} Days Until Examination</span>
        </div>
      </section>

      {/* 5-Phase Timeline Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Campaign Phases & Deliverables
        </h2>

        <div className="space-y-4">
          {milestones.map((phase) => (
            <div
              key={phase.id}
              className={`p-5 rounded-xl border transition-all ${
                phase.status === 'in_progress'
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 shadow-xs'
                  : phase.status === 'completed'
                  ? 'bg-white border-slate-200 opacity-95'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      phase.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : phase.status === 'in_progress'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    0{phase.phaseNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Phase {phase.phaseNumber}: {phase.phaseTitle}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {phase.timeframe}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                      phase.status === 'completed'
                        ? 'text-emerald-700 bg-emerald-50'
                        : phase.status === 'in_progress'
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-slate-500 bg-slate-200/60'
                    }`}
                  >
                    {phase.status === 'completed'
                      ? 'COMPLETED'
                      : phase.status === 'in_progress'
                      ? 'IN PROGRESS (CURRENT)'
                      : 'UPCOMING'}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Target: {phase.topicsTarget} Topics
                  </span>
                </div>
              </div>

              <div className="mt-3.5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {phase.description}
                </p>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Key Deliverables & Benchmarks:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {phase.keyDeliverables.map((deliv, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#faf8ff] border border-indigo-100/70 text-[11px] text-slate-700 flex items-start gap-2"
                      >
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span className="leading-snug">{deliv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Pace Calculator Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Calculator className="w-5 h-5 text-indigo-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Adaptive Syllabus Velocity & Pace Simulator
            </h2>
            <p className="text-[11px] text-slate-500">
              Calculate syllabus completion date and revision cushion based on daily hours dedicated
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Slider input */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Daily Study Hours</span>
              <span className="font-mono text-base font-extrabold text-indigo-700">
                {paceHoursPerDay} hrs / day
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={paceHoursPerDay}
              onChange={(e) => setPaceHoursPerDay(Number(e.target.value))}
              className="w-full accent-indigo-700 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 hr (Casual)</span>
              <span>4.5 hrs (Target Baseline)</span>
              <span>12 hrs (Full Time)</span>
            </div>
          </div>

          {/* Computed results cards */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Days Needed</div>
              <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                {daysNeededToFinishSyllabus}d
              </div>
              <div className="text-[10px] text-slate-400">At {paceHoursPerDay}h/day</div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
              <div className="text-[10px] text-indigo-700 font-medium">Target Finish</div>
              <div className="text-sm font-bold font-mono text-indigo-900 mt-1">
                {completionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="text-[10px] text-indigo-600">Syllabus 100%</div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[10px] text-emerald-700 font-medium">Revision Cushion</div>
              <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                {cushionDays > 0 ? `${cushionDays}d` : '0d'}
              </div>
              <div className="text-[10px] text-emerald-600">Buffer Before Exam</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
