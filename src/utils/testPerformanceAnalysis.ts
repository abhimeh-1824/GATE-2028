import { LevelTest, NoteEntityType, Subject, TestAttempt } from '../types';
import { getDeterministicUuid } from '../lib/supabaseService';

export type PerformanceTrendDirection = 'improving' | 'declining' | 'steady' | 'baseline';

export interface AttemptPoint {
  attemptId: string;
  testId: string;
  testTitle: string;
  entityType: NoteEntityType;
  subjectId: string;
  subjectName: string;
  topicName?: string;
  subtopicName?: string;
  breadcrumb: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passingPercentage: number;
  completedAt: string;
  previousSameEntityPct: number | null;
  deltaFromPrevious: number | null;
}

export interface TestRevisionFlag {
  testId: string;
  test: LevelTest;
  entityType: NoteEntityType;
  subjectId: string;
  subjectName: string;
  topicName?: string;
  subtopicName?: string;
  breadcrumb: string;
  latestPercentage: number;
  previousPercentage: number | null;
  deltaPct: number | null;
  latestScore: number;
  latestTotalQuestions: number;
  passingPercentage: number;
  attemptCount: number;
  lastAttemptedAt: string;
  reason: 'both' | 'declining' | 'low_score';
}

export interface EntityTrendRecord {
  key: string;
  entityType: NoteEntityType;
  subjectId: string;
  name: string;
  parentPath: string;
  attemptCount: number;
  firstPct: number;
  previousPct: number | null;
  latestPct: number;
  bestPct: number;
  averagePct: number;
  deltaPct: number | null;
  overallChangePct: number | null;
  trend: PerformanceTrendDirection;
  needsRevision: boolean;
  lastAttemptedAt: string;
  history: Array<{
    attemptId: string;
    testTitle: string;
    percentage: number;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}

export interface TestPerformanceAnalysis {
  totalAttempts: number;
  uniqueTestsAttempted: number;
  overallAveragePct: number;
  latestAttempt: AttemptPoint | null;
  previousOverallAttempt: AttemptPoint | null;
  overallLatestDelta: number | null;
  needsRevision: TestRevisionFlag[];
  bySubject: EntityTrendRecord[];
  byTopic: EntityTrendRecord[];
  bySubtopic: EntityTrendRecord[];
  timeline: AttemptPoint[];
  improvingCount: number;
  decliningCount: number;
  steadyCount: number;
}

const REVISION_SCORE_THRESHOLD = 60;

interface ResolvedHierarchy {
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  topicName?: string;
  subtopicId: string | null;
  subtopicName?: string;
  breadcrumb: string;
}

function resolveTestHierarchy(test: LevelTest, subjects: Subject[]): ResolvedHierarchy {
  const subject = subjects.find((s) => s.id === test.subjectId);
  const subjectName = subject?.name || 'General Subject';

  let topicName: string | undefined;
  let subtopicName: string | undefined;

  const targetTopicId = test.topicId || (test.entityType === 'topic' ? test.entityId : null);
  const topic = subject?.topics.find((t) => t.id === targetTopicId);
  if (topic) {
    topicName = topic.title;
  }

  const targetSubtopicId =
    test.subtopicId || (test.entityType === 'subtopic' ? test.entityId : null);
  if (topic && targetSubtopicId) {
    const matchedItem = topic.subtopicItems?.find((item) => item.id === targetSubtopicId);
    if (matchedItem) {
      subtopicName = matchedItem.name;
    } else {
      const idx = topic.subtopics.findIndex(
        (_, i) => getDeterministicUuid(`subtop_${topic.id}_${i}`) === targetSubtopicId
      );
      if (idx >= 0) {
        subtopicName = topic.subtopics[idx];
      }
    }
  }

  const parts = [subjectName];
  if (topicName) parts.push(topicName);
  if (subtopicName) parts.push(subtopicName);

  return {
    subjectId: test.subjectId,
    subjectName,
    topicId: targetTopicId,
    topicName,
    subtopicId: targetSubtopicId,
    subtopicName,
    breadcrumb: parts.join(' → '),
  };
}

function buildEntityTrendList(
  grouped: Map<
    string,
    {
      entityType: NoteEntityType;
      subjectId: string;
      name: string;
      parentPath: string;
      items: AttemptPoint[];
    }
  >
): EntityTrendRecord[] {
  const results: EntityTrendRecord[] = [];

  for (const [key, bucket] of grouped.entries()) {
    const sorted = [...bucket.items].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
    if (sorted.length === 0) continue;

    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    const deltaPct = previous ? Math.round(latest.percentage - previous.percentage) : null;
    const overallChangePct =
      sorted.length >= 2 ? Math.round(latest.percentage - first.percentage) : null;

    let trend: PerformanceTrendDirection = 'baseline';
    if (deltaPct !== null) {
      if (deltaPct > 0) trend = 'improving';
      else if (deltaPct < 0) trend = 'declining';
      else trend = 'steady';
    }

    const bestPct = Math.max(...sorted.map((item) => item.percentage));
    const averagePct = Math.round(
      sorted.reduce((sum, item) => sum + item.percentage, 0) / sorted.length
    );
    const minPass = Math.max(REVISION_SCORE_THRESHOLD, latest.passingPercentage || 40);
    const needsRevision = latest.percentage < minPass || (deltaPct !== null && deltaPct < 0);

    results.push({
      key,
      entityType: bucket.entityType,
      subjectId: bucket.subjectId,
      name: bucket.name,
      parentPath: bucket.parentPath,
      attemptCount: sorted.length,
      firstPct: Math.round(first.percentage),
      previousPct: previous ? Math.round(previous.percentage) : null,
      latestPct: Math.round(latest.percentage),
      bestPct: Math.round(bestPct),
      averagePct,
      deltaPct,
      overallChangePct,
      trend,
      needsRevision,
      lastAttemptedAt: latest.completedAt,
      history: sorted.map((item) => ({
        attemptId: item.attemptId,
        testTitle: item.testTitle,
        percentage: Math.round(item.percentage),
        score: item.score,
        totalQuestions: item.totalQuestions,
        completedAt: item.completedAt,
      })),
    });
  }

  // Sort: declining / low-score attention items first, then most recently attempted
  return results.sort((a, b) => {
    if (a.needsRevision !== b.needsRevision) return a.needsRevision ? -1 : 1;
    return new Date(b.lastAttemptedAt).getTime() - new Date(a.lastAttemptedAt).getTime();
  });
}

export function analyzeTestPerformance(
  attempts: TestAttempt[],
  levelTests: LevelTest[],
  subjects: Subject[]
): TestPerformanceAnalysis {
  if (!attempts.length) {
    return {
      totalAttempts: 0,
      uniqueTestsAttempted: 0,
      overallAveragePct: 0,
      latestAttempt: null,
      previousOverallAttempt: null,
      overallLatestDelta: null,
      needsRevision: [],
      bySubject: [],
      byTopic: [],
      bySubtopic: [],
      timeline: [],
      improvingCount: 0,
      decliningCount: 0,
      steadyCount: 0,
    };
  }

  const testMap = new Map<string, LevelTest>();
  for (const t of levelTests) {
    testMap.set(t.id, t);
  }

  // Sort attempts oldest -> newest so progression deltas are exact
  const chronological = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const timeline: AttemptPoint[] = [];
  const lastPctByTest = new Map<string, number>();
  const attemptsByTest = new Map<string, { test: LevelTest; points: AttemptPoint[] }>();

  const subjectBuckets = new Map<
    string,
    { entityType: NoteEntityType; subjectId: string; name: string; parentPath: string; items: AttemptPoint[] }
  >();
  const topicBuckets = new Map<
    string,
    { entityType: NoteEntityType; subjectId: string; name: string; parentPath: string; items: AttemptPoint[] }
  >();
  const subtopicBuckets = new Map<
    string,
    { entityType: NoteEntityType; subjectId: string; name: string; parentPath: string; items: AttemptPoint[] }
  >();

  for (const attempt of chronological) {
    const test = testMap.get(attempt.testId);
    const resolved: ResolvedHierarchy = test
      ? resolveTestHierarchy(test, subjects)
      : {
          subjectId: '',
          subjectName: 'Assessment',
          topicId: null,
          subtopicId: null,
          breadcrumb: 'Assessment',
        };

    const pct = Math.round(Number(attempt.percentage ?? 0));
    const prevTestPct = lastPctByTest.has(attempt.testId)
      ? lastPctByTest.get(attempt.testId)!
      : null;

    const point: AttemptPoint = {
      attemptId: attempt.id,
      testId: attempt.testId,
      testTitle: test?.title || 'Practice Test',
      entityType: test?.entityType || 'subject',
      subjectId: resolved.subjectId,
      subjectName: resolved.subjectName,
      topicName: resolved.topicName,
      subtopicName: resolved.subtopicName,
      breadcrumb: resolved.breadcrumb,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: pct,
      passingPercentage: test?.passingPercentage ?? 40,
      completedAt: attempt.completedAt,
      previousSameEntityPct: prevTestPct,
      deltaFromPrevious: prevTestPct !== null ? pct - prevTestPct : null,
    };

    lastPctByTest.set(attempt.testId, pct);
    timeline.push(point);

    if (test) {
      const existing = attemptsByTest.get(test.id);
      if (existing) {
        existing.points.push(point);
      } else {
        attemptsByTest.set(test.id, { test, points: [point] });
      }
    }

    // Roll up into Subject bucket (every attempt under a subject contributes to Subject trend)
    if (resolved.subjectId) {
      const sBucket = subjectBuckets.get(resolved.subjectId);
      if (sBucket) {
        sBucket.items.push(point);
      } else {
        subjectBuckets.set(resolved.subjectId, {
          entityType: 'subject',
          subjectId: resolved.subjectId,
          name: resolved.subjectName,
          parentPath: 'Subject Level',
          items: [point],
        });
      }
    }

    // Roll up into Topic bucket (topic + subtopic tests)
    if (resolved.topicId) {
      const tBucket = topicBuckets.get(resolved.topicId);
      if (tBucket) {
        tBucket.items.push(point);
      } else {
        topicBuckets.set(resolved.topicId, {
          entityType: 'topic',
          subjectId: resolved.subjectId,
          name: resolved.topicName || 'Topic',
          parentPath: resolved.subjectName,
          items: [point],
        });
      }
    }

    // Subtopic bucket
    if (resolved.subtopicId) {
      const stBucket = subtopicBuckets.get(resolved.subtopicId);
      if (stBucket) {
        stBucket.items.push(point);
      } else {
        subtopicBuckets.set(resolved.subtopicId, {
          entityType: 'subtopic',
          subjectId: resolved.subjectId,
          name: resolved.subtopicName || 'Subtopic',
          parentPath: [resolved.subjectName, resolved.topicName].filter(Boolean).join(' → '),
          items: [point],
        });
      }
    }
  }

  // Build Needs Revision strictly from LATEST attempt per attempted test
  const needsRevision: TestRevisionFlag[] = [];
  for (const [testId, { test, points }] of attemptsByTest.entries()) {
    const latest = points[points.length - 1];
    const previous = points.length >= 2 ? points[points.length - 2] : null;
    const deltaPct = previous ? Math.round(latest.percentage - previous.percentage) : null;
    const threshold = Math.max(REVISION_SCORE_THRESHOLD, test.passingPercentage || 40);

    const isLowLatest = latest.percentage < threshold;
    const isDeclining = deltaPct !== null && deltaPct < 0;

    if (isLowLatest || isDeclining) {
      const reason: 'both' | 'declining' | 'low_score' =
        isLowLatest && isDeclining ? 'both' : isDeclining ? 'declining' : 'low_score';

      needsRevision.push({
        testId,
        test,
        entityType: test.entityType,
        subjectId: latest.subjectId,
        subjectName: latest.subjectName,
        topicName: latest.topicName,
        subtopicName: latest.subtopicName,
        breadcrumb: latest.breadcrumb,
        latestPercentage: Math.round(latest.percentage),
        previousPercentage: previous ? Math.round(previous.percentage) : null,
        deltaPct,
        latestScore: latest.score,
        latestTotalQuestions: latest.totalQuestions,
        passingPercentage: test.passingPercentage,
        attemptCount: points.length,
        lastAttemptedAt: latest.completedAt,
        reason,
      });
    }
  }

  // Prioritize steepest drops and lowest latest scores first
  needsRevision.sort((a, b) => {
    if (a.reason === 'both' && b.reason !== 'both') return -1;
    if (b.reason === 'both' && a.reason !== 'both') return 1;
    return a.latestPercentage - b.latestPercentage;
  });

  const bySubject = buildEntityTrendList(subjectBuckets);
  const byTopic = buildEntityTrendList(topicBuckets);
  const bySubtopic = buildEntityTrendList(subtopicBuckets);

  const allEntityTrends = [...bySubject, ...byTopic, ...bySubtopic];
  const improvingCount = allEntityTrends.filter((e) => e.trend === 'improving').length;
  const decliningCount = allEntityTrends.filter((e) => e.trend === 'declining').length;
  const steadyCount = allEntityTrends.filter(
    (e) => e.trend === 'steady' || e.trend === 'baseline'
  ).length;

  const latestAttempt = timeline[timeline.length - 1] || null;
  const previousOverallAttempt = timeline.length >= 2 ? timeline[timeline.length - 2] : null;
  const overallLatestDelta =
    latestAttempt && previousOverallAttempt
      ? Math.round(latestAttempt.percentage - previousOverallAttempt.percentage)
      : null;

  const overallAveragePct = Math.round(
    timeline.reduce((sum, item) => sum + item.percentage, 0) / timeline.length
  );

  return {
    totalAttempts: timeline.length,
    uniqueTestsAttempted: attemptsByTest.size,
    overallAveragePct,
    latestAttempt,
    previousOverallAttempt,
    overallLatestDelta,
    needsRevision,
    bySubject,
    byTopic,
    bySubtopic,
    timeline,
    improvingCount,
    decliningCount,
    steadyCount,
  };
}
