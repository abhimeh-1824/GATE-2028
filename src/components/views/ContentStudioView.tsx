import React, { useEffect, useMemo, useState } from 'react';
import {
  Layers,
  FileCode2,
  ClipboardList,
  Shield,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  Power,
  Play,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Save,
  X,
  Lock,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  NoteEntityType,
  NoteType,
  LevelTest,
  TestQuestion,
  QuestionImportResult,
  CorrectOptionKey,
  TestDifficulty,
  ManagedUserProfile,
  UserRole,
} from '../../types';
import { sanitizeEducationalHtml, buildSandboxedSrcDoc } from '../../utils/htmlSanitizer';
import {
  parseQuestionFileInMemory,
  generateSampleQuestionsCsv,
} from '../../utils/questionImportParser';
import {
  fetchQuestionsForTest,
  saveImportedQuestions,
  deleteTestQuestion,
} from '../../lib/notesTestsService';
import {
  fetchAllManagedProfiles,
  updateManagedUserRole,
} from '../../lib/supabaseService';
import { TestRunnerModal } from '../modals/TestRunnerModal';

type StudioTab = 'hierarchy' | 'notes' | 'tests' | 'roles';

function getSubtopicStableId(
  topicId: string,
  subtopicItems: Array<{ id: string; name: string }> | undefined,
  index: number
): string {
  return subtopicItems?.[index]?.id || `${topicId}::sub_${index}`;
}

