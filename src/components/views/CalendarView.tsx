import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Edit3,
  List,
  Grid
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { CalendarEvent } from '../../types';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    toggleCalendarEventCompletion,
  } = useStudy();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Form states for creating / editing event
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(now.toISOString().split('T')[0]);
  const [newType, setNewType] = useState<'mock' | 'revision' | 'milestone' | 'study_block'>('study_block');
  const [newTime, setNewTime] = useState('09:00 AM');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const handleStartEdit = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setNewTitle(ev.title);
    setNewDate(ev.date);
    setNewType(ev.type);
    setNewTime(ev.time || '09:00 AM');
    setIsAddOpen(true);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingEventId) {
      updateCalendarEvent(editingEventId, {
        title: newTitle.trim(),
        date: newDate,
        type: newType,
        time: newTime,
      });
      setEditingEventId(null);
    } else {
      addCalendarEvent({
        date: newDate,
        title: newTitle.trim(),
        type: newType,
        time: newTime,
      });
    }

    setIsAddOpen(false);
    setNewTitle('');
    setNewTime('09:00 AM');
  };

  const sortedEvents = [...calendarEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header & Month Navigation */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-xl font-bold text-slate-900 font-mono">
            {monthNames[currentMonth]} {currentYear}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Agenda view switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Month Grid</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda List ({calendarEvents.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingEventId(null);
              setNewTitle('');
              setNewTime('09:00 AM');
              setIsAddOpen(!isAddOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </section>

      {/* Add / Edit Event Inline Form */}
      {isAddOpen && (
        <form
          onSubmit={handleSubmitEvent}
          className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-indigo-900">
              {editingEventId ? 'Edit Scheduled Event' : 'Schedule New Exam Milestone or Mock Session'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingEventId(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CBT Simulation Mock 5"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Time (e.g. 09:30 AM)
              </label>
              <input
                type="text"
                placeholder="e.g. 09:30 AM"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="w-full sm:w-auto">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Event Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full sm:w-64 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              >
                <option value="mock">CBT Full Mock Test (100M)</option>
                <option value="revision">Spaced Revision Sprint</option>
                <option value="milestone">Phase Milestone</option>
                <option value="study_block">Deep Study Session</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingEventId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                {editingEventId ? 'Save Changes' : 'Confirm Add Event'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* View 1: Monthly Grid */}
      {viewMode === 'month' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-600">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-slate-50/40" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const dayEvents = calendarEvents.filter((e) => e.date === dateStr);

              return (
                <div
                  key={dayNum}
                  className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center shadow-xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Events list */}
                  <div className="mt-1 space-y-1 flex-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-1 rounded text-[10px] font-medium leading-tight flex items-center justify-between group border transition-all ${
                          ev.completed
                            ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                            : ev.type === 'mock'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : ev.type === 'revision'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : ev.type === 'milestone'
                            ? 'bg-purple-50 border-purple-200 text-purple-800'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        }`}
                        title={`${ev.time || ''} - ${ev.title}`}
                      >
                        <span className="truncate flex-1">{ev.title}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(ev)}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCalendarEvent(ev.id)}
                            className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-mono">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* View 2: Mobile / Agenda List View */}
      {viewMode === 'agenda' && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Chronological Exam Agenda
              </h2>
              <p className="text-[11px] text-slate-500">
                All scheduled test simulations, phase milestones, and revision sprints
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700">
              {sortedEvents.length} Total Events
            </span>
          </div>

          {sortedEvents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {sortedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="py-3 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleCalendarEventCompletion(ev.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                    >
                      {ev.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${ev.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {ev.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{ev.date}</span>
                        <span>·</span>
                        <span>{ev.time || 'All Day'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          ev.type === 'mock'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.type === 'revision'
                            ? 'bg-amber-100 text-amber-800'
                            : ev.type === 'milestone'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {ev.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(ev)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCalendarEvent(ev.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No calendar events scheduled yet. Click &quot;Schedule Event&quot; above to add your first mock or milestone.
            </div>
          )}
        </section>
      )}
    </div>
  );
};
