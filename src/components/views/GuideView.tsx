import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Calculator,
  Compass,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Download,
  Upload,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
  GraduationCap,
  Clock,
  Target,
  RefreshCw,
  Sigma,
  Brain,
  Database,
  Code,
  Zap,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

type GuideTab = 'blueprint' | 'subjects' | 'timeline' | 'msq_nat' | 'books';

interface GuideViewProps {
  onOpenTour?: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onOpenTour }) => {
  const {
    subjects,
    syllabusPercent,
    completedTopics,
    totalTopics,
    daysRemaining,
    settings,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<GuideTab>('blueprint');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || subjects[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-indigo-50/70 via-purple-50/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                Comprehensive Academic Guide
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500 font-medium">GATE DA 2028 Playbook</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              GATE DA Master Preparation Guide & Strategy
            </h1>

            <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
              Complete exam pattern architecture, marking scheme rules, subject ROI priority matrix, MSQ/NAT survival tactics, and companion applet sync hub.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-center">
              <div className="text-[11px] font-medium text-slate-500">Syllabus Progress</div>
              <div className="text-xl font-bold text-indigo-700 font-mono">
                {syllabusPercent}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {completedTopics}/{totalTopics} Topics
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-lg bg-amber-50/60 border border-amber-100 text-center">
              <div className="text-[11px] font-medium text-slate-500">Days Remaining</div>
              <div className="text-xl font-bold text-amber-700 font-mono">
                {daysRemaining}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Target AIR #{settings.targetAir}</div>
            </div>

            {onOpenTour && (
              <button
                onClick={onOpenTour}
                className="px-3.5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Feature Tour</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'blueprint'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Exam Blueprint & Marking
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Subject Strategy & Weightage
          </button>

          <button
            onClick={() => setActiveTab('msq_nat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'msq_nat'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            MSQ & NAT Survival Rules
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Phase Timeline & Roadmap
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'books'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Standard Textbooks
          </button>
        </div>
      </div>

      {/* TAB 1: EXAM BLUEPRINT & MARKING */}
      {activeTab === 'blueprint' && (
        <div className="space-y-6">
          {/* Key Exam Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Marks</span>
                <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 font-bold font-mono text-xs">CBT</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">100</div>
              <div className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">85 Marks:</span> Core DA Subject <br />
                <span className="font-semibold text-slate-800">15 Marks:</span> General Aptitude
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Duration</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">180 <span className="text-base font-normal text-slate-500">mins</span></div>
              <div className="mt-2 text-xs text-slate-600">
                65 Total Questions (~2.7 mins per question). Recommended 3-pass strategy.
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target AIR 100 Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-700 font-mono">72–85+</div>
              <div className="mt-2 text-xs text-slate-600">
                IISc AI & IIT Bombay M.Tech benchmark: 65+ marks (GATE Score ~800+).
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualifying Cutoff</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">~28–32</div>
              <div className="mt-2 text-xs text-slate-600">
                General category qualifying marks range. Top percentiles begin at 55+ marks.
              </div>
            </div>
          </div>

          {/* Question Type Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Question Types & Precise Negative Marking Protocol
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold font-mono">MCQ</span>
                  <span className="text-xs text-rose-600 font-bold font-mono">Negative Marking Active</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multiple Choice Questions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exactly 1 out of 4 options is correct.
                </p>
                <div className="pt-2 border-t border-slate-200 text-xs font-mono space-y-1">
                  <div className="text-emerald-700 font-semibold">1-Mark Question: +1 for correct, -1/3 for wrong</div>
                  <div className="text-rose-700 font-semibold">2-Mark Question: +2 for correct, -2/3 for wrong</div>
                  <div className="text-slate-500">Unattempted: 0 marks</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">MSQ</span>
                  <span className="text-xs text-emerald-600 font-bold font-mono">NO Negative Marking</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multiple Select Questions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  One or more options (1, 2, 3, or all 4) can be correct.
                </p>
                <div className="pt-2 border-t border-indigo-200 text-xs space-y-1">
                  <div className="text-amber-800 font-semibold">NO PARTIAL MARKING: Must select ALL correct options exactly!</div>
                  <div className="text-emerald-700 font-semibold font-mono">Correct: Full (+1 or +2) marks</div>
                  <div className="text-slate-500 font-mono">Incorrect / Partial: 0 marks (No penalty)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">NAT</span>
                  <span className="text-xs text-emerald-600 font-bold font-mono">NO Negative Marking</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Numerical Answer Type</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real number entered using virtual on-screen keypad.
                </p>
                <div className="pt-2 border-t border-emerald-200 text-xs space-y-1">
                  <div className="text-emerald-700 font-semibold font-mono">Correct within acceptable range: +1 or +2</div>
                  <div className="text-slate-500 font-mono">Incorrect: 0 marks (No penalty)</div>
                  <div className="text-slate-600">Pay strict attention to decimal rounding instructions (e.g. round off to 2 decimal places).</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Distribution Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Your Syllabus Overview
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Topics</th>
                    <th className="py-2.5 px-3">Subtopics</th>
                    <th className="py-2.5 px-3">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-3 text-center text-slate-500">
                        No subjects yet. Add your syllabus from the Subjects page.
                      </td>
                    </tr>
                  ) : subjects.map((subject) => {
                    const topicCount = subject.topics.length;
                    const subtopicCount = subject.topics.reduce((total, topic) => total + topic.subtopics.length, 0);
                    const completedCount = subject.topics.filter((topic) => topic.status === 'completed').length;
                    const completion = topicCount === 0 ? 0 : Math.round((completedCount / topicCount) * 100);

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{subject.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{topicCount}</td>
                        <td className="py-2.5 px-3 text-slate-600">{subtopicCount}</td>
                        <td className="py-2.5 px-3 text-slate-600">{completedCount}/{topicCount} ({completion}%)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT-BY-SUBJECT STRATEGY */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Selector Sidebar */}
          <div className="space-y-2 lg:col-span-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Your Subjects
            </h2>

            <div className="space-y-1.5">
              {subjects.map((subject) => {
                const isSelected = subject.id === selectedSubject?.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubjectId(subject.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {subject.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                  </button>
                );
              })}
              {subjects.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
                  Your subjects will appear here after you add them from the Subjects page.
                </p>
              )}
            </div>
          </div>

          {/* Details for the selected subject */}
          <div className="lg:col-span-2 space-y-5">
            {selectedSubject ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                      {selectedSubject.shortCode}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedSubject.name}
                  </h3>
                </div>

                {selectedSubject.weightageMarks && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Expected Weightage</div>
                    <div className="text-xl font-bold text-indigo-700 font-mono">
                      {selectedSubject.weightageMarks}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {selectedSubject.description || 'Add a description to keep notes about this subject.'}
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Topics and Subtopics
                </h4>
                {selectedSubject.topics.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubject.topics.map((topic) => (
                      <div key={topic.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-800">{topic.title}</span>
                          <span className="text-[10px] text-slate-500">{topic.status}</span>
                        </div>
                        {topic.subtopics.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                            {topic.subtopics.map((subtopic, index) => (
                              <li key={`${topic.id}-${index}`}>{subtopic}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No topics have been added to this subject yet.</p>
                )}
              </div>

              {selectedSubject.recommendedBooks.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-slate-900">Recommended Books</h4>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {selectedSubject.recommendedBooks.map((book, index) => (
                      <li key={`${selectedSubject.id}-book-${index}`}>{book}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Add a subject to view its topics and subtopics here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MSQ & NAT SURVIVAL RULES */}
      {activeTab === 'msq_nat' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              The MSQ & NAT Master Playbook (Avoiding Fatal Zeroes)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              GATE DA has a substantially higher proportion of MSQs (Multiple Select Questions) and NATs (Numerical Answer Type) compared to traditional GATE papers. Since MSQs have no partial marking, solving them requires rigorous mathematical verification rather than standard elimination.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* MSQ Rules Card */}
              <div className="p-5 rounded-xl bg-[#faf8ff] border border-indigo-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                    MSQ
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">MSQ Defense System</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700">1.</span>
                    <span><strong>Counter-Example Search:</strong> Instead of proving an option true, actively spend 30 seconds attempting to construct an adversarial counter-example (e.g., zero matrix, empty set, orthogonal vectors, singular values).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700">2.</span>
                    <span><strong>Check Necessary vs Sufficient:</strong> "If A, then B" does NOT mean "If B, then A". Distinguish strictly between one-directional implications and bidirectional equivalence (iff).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700">3.</span>
                    <span><strong>All Four Options Must Be Tested:</strong> Treat each option of an MSQ as an independent True/False statement. Never stop after finding one correct choice!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700">4.</span>
                    <span><strong>Zero Negative Penalty Advantage:</strong> Since MSQs carry NO negative marks, always select your best verified hypothesis. Leaving an MSQ unattempted wastes a free opportunity.</span>
                  </li>
                </ul>
              </div>

              {/* NAT Rules Card */}
              <div className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    NAT
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">NAT Precision Protocol</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700">1.</span>
                    <span><strong>Virtual Calculator Handling:</strong> Practice solely with the official GATE virtual calculator interface. Avoid hardware scientific calculators which allow continuous multiline expressions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700">2.</span>
                    <span><strong>Avoid Intermediate Rounding:</strong> Keep full precision (store values in calculator memory) until the final calculation step. Rounding at step 2 can shift your answer outside the examiner tolerance band!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700">3.</span>
                    <span><strong>Strict Decimal Formatting:</strong> If the question states "round off to 2 decimal places", input 3.14 (not 3.1 or 3.142). If answer is an exact integer like 4, entering 4 or 4.0 is usually accepted.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700">4.</span>
                    <span><strong>Units and Signs:</strong> Check whether probability is requested as a fraction (0.25) or percentage (25%). Check negative signs for gradients or coordinate descents.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3-Pass Exam Time Management Blueprint */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                The 3-Pass 180-Minute Exam Hall Strategy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-indigo-700 font-mono">Pass 1: Min 0 – 55</div>
                  <div className="font-semibold text-slate-900 mt-1">High-Confidence Low-Hanging Fruit</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Solve all direct Aptitude questions, single-line linear algebra/calculus, and standard definitions. Skip anything requiring &gt; 2 mins of calculation. Lock in 35–45 solid marks.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-indigo-700 font-mono">Pass 2: Min 55 – 140</div>
                  <div className="font-semibold text-slate-900 mt-1">Algorithmic Drills, NATs & ML Proofs</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Tackle marked medium-difficulty questions: joint probability integrals, SVM margin equations, tree traversals, SQL queries, and A* tracing.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-indigo-700 font-mono">Pass 3: Min 140 – 180</div>
                  <div className="font-semibold text-slate-900 mt-1">Rigorous MSQ Verification & Final Sweep</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Re-verify MSQ options for edge cases. Check NAT decimal rounding. Verify that no attempted question has an accidental missed radio button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHASE TIMELINE & ROADMAP */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Strategic Preparation Timeline for GATE DA 2028
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                A structured, phased campaign designed for sustained mastery and AIR 1-100 retention.
              </p>
            </div>

            <div className="relative border-l-2 border-indigo-200 pl-6 ml-4 space-y-8">
              {/* Phase 1 */}
              <div className="relative space-y-2">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-700 border-4 border-white shadow-xs" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    Phase 1 (Months 1–6)
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-800">Mathematical Foundations</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Linear Algebra + Probability & Calculus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Establish rock-solid intuition. Complete Gilbert Strang lectures and Sheldon Ross exercises. Master vector spaces, eigenvalues, continuous random variables, and gradients.
                </p>
              </div>

              {/* Phase 2 */}
              <div className="relative space-y-2">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-700 border-4 border-white shadow-xs" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    Phase 2 (Months 7–15)
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-800">Computational & Database Core</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Python DSA + DBMS & SQL + Artificial Intelligence</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep practice in Python syntax, tree traversals, graph algorithms (BFS/DFS/Dijkstra), SQL joins, normalization, and A* search.
                </p>
              </div>

              {/* Phase 3 */}
              <div className="relative space-y-2">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-700 border-4 border-white shadow-xs" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    Phase 3 (Months 16–26)
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-800">Applied Machine Learning & Advanced AI</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Mathematical Machine Learning & Optimization</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Derive SVM dual equations, backpropagation gradient calculations, clustering loss functions, and ensemble weighting. Solve all GATE 2024-2027 DA/CS papers.
                </p>
              </div>

              {/* Phase 4 */}
              <div className="relative space-y-2">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Phase 4 (Final 10 Months)
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-800">Test Series, Full CBT Mocks & Spaced Revision</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Mock CBT Simulation & Error Log Remediation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Take 30+ full-length mock tests under real 180-minute exam conditions. Maintain an active error notebook for silly mistakes and formula lapses.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STANDARD TEXTBOOKS */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Standard Canonical Reference Books for GATE DA
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              GATE DA questions are drafted directly from standard academic textbooks by IIT professors. Studying from these canonical texts guarantees conceptual alignment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Linear Algebra</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">MIT 18.06</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Introduction to Linear Algebra (5th/6th Ed.)</h3>
                <p className="text-xs text-slate-500">Author: Prof. Gilbert Strang (MIT)</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Vector Spaces, Four Subspaces, Eigenvalues & Eigenvectors, SVD, Positive Definiteness.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Probability & Statistics</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">Berkeley / Harvard</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">A First Course in Probability (10th Ed.)</h3>
                <p className="text-xs text-slate-500">Author: Sheldon Ross</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Conditional Probability, Bayes Theorem, Joint Random Variables, Expectation, Normal & Poisson Distributions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Machine Learning</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">Standard Canon</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Pattern Recognition and Machine Learning (PRML)</h3>
                <p className="text-xs text-slate-500">Author: Christopher M. Bishop</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Linear Regression, Linear Classification, Kernel Methods & Support Vector Machines, Neural Networks, K-Means & GMM.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Artificial Intelligence</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">AIMA Canon</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Artificial Intelligence: A Modern Approach (4th Ed.)</h3>
                <p className="text-xs text-slate-500">Authors: Stuart Russell & Peter Norvig</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Problem Solving by Search, Informed Search & Heuristics (A*), Adversarial Search (Minimax, Alpha-Beta), Propositional & First-Order Logic.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">DBMS & Warehousing</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">Standard Academic</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Database System Concepts (7th Ed.)</h3>
                <p className="text-xs text-slate-500">Authors: Silberschatz, Korth, Sudarshan</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Relational Model, Relational Algebra, Intermediate SQL, Normalization (1NF to BCNF), Indexing (B+ Trees).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Algorithms</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">CLRS</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Introduction to Algorithms (4th Ed.)</h3>
                <p className="text-xs text-slate-500">Authors: Cormen, Leiserson, Rivest, Stein</p>
                <p className="text-xs text-slate-600">
                  Focus Chapters: Asymptotic Notation, Divide-and-Conquer, Heapsort, Quicksort, Binary Search Trees, BFS/DFS, Dijkstra, Bellman-Ford.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