export const ContentStudioView: React.FC = () => {
  const {
    subjects,
    currentUser,
    isDemo,
    userRole,
    isAdmin,
    canManageContent,
    studyNotes,
    levelTests,
    notesTestsNotice,
    refreshNotesAndTests,
    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    addSubtopic,
    updateSubtopic,
    deleteSubtopic,
    reorderSubtopics,
    saveStudyNote,
    removeStudyNote,
    addLevelTest,
    editLevelTest,
    removeLevelTest,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<StudioTab>(canManageContent ? 'hierarchy' : 'tests');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync default tab if role loads asynchronously
  useEffect(() => {
    if (!canManageContent && (activeTab === 'hierarchy' || activeTab === 'notes' || activeTab === 'roles')) {
      setActiveTab('tests');
    }
  }, [canManageContent, activeTab]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Shared cascading hierarchy selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null,
    [subjects, selectedSubjectId]
  );

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    selectedSubject?.topics[0]?.id || ''
  );
  const selectedTopic = useMemo(
    () =>
      selectedSubject?.topics.find((t) => t.id === selectedTopicId) ||
      selectedSubject?.topics[0] ||
      null,
    [selectedSubject, selectedTopicId]
  );

  const [selectedSubtopicIdx, setSelectedSubtopicIdx] = useState<number>(0);

  useEffect(() => {
    if (subjects.length && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (selectedSubject) {
      if (!selectedSubject.topics.some((t) => t.id === selectedTopicId)) {
        setSelectedTopicId(selectedSubject.topics[0]?.id || '');
      }
    } else {
      setSelectedTopicId('');
    }
  }, [selectedSubject, selectedTopicId]);

  useEffect(() => {
    if (selectedTopic && selectedSubtopicIdx >= selectedTopic.subtopics.length) {
      setSelectedSubtopicIdx(0);
    }
  }, [selectedTopic, selectedSubtopicIdx]);

  // ============================================================================
  // TAB 1: HIERARCHY MANAGER STATE
  // ============================================================================
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newSubtopicName, setNewSubtopicName] = useState('');

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCode, setEditSubjectCode] = useState('');

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');

  const [editingSubtopicIdx, setEditingSubtopicIdx] = useState<number | null>(null);
  const [editSubtopicName, setEditSubtopicName] = useState('');

  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;
    setBusyAction(true);
    try {
      const id = await addSubject(newSubjectName, newSubjectCode);
      setSelectedSubjectId(id);
      setNewSubjectName('');
      setNewSubjectCode('');
      showFeedback('success', 'Subject created.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not create subject.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveSubjectEdit = async (subjectId: string) => {
    setBusyAction(true);
    try {
      await updateSubject(subjectId, editSubjectName, editSubjectCode);
      setEditingSubjectId(null);
      showFeedback('success', 'Subject updated.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not update subject.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    setBusyAction(true);
    try {
      await deleteSubject(subjectId);
      setConfirmDeleteKey(null);
      showFeedback('success', 'Subject and linked items deleted.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not delete subject.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newTopicTitle.trim()) return;
    setBusyAction(true);
    try {
      await addTopic(selectedSubject.id, newTopicTitle);
      setNewTopicTitle('');
      showFeedback('success', 'Topic added.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not add topic.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveTopicEdit = async (topicId: string) => {
    if (!selectedSubject) return;
    setBusyAction(true);
    try {
      await updateTopic(selectedSubject.id, topicId, editTopicTitle);
      setEditingTopicId(null);
      showFeedback('success', 'Topic updated.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not update topic.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!selectedSubject) return;
    setBusyAction(true);
    try {
      await deleteTopic(selectedSubject.id, topicId);
      setConfirmDeleteKey(null);
      showFeedback('success', 'Topic and linked subtopics/notes/tests deleted.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not delete topic.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedTopic || !newSubtopicName.trim()) return;
    setBusyAction(true);
    try {
      await addSubtopic(selectedSubject.id, selectedTopic.id, newSubtopicName);
      setNewSubtopicName('');
      showFeedback('success', 'Subtopic added.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not add subtopic.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveSubtopicEdit = async (idx: number) => {
    if (!selectedSubject || !selectedTopic) return;
    setBusyAction(true);
    try {
      await updateSubtopic(selectedSubject.id, selectedTopic.id, idx, editSubtopicName);
      setEditingSubtopicIdx(null);
      showFeedback('success', 'Subtopic updated.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not update subtopic.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteSubtopic = async (idx: number) => {
    if (!selectedSubject || !selectedTopic) return;
    setBusyAction(true);
    try {
      await deleteSubtopic(selectedSubject.id, selectedTopic.id, idx);
      setConfirmDeleteKey(null);
      showFeedback('success', 'Subtopic deleted.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not delete subtopic.');
    } finally {
      setBusyAction(false);
    }
  };

  // ============================================================================
  // TAB 2: HTML NOTES MANAGER STATE
  // ============================================================================
  const [noteLevel, setNoteLevel] = useState<NoteEntityType>('subject');
  const [noteSlot, setNoteSlot] = useState<NoteType>('complete');
  const [noteTitle, setNoteTitle] = useState('');
  const [rawHtmlInput, setRawHtmlInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const noteTargetContext = useMemo(() => {
    if (!selectedSubject) return null;
    if (noteLevel === 'subject') {
      return {
        entityType: 'subject' as NoteEntityType,
        entityId: selectedSubject.id,
        subjectId: selectedSubject.id,
        topicId: null,
        subtopicId: null,
        label: selectedSubject.name,
      };
    }
    if (noteLevel === 'topic' && selectedTopic) {
      return {
        entityType: 'topic' as NoteEntityType,
        entityId: selectedTopic.id,
        subjectId: selectedSubject.id,
        topicId: selectedTopic.id,
        subtopicId: null,
        label: `${selectedSubject.shortCode} › ${selectedTopic.title}`,
      };
    }
    if (noteLevel === 'subtopic' && selectedTopic && selectedTopic.subtopics[selectedSubtopicIdx]) {
      const subId = getSubtopicStableId(
        selectedTopic.id,
        selectedTopic.subtopicItems,
        selectedSubtopicIdx
      );
      return {
        entityType: 'subtopic' as NoteEntityType,
        entityId: subId,
        subjectId: selectedSubject.id,
        topicId: selectedTopic.id,
        subtopicId: subId,
        label: `${selectedSubject.shortCode} › ${selectedTopic.title} › ${selectedTopic.subtopics[selectedSubtopicIdx]}`,
      };
    }
    return null;
  }, [noteLevel, selectedSubject, selectedTopic, selectedSubtopicIdx]);

  const existingSlotNote = useMemo(() => {
    if (!noteTargetContext) return null;
    return (
      studyNotes.find(
        (n) =>
          n.entityType === noteTargetContext.entityType &&
          n.entityId === noteTargetContext.entityId &&
          n.noteType === noteSlot
      ) || null
    );
  }, [studyNotes, noteTargetContext, noteSlot]);

  useEffect(() => {
    if (existingSlotNote) {
      setNoteTitle(existingSlotNote.title);
      setRawHtmlInput(existingSlotNote.htmlContent);
      setUploadedFileName(null);
    } else if (noteTargetContext) {
      setNoteTitle(
        `${noteTargetContext.label} — ${noteSlot === 'complete' ? 'Complete' : 'Short'} Notes`
      );
      setRawHtmlInput('');
      setUploadedFileName(null);
    }
  }, [existingSlotNote?.id, noteTargetContext?.entityId, noteSlot]);

  const sanitizedPreview = useMemo(() => {
    if (!rawHtmlInput.trim()) return null;
    return sanitizeEducationalHtml(rawHtmlInput);
  }, [rawHtmlInput]);

  const handleHtmlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      showFeedback('error', 'Please upload a valid .html or .htm file.');
      return;
    }
    try {
      const text = await file.text();
      setRawHtmlInput(text);
      setUploadedFileName(file.name);
      if (!noteTitle.trim()) {
        setNoteTitle(file.name.replace(/\.(html|htm)$/i, ''));
      }
    } catch {
      showFeedback('error', 'Could not read the uploaded HTML file.');
    }
  };

  const handleSaveNote = async () => {
    if (!noteTargetContext || !rawHtmlInput.trim()) {
      showFeedback('error', 'Select a target item and upload or enter HTML content first.');
      return;
    }
    setSavingNote(true);
    const res = await saveStudyNote({
      entityType: noteTargetContext.entityType,
      entityId: noteTargetContext.entityId,
      subjectId: noteTargetContext.subjectId,
      topicId: noteTargetContext.topicId,
      subtopicId: noteTargetContext.subtopicId,
      noteType: noteSlot,
      title: noteTitle.trim() || `${noteTargetContext.label} Notes`,
      rawHtml: rawHtmlInput,
    });
    setSavingNote(false);
    if (res.success) {
      showFeedback(
        'success',
        `${noteSlot === 'complete' ? 'Complete' : 'Short'} HTML notes saved to database.`
      );
      setUploadedFileName(null);
    } else {
      showFeedback('error', res.error || 'Could not save notes.');
    }
  };

  const handleDeleteExistingNote = async () => {
    if (!existingSlotNote) return;
    setSavingNote(true);
    const res = await removeStudyNote(existingSlotNote.id);
    setSavingNote(false);
    if (res.success) {
      setRawHtmlInput('');
      setUploadedFileName(null);
      showFeedback('success', 'Note deleted.');
    } else {
      showFeedback('error', res.error || 'Could not delete note.');
    }
  };

  // ============================================================================
  // TAB 3: TEST & QUESTION MANAGER STATE (OPEN TO ALL AUTHENTICATED USERS)
  // ============================================================================
  const [testLevel, setTestLevel] = useState<NoteEntityType>('subject');
  const [showAllTests, setShowAllTests] = useState(false);

  const [testFormMode, setTestFormMode] = useState<'create' | 'edit'>('create');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testDuration, setTestDuration] = useState(20);
  const [testPassingPct, setTestPassingPct] = useState(40);
  const [testIsActive, setTestIsActive] = useState(true);
  const [savingTest, setSavingTest] = useState(false);

  const [activeManagedTestId, setActiveManagedTestId] = useState<string | null>(null);
  const [managedQuestions, setManagedQuestions] = useState<TestQuestion[]>([]);
  const [loadingManagedQuestions, setLoadingManagedQuestions] = useState(false);

  // CSV/Excel In-Memory Import Preview
  const [importPreview, setImportPreview] = useState<QuestionImportResult | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importingQuestions, setImportingQuestions] = useState(false);

  // Manual Question Adder
  const [showManualQuestionForm, setShowManualQuestionForm] = useState(false);
  const [mqText, setMqText] = useState('');
  const [mqA, setMqA] = useState('');
  const [mqB, setMqB] = useState('');
  const [mqC, setMqC] = useState('');
  const [mqD, setMqD] = useState('');
  const [mqCorrect, setMqCorrect] = useState<CorrectOptionKey>('A');
  const [mqExp, setMqExp] = useState('');
  const [mqDiff, setMqDiff] = useState<TestDifficulty>('medium');
  const [mqImg, setMqImg] = useState('');

  // Preview Test Runner Modal
  const [previewTest, setPreviewTest] = useState<LevelTest | null>(null);

  const testTargetContext = useMemo(() => {
    if (!selectedSubject) return null;
    if (testLevel === 'subject') {
      return {
        entityType: 'subject' as NoteEntityType,
        entityId: selectedSubject.id,
        subjectId: selectedSubject.id,
        topicId: null,
        subtopicId: null,
        label: selectedSubject.name,
      };
    }
    if (testLevel === 'topic' && selectedTopic) {
      return {
        entityType: 'topic' as NoteEntityType,
        entityId: selectedTopic.id,
        subjectId: selectedSubject.id,
        topicId: selectedTopic.id,
        subtopicId: null,
        label: `${selectedSubject.shortCode} › ${selectedTopic.title}`,
      };
    }
    if (testLevel === 'subtopic' && selectedTopic && selectedTopic.subtopics[selectedSubtopicIdx]) {
      const subId = getSubtopicStableId(
        selectedTopic.id,
        selectedTopic.subtopicItems,
        selectedSubtopicIdx
      );
      return {
        entityType: 'subtopic' as NoteEntityType,
        entityId: subId,
        subjectId: selectedSubject.id,
        topicId: selectedTopic.id,
        subtopicId: subId,
        label: `${selectedSubject.shortCode} › ${selectedTopic.title} › ${selectedTopic.subtopics[selectedSubtopicIdx]}`,
      };
    }
    return null;
  }, [testLevel, selectedSubject, selectedTopic, selectedSubtopicIdx]);

  const visibleTests = useMemo(() => {
    if (showAllTests) return levelTests;
    if (!testTargetContext) return [];
    return levelTests.filter(
      (t) =>
        t.entityType === testTargetContext.entityType &&
        t.entityId === testTargetContext.entityId
    );
  }, [levelTests, showAllTests, testTargetContext]);

  const activeManagedTest = useMemo(
    () => levelTests.find((t) => t.id === activeManagedTestId) || null,
    [levelTests, activeManagedTestId]
  );

  const canModifyTest = (test: LevelTest): boolean => {
    if (isAdmin || isDemo) return true;
    return Boolean(currentUser && test.createdBy === currentUser.id);
  };

  useEffect(() => {
    if (!activeManagedTestId) {
      setManagedQuestions([]);
      return;
    }
    let active = true;
    setLoadingManagedQuestions(true);
    fetchQuestionsForTest(activeManagedTestId, isDemo)
      .then((res) => {
        if (active) setManagedQuestions(res.data || []);
      })
      .finally(() => {
        if (active) setLoadingManagedQuestions(false);
      });
    return () => {
      active = false;
    };
  }, [activeManagedTestId, isDemo]);

  const resetTestForm = () => {
    setTestFormMode('create');
    setEditingTestId(null);
    setTestTitle('');
    setTestDesc('');
    setTestDuration(20);
    setTestPassingPct(40);
    setTestIsActive(true);
  };

  const handleSubmitTestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    setSavingTest(true);

    if (testFormMode === 'edit' && editingTestId) {
      const res = await editLevelTest(editingTestId, {
        title: testTitle.trim(),
        description: testDesc.trim(),
        durationMinutes: Number(testDuration) || 20,
        passingPercentage: Number(testPassingPct) || 40,
        isActive: testIsActive,
      });
      setSavingTest(false);
      if (res.success) {
        showFeedback('success', 'Test updated.');
        resetTestForm();
      } else {
        showFeedback('error', res.error || 'Could not update test.');
      }
      return;
    }

    if (!testTargetContext) {
      setSavingTest(false);
      showFeedback('error', 'Select a valid Subject, Topic, or Subtopic target first.');
      return;
    }

    const res = await addLevelTest({
      entityType: testTargetContext.entityType,
      entityId: testTargetContext.entityId,
      subjectId: testTargetContext.subjectId,
      topicId: testTargetContext.topicId,
      subtopicId: testTargetContext.subtopicId,
      title: testTitle.trim(),
      description: testDesc.trim(),
      durationMinutes: Number(testDuration) || 20,
      passingPercentage: Number(testPassingPct) || 40,
      isActive: testIsActive,
    });
    setSavingTest(false);
    if (res.success && res.test) {
      showFeedback('success', 'Test created. Now import or add questions below.');
      setActiveManagedTestId(res.test.id);
      resetTestForm();
    } else {
      showFeedback('error', res.error || 'Could not create test.');
    }
  };

  const handleStartEditTest = (test: LevelTest) => {
    setTestFormMode('edit');
    setEditingTestId(test.id);
    setTestTitle(test.title);
    setTestDesc(test.description || '');
    setTestDuration(test.durationMinutes);
    setTestPassingPct(test.passingPercentage);
    setTestIsActive(test.isActive);
  };

  const handleToggleTestActive = async (test: LevelTest) => {
    const res = await editLevelTest(test.id, { isActive: !test.isActive });
    if (res.success) {
      showFeedback('success', `Test ${!test.isActive ? 'activated' : 'deactivated'}.`);
    } else {
      showFeedback('error', res.error || 'Could not update test status.');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    const res = await removeLevelTest(testId);
    if (res.success) {
      if (activeManagedTestId === testId) setActiveManagedTestId(null);
      setConfirmDeleteKey(null);
      showFeedback('success', 'Test deleted.');
    } else {
      showFeedback('error', res.error || 'Could not delete test.');
    }
  };

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await parseQuestionFileInMemory(file);
    setImportPreview(result);
  };

  const handleDownloadSampleCsv = () => {
    const csv = generateSampleQuestionsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gate_da_questions_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImportQuestions = async () => {
    if (!activeManagedTest || !importPreview) return;
    const validRows = importPreview.rows.filter((r) => r.isValid);
    if (!validRows.length) {
      showFeedback('error', 'There are no valid rows to import.');
      return;
    }
    setImportingQuestions(true);
    const res = await saveImportedQuestions(
      activeManagedTest.id,
      validRows.map((r) => ({
        questionText: r.questionText,
        optionA: r.optionA,
        optionB: r.optionB,
        optionC: r.optionC,
        optionD: r.optionD,
        correctAnswer: r.correctAnswer,
        explanation: r.explanation,
        difficulty: r.difficulty,
        questionImageUrl: r.questionImageUrl,
      })),
      importMode,
      isDemo
    );
    setImportingQuestions(false);
    if (res.error) {
      showFeedback('error', res.error);
    } else {
      setManagedQuestions(res.data);
      setImportPreview(null);
      await refreshNotesAndTests();
      showFeedback('success', `Imported ${validRows.length} questions successfully.`);
    }
  };

  const handleAddManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManagedTest || !mqText.trim() || !mqA.trim() || !mqB.trim() || !mqC.trim() || !mqD.trim()) {
      showFeedback('error', 'Question text and all four options (A–D) are required.');
      return;
    }
    setImportingQuestions(true);
    const res = await saveImportedQuestions(
      activeManagedTest.id,
      [
        {
          questionText: mqText.trim(),
          optionA: mqA.trim(),
          optionB: mqB.trim(),
          optionC: mqC.trim(),
          optionD: mqD.trim(),
          correctAnswer: mqCorrect,
          explanation: mqExp.trim(),
          difficulty: mqDiff,
          questionImageUrl: mqImg.trim() || undefined,
        },
      ],
      'append',
      isDemo
    );
    setImportingQuestions(false);
    if (res.error) {
      showFeedback('error', res.error);
    } else {
      setManagedQuestions(res.data);
      setMqText('');
      setMqA('');
      setMqB('');
      setMqC('');
      setMqD('');
      setMqExp('');
      setMqImg('');
      setShowManualQuestionForm(false);
      await refreshNotesAndTests();
      showFeedback('success', 'Question added to test.');
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    const res = await deleteTestQuestion(questionId, isDemo);
    if (res.data) {
      setManagedQuestions((prev) => prev.filter((q) => q.id !== questionId));
      await refreshNotesAndTests();
      showFeedback('success', 'Question removed.');
    } else {
      showFeedback('error', res.error || 'Could not remove question.');
    }
  };

  // ============================================================================
  // TAB 4: ROLE MANAGEMENT (ADMIN ONLY)
  // ============================================================================
  const [profiles, setProfiles] = useState<ManagedUserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const loadProfiles = async () => {
    if (!isAdmin || isDemo) return;
    setLoadingProfiles(true);
    setProfilesError(null);
    const res = await fetchAllManagedProfiles();
    if (res.error) setProfilesError(res.error);
    setProfiles(res.profiles);
    setLoadingProfiles(false);
  };

  useEffect(() => {
    if (activeTab === 'roles' && isAdmin && !isDemo) {
      loadProfiles();
    }
  }, [activeTab, isAdmin, isDemo]);

  const handleChangeUserRole = async (userId: string, role: UserRole) => {
    const res = await updateManagedUserRole(userId, role);
    if (res.success) {
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role } : p)));
      showFeedback('success', `Updated user role to ${role.replace('_', ' ')}.`);
    } else {
      showFeedback('error', res.error || 'Failed to update user role.');
    }
  };

  const roleBadgeLabel =
    userRole === 'admin'
      ? 'Admin'
      : userRole === 'content_manager'
        ? 'Content Manager'
        : 'Student (Test Contributor)';

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hierarchical Notes &amp; Tests Studio
            </h1>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : userRole === 'content_manager'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Role: {roleBadgeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Subjects → Topics → Subtopics, upload sanitized interactive HTML Complete/Short
            Notes, and create or bulk-import MCQ Tests via CSV/Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshNotesAndTests()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Notice / Feedback Banners */}
      {notesTestsNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Local Sandbox Fallback Active: </span>
            {notesTestsNotice} Run the non-destructive SQL migration file in Supabase SQL Editor to
            enable multi-user cloud persistence.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          disabled={!canManageContent}
          onClick={() => setActiveTab('hierarchy')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'border-indigo-700 text-indigo-700'
              : canManageContent
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-300 cursor-not-allowed'
          }`}
        >
          {canManageContent ? <Layers className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
          1. Hierarchy &amp; Reorder
        </button>

        <button
          type="button"
          disabled={!canManageContent}
          onClick={() => setActiveTab('notes')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-indigo-700 text-indigo-700'
              : canManageContent
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-300 cursor-not-allowed'
          }`}
        >
          {canManageContent ? <FileCode2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
          2. HTML Notes Manager ({studyNotes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          3. Tests &amp; CSV/Excel Import ({levelTests.length})
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-indigo-700 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            4. Role Access (Admin)
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CURRICULUM HIERARCHY & REORDERING                              */}
      {/* ===================================================================== */}
      {activeTab === 'hierarchy' && canManageContent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Subjects */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Subjects ({subjects.length})
              </h2>
            </div>

            <form onSubmit={handleCreateSubject} className="p-3 border-b border-slate-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name (e.g. Linear Algebra)"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="Code"
                  maxLength={8}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={busyAction || !newSubjectName.trim() || !newSubjectCode.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {subjects.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">No subjects added yet.</p>
              ) : (
                subjects.map((subj) => {
                  const isSelected = selectedSubject?.id === subj.id;
                  const isEditing = editingSubjectId === subj.id;
                  const delKey = `subj_${subj.id}`;
                  return (
                    <div
                      key={subj.id}
                      className={`p-3 transition-colors ${
                        isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={editSubjectName}
                              onChange={(e) => setEditSubjectName(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded"
                            />
                            <input
                              type="text"
                              value={editSubjectCode}
                              onChange={(e) => setEditSubjectCode(e.target.value)}
                              className="w-16 px-2 py-1 text-xs font-mono uppercase border border-indigo-300 rounded"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveSubjectEdit(subj.id)}
                              className="px-2.5 py-1 rounded bg-indigo-700 text-white text-[11px] font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubjectId(null)}
                              className="px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubjectId(subj.id)}
                            className="text-left min-w-0 flex-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {subj.shortCode}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {subj.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {subj.topics.length} topics
                            </p>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Edit Subject"
                              onClick={() => {
                                setEditingSubjectId(subj.id);
                                setEditSubjectName(subj.name);
                                setEditSubjectCode(subj.shortCode);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-700 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(subj.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Delete Subject"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Topics */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                Topics {selectedSubject ? `— ${selectedSubject.shortCode}` : ''} (
                {selectedSubject?.topics.length || 0})
              </h2>
            </div>

            <form onSubmit={handleCreateTopic} className="p-3 border-b border-slate-100 flex gap-2">
              <input
                type="text"
                disabled={!selectedSubject}
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder={selectedSubject ? 'New topic title...' : 'Select a subject first'}
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={busyAction || !selectedSubject || !newTopicTitle.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {!selectedSubject || selectedSubject.topics.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">
                  {selectedSubject ? 'No topics in this subject yet.' : 'Select a subject.'}
                </p>
              ) : (
                selectedSubject.topics.map((topic, idx) => {
                  const isSelected = selectedTopic?.id === topic.id;
                  const isEditing = editingTopicId === topic.id;
                  const delKey = `top_${topic.id}`;
                  return (
                    <div
                      key={topic.id}
                      className={`p-3 transition-colors ${
                        isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTopicTitle}
                            onChange={(e) => setEditTopicTitle(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-indigo-300 rounded"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveTopicEdit(topic.id)}
                              className="px-2.5 py-1 rounded bg-indigo-700 text-white text-[11px] font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTopicId(null)}
                              className="px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTopicId(topic.id)}
                            className="text-left min-w-0 flex-1"
                          >
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              <span className="font-mono text-slate-400 mr-1.5">{idx + 1}.</span>
                              {topic.title}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {topic.subtopics.length} subtopics
                            </p>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              title="Move Topic Up"
                              onClick={() => reorderTopics(selectedSubject.id, idx, idx - 1)}
                              className="p-1 text-slate-400 hover:text-indigo-700 disabled:opacity-25 rounded"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedSubject.topics.length - 1}
                              title="Move Topic Down"
                              onClick={() => reorderTopics(selectedSubject.id, idx, idx + 1)}
                              className="p-1 text-slate-400 hover:text-indigo-700 disabled:opacity-25 rounded"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Edit Topic"
                              onClick={() => {
                                setEditingTopicId(topic.id);
                                setEditTopicTitle(topic.title);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-700 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteTopic(topic.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Delete Topic"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Subtopics */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                Subtopics {selectedTopic ? `— ${selectedTopic.title}` : ''} (
                {selectedTopic?.subtopics.length || 0})
              </h2>
            </div>

            <form
              onSubmit={handleCreateSubtopic}
              className="p-3 border-b border-slate-100 flex gap-2"
            >
              <input
                type="text"
                disabled={!selectedTopic}
                value={newSubtopicName}
                onChange={(e) => setNewSubtopicName(e.target.value)}
                placeholder={selectedTopic ? 'New subtopic name...' : 'Select a topic first'}
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={busyAction || !selectedTopic || !newSubtopicName.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {!selectedTopic || selectedTopic.subtopics.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">
                  {selectedTopic ? 'No subtopics in this topic yet.' : 'Select a topic.'}
                </p>
              ) : (
                selectedTopic.subtopics.map((st, idx) => {
                  const isEditing = editingSubtopicIdx === idx;
                  const delKey = `sub_${selectedTopic.id}_${idx}`;
                  return (
                    <div key={`${selectedTopic.id}-${idx}`} className="p-3 hover:bg-slate-50">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editSubtopicName}
                            onChange={(e) => setEditSubtopicName(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-indigo-300 rounded"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveSubtopicEdit(idx)}
                              className="px-2.5 py-1 rounded bg-indigo-700 text-white text-[11px] font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubtopicIdx(null)}
                              className="px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium text-slate-800 truncate flex-1">
                            <span className="font-mono text-slate-400 mr-1.5">{idx + 1}.</span>
                            {st}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              title="Move Subtopic Up"
                              onClick={() =>
                                selectedSubject &&
                                reorderSubtopics(selectedSubject.id, selectedTopic.id, idx, idx - 1)
                              }
                              className="p-1 text-slate-400 hover:text-indigo-700 disabled:opacity-25 rounded"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedTopic.subtopics.length - 1}
                              title="Move Subtopic Down"
                              onClick={() =>
                                selectedSubject &&
                                reorderSubtopics(selectedSubject.id, selectedTopic.id, idx, idx + 1)
                              }
                              className="p-1 text-slate-400 hover:text-indigo-700 disabled:opacity-25 rounded"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Edit Subtopic"
                              onClick={() => {
                                setEditingSubtopicIdx(idx);
                                setEditSubtopicName(st);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-700 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtopic(idx)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Delete Subtopic"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: HTML NOTES MANAGER (UPLOAD, SANITIZE, LIVE PREVIEW, SAVE)      */}
      {/* ===================================================================== */}
      {activeTab === 'notes' && canManageContent && (
        <div className="space-y-5">
          {/* Level & Target Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                {(['subject', 'topic', 'subtopic'] as NoteEntityType[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNoteLevel(lvl)}
                    className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                      noteLevel === lvl
                        ? 'bg-indigo-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl} Notes
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setNoteSlot('complete')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    noteSlot === 'complete'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Complete Notes
                </button>
                <button
                  type="button"
                  onClick={() => setNoteSlot('short')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    noteSlot === 'short'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Short Notes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubject?.id || ''}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortCode} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {(noteLevel === 'topic' || noteLevel === 'subtopic') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Topic
                  </label>
                  <select
                    value={selectedTopic?.id || ''}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {(selectedSubject?.topics || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {noteLevel === 'subtopic' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Subtopic
                  </label>
                  <select
                    value={selectedSubtopicIdx}
                    onChange={(e) => setSelectedSubtopicIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {(selectedTopic?.subtopics || []).map((st, idx) => (
                      <option key={`${st}-${idx}`} value={idx}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Upload + Live Sandboxed Preview */}
          {!noteTargetContext ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
              Add or select a {noteLevel} in the Hierarchy tab first to upload HTML notes.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: HTML Upload & Editor */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {existingSlotNote ? 'Update / Replace' : 'Upload'}{' '}
                      {noteSlot === 'complete' ? 'Complete' : 'Short'} HTML Notes
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{noteTargetContext.label}</p>
                  </div>
                  {existingSlotNote && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PUBLISHED
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Eigenvalues & Spectral Decomposition Complete Notes"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Upload Dropzone */}
                <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/70 transition-colors">
                  <input
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={handleHtmlFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800">
                    {uploadedFileName
                      ? `Loaded in memory: ${uploadedFileName}`
                      : 'Click to upload an .html file (read strictly in memory)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports CSS styling, tables, images, math equations, code blocks, SVG &amp;
                    interactive animations. Inline JavaScript runs in an isolated preview; external
                    scripts are blocked and browser storage is temporary.
                  </p>
                </label>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      HTML Source (Editable before saving)
                    </label>
                    {sanitizedPreview && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {(sanitizedPreview.sizeBytes / 1024).toFixed(1)} KB sanitized
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    value={rawHtmlInput}
                    onChange={(e) => setRawHtmlInput(e.target.value)}
                    placeholder="Upload an .html file above or paste HTML notes here..."
                    className="w-full p-3 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>

                {sanitizedPreview && sanitizedPreview.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Sanitizer Security Notices
                    </p>
                    {sanitizedPreview.warnings.map((w, i) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {existingSlotNote ? (
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={handleDeleteExistingNote}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Note
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    disabled={savingNote || !rawHtmlInput.trim()}
                    onClick={handleSaveNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {savingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {existingSlotNote ? 'Replace Saved Note' : 'Save Note to Database'}
                  </button>
                </div>
              </div>

              {/* Right: Live Sandboxed Preview */}
              <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden min-h-[520px]">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    Live Sandboxed Preview (Before Saving)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    sandbox=&quot;allow-scripts&quot;
                  </span>
                </div>
                <p className="px-4 py-1.5 border-b border-slate-100 text-[10px] text-slate-500">
                  Click controls inside the preview; scroll within it to see results below.
                </p>
                <div className="flex-1 bg-white">
                  {sanitizedPreview ? (
                    <iframe
                      title="Live HTML Note Preview"
                      srcDoc={buildSandboxedSrcDoc(sanitizedPreview.sanitizedHtml, noteTitle)}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      className="w-full h-full min-h-[460px] border-0"
                    />
                  ) : (
                    <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <FileCode2 className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs font-medium text-slate-500">
                        Upload an HTML file to preview rendered tables, equations, and animations
                        before saving.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TESTS & CSV/EXCEL QUESTION IMPORTER                            */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="space-y-5">
          {/* Target Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                {(['subject', 'topic', 'subtopic'] as NoteEntityType[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setTestLevel(lvl);
                      setShowAllTests(false);
                    }}
                    className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                      !showAllTests && testLevel === lvl
                        ? 'bg-indigo-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl} Tests
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllTests}
                  onChange={(e) => setShowAllTests(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-700"
                />
                Show all tests across curriculum ({levelTests.length})
              </label>
            </div>

            {!showAllTests && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject?.id || ''}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortCode} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(testLevel === 'topic' || testLevel === 'subtopic') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Topic
                    </label>
                    <select
                      value={selectedTopic?.id || ''}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {(selectedSubject?.topics || []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {testLevel === 'subtopic' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Subtopic
                    </label>
                    <select
                      value={selectedSubtopicIdx}
                      onChange={(e) => setSelectedSubtopicIdx(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {(selectedTopic?.subtopics || []).map((st, idx) => (
                        <option key={`${st}-${idx}`} value={idx}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 cols: Create / Edit Test Form + List of Tests */}
            <div className="lg:col-span-5 space-y-4">
              <form
                onSubmit={handleSubmitTestForm}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {testFormMode === 'edit' ? 'Edit Test' : 'Create Optional Test'}
                  </h3>
                  {testFormMode === 'edit' && (
                    <button
                      type="button"
                      onClick={resetTestForm}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {testFormMode === 'create' && testTargetContext && (
                  <p className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                    Target: {testTargetContext.label}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g. Linear Algebra Quick Mastery Quiz"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={testDesc}
                    onChange={(e) => setTestDesc(e.target.value)}
                    placeholder="Short instructions or topic coverage"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={testDuration}
                      onChange={(e) => setTestDuration(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Passing (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={testPassingPct}
                      onChange={(e) => setTestPassingPct(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testIsActive}
                    onChange={(e) => setTestIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-700"
                  />
                  Active (visible for students to attempt)
                </label>

                <button
                  type="submit"
                  disabled={savingTest || (!testTargetContext && testFormMode === 'create')}
                  className="w-full py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingTest
                    ? 'Saving...'
                    : testFormMode === 'edit'
                      ? 'Save Test Changes'
                      : 'Create Test'}
                </button>
              </form>

              {/* Tests List */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tests ({visibleTests.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {visibleTests.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400">
                      No tests created at this level yet.
                    </p>
                  ) : (
                    visibleTests.map((t) => {
                      const isSelected = activeManagedTestId === t.id;
                      const editable = canModifyTest(t);
                      const delKey = `test_${t.id}`;
                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 transition-colors ${
                            isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveManagedTestId(t.id)}
                              className="text-left min-w-0 flex-1"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">{t.title}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    t.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-500 mt-1">
                                {t.entityType.toUpperCase()} • {t.questionCount ?? 0} Qs •{' '}
                                {t.durationMinutes}m • Pass {t.passingPercentage}%
                              </p>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title="Run Test Preview"
                                onClick={() => setPreviewTest(t)}
                                className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              {editable && (
                                <>
                                  <button
                                    type="button"
                                    title={t.isActive ? 'Deactivate Test' : 'Activate Test'}
                                    onClick={() => handleToggleTestActive(t)}
                                    className={`p-1.5 rounded ${
                                      t.isActive
                                        ? 'text-indigo-600 hover:bg-indigo-50'
                                        : 'text-slate-400 hover:bg-slate-100'
                                    }`}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Edit Test"
                                    onClick={() => handleStartEditTest(t)}
                                    className="p-1.5 rounded text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {confirmDeleteKey === delKey ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTest(t.id)}
                                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                                    >
                                      Confirm
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Delete Test"
                                      onClick={() => setConfirmDeleteKey(delKey)}
                                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right 7 cols: CSV/Excel Importer & Question Bank for Selected Test */}
            <div className="lg:col-span-7 space-y-4">
              {!activeManagedTest ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Select a test on the left to manage or import questions
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports in-memory CSV &amp; Excel (.xlsx / .xls) bulk upload with row-by-row
                    validation preview.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Questions: {activeManagedTest.title}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {managedQuestions.length} saved questions in database
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Sample CSV
                      </button>
                      {canModifyTest(activeManagedTest) && (
                        <button
                          type="button"
                          onClick={() => setShowManualQuestionForm((v) => !v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Single Q
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CSV / Excel Upload Box */}
                  {canModifyTest(activeManagedTest) && (
                    <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/70 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleSpreadsheetUpload}
                        className="hidden"
                      />
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-800">
                        Upload CSV or Excel (.csv, .xlsx, .xls) to preview &amp; import questions
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Required columns: Question, Option A, Option B, Option C, Option D, Correct
                        Answer (A/B/C/D). Optional: Explanation, Difficulty, Question Image.
                      </p>
                    </label>
                  )}

                  {/* Import Validation & Preview Panel */}
                  {importPreview && (
                    <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30">
                      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-indigo-950">
                            Import Preview: {importPreview.fileName}
                          </p>
                          {importPreview.fileError ? (
                            <p className="text-xs text-rose-700 font-medium mt-0.5">
                              {importPreview.fileError}
                            </p>
                          ) : (
                            <p className="text-[11px] font-mono text-indigo-800 mt-0.5">
                              Total: {importPreview.totalRows} • Valid: {importPreview.validCount} •
                              Invalid: {importPreview.invalidCount}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setImportPreview(null)}
                          className="text-xs text-slate-500 hover:text-slate-900"
                        >
                          Dismiss
                        </button>
                      </div>

                      {!importPreview.fileError && importPreview.rows.length > 0 && (
                        <>
                          <div className="max-h-60 overflow-auto bg-white">
                            <table className="w-full text-[11px]">
                              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">Row</th>
                                  <th className="px-3 py-2 text-left">Question</th>
                                  <th className="px-3 py-2 text-center">Ans</th>
                                  <th className="px-3 py-2 text-left">Validation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {importPreview.rows.map((r) => (
                                  <tr
                                    key={r.rowNumber}
                                    className={r.isValid ? 'bg-white' : 'bg-rose-50/70'}
                                  >
                                    <td className="px-3 py-2 font-mono text-slate-500">
                                      #{r.rowNumber}
                                    </td>
                                    <td className="px-3 py-2 text-slate-800 max-w-xs truncate">
                                      {r.questionText || '(missing)'}
                                    </td>
                                    <td className="px-3 py-2 text-center font-mono font-bold">
                                      {r.correctAnswer}
                                    </td>
                                    <td className="px-3 py-2">
                                      {r.isValid ? (
                                        <span className="text-emerald-700 font-semibold">Valid</span>
                                      ) : (
                                        <span className="text-rose-700 font-medium">
                                          {r.errors.join(' ')}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="px-4 py-3 bg-white border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-xs">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={importMode === 'append'}
                                  onChange={() => setImportMode('append')}
                                />
                                Append to existing
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={importMode === 'replace'}
                                  onChange={() => setImportMode('replace')}
                                />
                                Replace all questions
                              </label>
                            </div>

                            <button
                              type="button"
                              disabled={importingQuestions || importPreview.validCount === 0}
                              onClick={handleConfirmImportQuestions}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {importingQuestions ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Save {importPreview.validCount} Valid Questions
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Manual Single Question Form */}
                  {showManualQuestionForm && canModifyTest(activeManagedTest) && (
                    <form
                      onSubmit={handleAddManualQuestion}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Add Single Question</span>
                        <button
                          type="button"
                          onClick={() => setShowManualQuestionForm(false)}
                          className="text-xs text-slate-500"
                        >
                          Close
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={mqText}
                        onChange={(e) => setMqText(e.target.value)}
                        placeholder="Question text..."
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          required
                          value={mqA}
                          onChange={(e) => setMqA(e.target.value)}
                          placeholder="Option A"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          required
                          value={mqB}
                          onChange={(e) => setMqB(e.target.value)}
                          placeholder="Option B"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          required
                          value={mqC}
                          onChange={(e) => setMqC(e.target.value)}
                          placeholder="Option C"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          required
                          value={mqD}
                          onChange={(e) => setMqD(e.target.value)}
                          placeholder="Option D"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={mqCorrect}
                          onChange={(e) => setMqCorrect(e.target.value as CorrectOptionKey)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="A">Correct: Option A</option>
                          <option value="B">Correct: Option B</option>
                          <option value="C">Correct: Option C</option>
                          <option value="D">Correct: Option D</option>
                        </select>
                        <select
                          value={mqDiff}
                          onChange={(e) => setMqDiff(e.target.value as TestDifficulty)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <input
                          value={mqImg}
                          onChange={(e) => setMqImg(e.target.value)}
                          placeholder="Image URL (optional)"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <input
                        value={mqExp}
                        onChange={(e) => setMqExp(e.target.value)}
                        placeholder="Explanation (optional)"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                      <button
                        type="submit"
                        disabled={importingQuestions}
                        className="px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold"
                      >
                        Save Question
                      </button>
                    </form>
                  )}

                  {/* Existing Questions List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {loadingManagedQuestions ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Loading questions...
                      </div>
                    ) : managedQuestions.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No questions yet. Upload a CSV/Excel file or add a question manually.
                      </div>
                    ) : (
                      managedQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-semibold text-slate-900">
                              <span className="font-mono text-indigo-700 mr-1.5">Q{idx + 1}.</span>
                              {q.questionText}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                              <span className={q.correctAnswer === 'A' ? 'font-bold text-emerald-700' : ''}>
                                A: {q.optionA}
                              </span>
                              <span className={q.correctAnswer === 'B' ? 'font-bold text-emerald-700' : ''}>
                                B: {q.optionB}
                              </span>
                              <span className={q.correctAnswer === 'C' ? 'font-bold text-emerald-700' : ''}>
                                C: {q.optionC}
                              </span>
                              <span className={q.correctAnswer === 'D' ? 'font-bold text-emerald-700' : ''}>
                                D: {q.optionD}
                              </span>
                            </div>
                          </div>
                          {canModifyTest(activeManagedTest) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(q.id)}
                              title="Delete Question"
                              className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ADMIN ROLE DELEGATION                                          */}
      {/* ===================================================================== */}
      {activeTab === 'roles' && isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Role Delegation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign <strong>Content Manager</strong> to delegate Subject, Topic, Subtopic &amp;
                HTML Notes authoring without granting full Admin privileges. All users can create
                Tests.
              </p>
            </div>
            {!isDemo && (
              <button
                type="button"
                onClick={loadProfiles}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reload Users
              </button>
            )}
          </div>

          {isDemo ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Sign in with a live Supabase Admin account to manage registered user roles.
            </div>
          ) : loadingProfiles ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading user profiles...</div>
          ) : profilesError ? (
            <div className="p-6 text-xs text-rose-700 bg-rose-50">{profilesError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">User</th>
                    <th className="text-left px-5 py-2.5 font-semibold">User ID</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Joined</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Assigned Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {p.fullName}
                        {p.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                        {p.id.slice(0, 12)}...
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <select
                          value={p.role}
                          onChange={(e) => handleChangeUserRole(p.id, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="student">Student (Tests Only)</option>
                          <option value="content_manager">Content Manager (Subjects + Notes)</option>
                          <option value="admin">Admin (Full Control)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test Preview Runner Modal */}
      <TestRunnerModal
        isOpen={Boolean(previewTest)}
        onClose={() => setPreviewTest(null)}
        test={previewTest}
        breadcrumbs={previewTest ? ['Notes & Tests Studio', previewTest.title] : []}
      />
    </div>
  );
};
