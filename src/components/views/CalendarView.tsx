import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { CalendarEvent } from '../../types';

export const CalendarView: React.FC = () => {
  const { calendarEvents, addCalendarEvent, settings } = useStudy();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [isAddOpen, setIsAddOpen] = useState(false);
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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCalendarEvent({
      date: newDate,
      title: newTitle.trim(),
      type: newType,
      time: newTime,
    });

    setIsAddOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header & Month Navigation */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-xl font-bold text-slate-900 font-mono">
            {monthNames[currentMonth]} {currentYear}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event / Mock</span>
          </button>
        </div>
      </section>

      {/* Add Event Inline Dropdown */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-white rounded-xl border border-indigo-200 p-4 shadow-xs space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-900">
              Schedule New Exam Milestone or Mock Session
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
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
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Event Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              >
                <option value="mock">CBT Mock Test</option>
                <option value="revision">Spaced Revision Sprint</option>
                <option value="milestone">Phase Milestone</option>
                <option value="study_block">Deep Study Block</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Monthly Grid */}
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
                        ? 'w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {dayEvents.length} events
                    </span>
                  )}
                </div>

                {/* Events list */}
                <div className="mt-1 space-y-1 flex-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-1 rounded text-[10px] font-medium leading-tight truncate border ${
                        ev.type === 'mock'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : ev.type === 'revision'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : ev.type === 'milestone'
                          ? 'bg-purple-50 border-purple-200 text-purple-800'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                      }`}
                      title={`${ev.time || ''} - ${ev.title}`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-mono">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
