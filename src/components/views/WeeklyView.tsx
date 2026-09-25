import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Award,
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles,
  Plus
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const WeeklyView: React.FC = () => {
  const { settings, tasks, subjects, setActiveView, toggleTaskCompletion } = useStudy();

  const weeklyGoalHours = settings.weeklyGoalHours || 28;

  // Calculate current week's dates dynamically (Monday to Sunday)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (currentDayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const isToday = dateStr === now.toISOString().split('T')[0];
    const isPast = dayDate < now && !isToday;

    // Filter real user tasks for this day
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completedTasks = dayTasks.filter((t) => t.completed);
    const dayMinutes = completedTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
    const hours = Number((dayMinutes / 60).toFixed(1));

    // Top subject for the day
    const subjectCounts = dayTasks.reduce((acc, t) => {
      acc[t.subjectId] = (acc[t.subjectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSubId = Object.keys(subjectCounts).sort((a, b) => subjectCounts[b] - subjectCounts[a])[0];
    const topSub = subjects.find((s) => s.id === topSubId);

    return {
      day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr,
      hours,
      targetHours: Number((weeklyGoalHours / 7).toFixed(1)),
      tasksDone: completedTasks.length,
      totalTasks: dayTasks.length,
      focusSubject: topSub ? topSub.name : (dayTasks.length > 0 ? 'General Study' : 'Rest / Open Slot'),
      topic: dayTasks[0]?.topicTitle || (dayTasks.length > 0 ? `${dayTasks.length} Scheduled Tasks` : 'No tasks scheduled'),
      status: isToday ? 'current' : isPast ? 'completed' : 'upcoming',
      tasks: dayTasks,
    };
  });

  const currentWeekCompletedHours = Number(weekDays.reduce((acc, d) => acc + d.hours, 0).toFixed(1));
  const weekProgressPct = Math.min(100, Math.round((currentWeekCompletedHours / weeklyGoalHours) * 100));

  // Find real weak areas needing revision from subjects
  const weakTopics = subjects
    .flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })))
    .filter((t) => t.status === 'revision_due' || (t.confidenceScore && t.confidenceScore <= 2))
    .slice(0, 3);

  // Find real mastered topics
  const masteredTopics = subjects
    .flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })))
    .filter((t) => t.status === 'completed' && t.confidenceScore && t.confidenceScore >= 4)
    .slice(0, 3);

  const weekRangeString = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Weekly Progress Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <CalendarDays className="w-4 h-4" />
              <span>CURRENT ACADEMIC WEEK</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">{weekRangeString}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Weekly Study Pacing & Syllabus Sprint
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <div className="text-slate-400">Target Pacing</div>
              <div className="text-lg font-bold text-slate-800">
                {currentWeekCompletedHours} / {weeklyGoalHours} hrs
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400">Weekly Target</div>
              <div className="text-lg font-bold text-indigo-700">{weekProgressPct}%</div>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-700 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(1, weekProgressPct)}%` }}
          />
        </div>
      </section>

      {/* 7-Day Day-by-Day Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            7-Day Curriculum Breakdown
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {(weeklyGoalHours / 7).toFixed(1)} hrs/day target pace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                d.status === 'current'
                  ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-200'
                  : d.status === 'completed'
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-200/70 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span
                    className={`font-bold ${
                      d.status === 'current' ? 'text-indigo-700' : 'text-slate-800'
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.date}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 truncate mb-1" title={d.focusSubject}>
                  {d.focusSubject}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {d.topic}
                </p>

                {/* Real Day Tasks */}
                {d.tasks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                    {d.tasks.slice(0, 2).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTaskCompletion(t.id)}
                        className="w-full text-left flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-indigo-700 truncate cursor-pointer"
                        title={t.title}
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-300 shrink-0" />
                        )}
                        <span className={`truncate ${t.completed ? 'line-through text-slate-400' : ''}`}>
                          {t.title}
                        </span>
                      </button>
                    ))}
                    {d.tasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-mono">
                        +{d.tasks.length - 2} more tasks
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span
                  className={
                    d.hours >= d.targetHours
                      ? 'text-emerald-600 font-bold'
                      : d.status === 'current'
                      ? 'text-indigo-700 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {d.hours > 0 ? `${d.hours}h` : '—'}
                </span>
                <span className="text-slate-400">
                  {d.tasksDone}/{d.totalTasks} Done
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weak Areas Diagnostics & Focus Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Diagnostics Scorecard */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Live Syllabus Diagnostic Review
            </h3>
            <span className="text-xs text-indigo-700 font-semibold font-mono">
              Active Recall State
            </span>
          </div>

          <div className="space-y-3">
            {/* Concepts Mastered */}
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>High-Confidence Topics (Confidence &ge; 4 Stars)</span>
              </div>
              {masteredTopics.length > 0 ? (
                <ul className="list-disc list-inside text-[11px] text-emerald-700 space-y-0.5">
                  {masteredTopics.map((top) => (
                    <li key={top.id} className="truncate">
                      <strong>{top.subjectName}:</strong> {top.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-600">
                  Rate topic confidence stars in the Subjects view to track your mastered domains.
                </p>
              )}
            </div>

            {/* Weak Areas Flagged */}
            <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Topics Flagged for Active Revision</span>
              </div>
              {weakTopics.length > 0 ? (
                <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                  {weakTopics.map((top) => (
                    <li key={top.id} className="truncate">
                      <strong>{top.subjectName}:</strong> {top.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-rose-600">
                  No critical revision deficits currently flagged. Keep up your active recall schedule!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Quick Links & Mock Planning */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Weekly Study Directives
              </h3>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Target AIR #{settings.targetAir}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Consistently maintain <strong>{settings.dailyGoalHours} hours/day</strong> of deep conceptual focus. Focus on proof derivations, solving official GATE DA &amp; CS past questions, and rigorous mock test simulations.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <div className="text-slate-400 text-[10px]">Weekly Goal</div>
                <div className="font-bold text-slate-800 font-mono">{weeklyGoalHours} hrs</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Completed</div>
                <div className="font-bold text-slate-800 font-mono">{currentWeekCompletedHours} hrs</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Remaining</div>
                <div className="font-bold text-indigo-700 font-mono">
                  {Math.max(0, Number((weeklyGoalHours - currentWeekCompletedHours).toFixed(1)))} hrs
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Destination: {settings.targetCollege}</span>
            <button
              onClick={() => setActiveView('Daily')}
              className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Jump to Daily Study Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
