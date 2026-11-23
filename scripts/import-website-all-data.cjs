const fs = require('fs');

require('dotenv').config({ path: '.env' });

const EXPORT_PATH = process.argv[2];
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!EXPORT_PATH) throw new Error('Usage: node scripts/import-website-all-data.cjs <export-json-path>');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');

const exported = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
const authEntry = Object.keys(exported).find((key) => key.endsWith('-auth-token'));
let accessToken = authEntry ? exported[authEntry]?.access_token : null;
const refreshToken = authEntry ? exported[authEntry]?.refresh_token : null;
if (!accessToken) throw new Error('Export file does not contain an authenticated admin session');

let headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

async function refreshAccessToken() {
  if (!refreshToken) return accessToken;

  const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!refreshResponse.ok) return accessToken;
  const refreshed = await refreshResponse.json();
  return refreshed.access_token || accessToken;
}

async function rest(method, table, params = '', body, prefer = '') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method,
    headers: {
      ...headers,
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(`${method} ${table} failed (${response.status}): ${typeof data === 'string' ? data : data?.message || response.statusText}`);
  }
  return data;
}

function mergeById(cloud, local) {
  const result = [];
  const seen = new Set();
  for (const item of cloud || []) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  for (const item of local || []) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

async function main() {
  accessToken = await refreshAccessToken();
  headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const subjectKeys = Object.keys(exported).filter((key) =>
    key.match(/^gateda_2028_user_.+_subjects$/) &&
    !key.includes('_demo_') &&
    !key.endsWith('_guest_subjects')
  );
  if (subjectKeys.length !== 1) {
    throw new Error(`Expected exactly one real admin/student subject key, found ${subjectKeys.length}`);
  }

  const subjectKey = subjectKeys[0];
  const userMatch = subjectKey.match(/^gateda_2028_user_(.+)_subjects$/);
  const userId = userMatch?.[1];
  if (!userId) throw new Error('Could not determine real user ID');

  const subjects = exported[subjectKey] || [];
  const tasks = exported[`gateda_2028_user_${userId}_tasks`] || [];
  const sprints = exported[`gateda_2028_user_${userId}_sprints`] || [];
  const mockTests = exported[`gateda_2028_user_${userId}_mockTests`] || [];
  const milestones = exported[`gateda_2028_user_${userId}_milestones`] || [];
  const calendarEvents = exported[`gateda_2028_user_${userId}_calendarEvents`] || [];
  const settings = exported[`gateda_2028_user_${userId}_settings`] || null;
  const baseLoggedHours = Number(exported[`gateda_2028_user_${userId}_baseHours`] || 0);
  const localNotes = Array.isArray(exported.gate_da_hierarchical_study_notes_v1)
    ? exported.gate_da_hierarchical_study_notes_v1
    : [];

  const summary = {
    userId,
    subjects: subjects.length,
    topics: 0,
    subtopics: 0,
    tasks: tasks.length,
    sprints: sprints.length,
    mockTests: mockTests.length,
    milestones: milestones.length,
    calendarEvents: calendarEvents.length,
    localNotes: localNotes.length,
  };

  const dbSubjects = [];
  const dbTopics = [];
  const dbSubtopics = [];

  for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex++) {
    const subject = subjects[subjectIndex];
    dbSubjects.push({
      id: subject.id,
      owner_id: userId,
      name: subject.name,
      code: subject.shortCode || subject.id,
      sort_order: subjectIndex,
    });

    for (let topicIndex = 0; topicIndex < (subject.topics || []).length; topicIndex++) {
      const topic = subject.topics[topicIndex];
      dbTopics.push({
        id: topic.id,
        owner_id: userId,
        subject_id: subject.id,
        name: topic.title,
        sort_order: topicIndex,
      });

      const subtopics = topic.subtopicItems || (topic.subtopics || []).map((name, index) => ({
        id: `subtop_${topic.id}_${index}`,
        name,
      }));

      for (let subtopicIndex = 0; subtopicIndex < subtopics.length; subtopicIndex++) {
        const subtopic = subtopics[subtopicIndex];
        dbSubtopics.push({
          id: subtopic.id,
          owner_id: userId,
          topic_id: topic.id,
          name: subtopic.name || topic.subtopics?.[subtopicIndex] || `Subtopic ${subtopicIndex + 1}`,
          sort_order: subtopicIndex,
        });
      }
    }
  }

  summary.topics = dbTopics.length;
  summary.subtopics = dbSubtopics.length;

  let existingStudyState = null;
  try {
    const rows = await rest('GET', 'user_study_state', `?select=state_json&user_id=eq.${userId}&limit=1`, undefined);
    existingStudyState = rows?.[0]?.state_json || null;
  } catch (error) {
    throw new Error(`Cannot read user_study_state. Run the database migration first: ${error.message}`);
  }

  await rest('POST', 'subjects', '?on_conflict=id', dbSubjects, 'resolution=merge-duplicates,return=minimal');
  await rest('POST', 'topics', '?on_conflict=id', dbTopics, 'resolution=merge-duplicates,return=minimal');
  await rest('POST', 'subtopics', '?on_conflict=id', dbSubtopics, 'resolution=merge-duplicates,return=minimal');

  const noteRows = localNotes
    .filter((note) => note.subjectId && note.entityId)
    .map((note) => ({
      id: note.id,
      owner_id: userId,
      entity_type: note.entityType,
      entity_id: note.entityId,
      subject_id: note.subjectId,
      topic_id: note.topicId || null,
      subtopic_id: note.subtopicId || null,
      note_type: note.noteType,
      title: note.title,
      html_content: note.htmlContent,
      sanitized_version: note.sanitizedVersion || 1,
      updated_by: userId,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    }))
    .filter((note) => ['subject', 'topic', 'subtopic'].includes(note.entity_type) && ['complete', 'short'].includes(note.note_type));

  if (noteRows.length) {
    await rest('POST', 'study_notes', '?on_conflict=entity_type,entity_id,note_type', noteRows, 'resolution=merge-duplicates,return=minimal');
  }

  const cloudState = existingStudyState || {};
  const state = {
    subjects: mergeById(cloudState.subjects, subjects),
    tasks: mergeById(cloudState.tasks, tasks),
    sprints: mergeById(cloudState.sprints, sprints),
    mockTests: mergeById(cloudState.mockTests, mockTests),
    milestones: mergeById(cloudState.milestones, milestones),
    calendarEvents: mergeById(cloudState.calendarEvents, calendarEvents),
    settings: { ...(cloudState.settings || {}), ...(settings || {}) },
    baseLoggedHours: typeof cloudState.baseLoggedHours === 'number'
      ? Math.max(cloudState.baseLoggedHours, baseLoggedHours)
      : baseLoggedHours,
  };

  await rest('POST', 'user_study_state', '?on_conflict=user_id', {
    user_id: userId,
    state_json: state,
    state_version: 1,
    updated_at: new Date().toISOString(),
  }, 'resolution=merge-duplicates,return=minimal');

  const finalSubjects = await rest('GET', 'subjects', `?select=id&limit=1000`, undefined);
  const finalTopics = await rest('GET', 'topics', `?select=id&limit=1000`, undefined);
  const finalSubtopics = await rest('GET', 'subtopics', `?select=id&limit=1000`, undefined);
  const finalNotes = await rest('GET', 'study_notes', `?select=id&limit=1000`, undefined);

  console.log(JSON.stringify({
    imported: summary,
    noteRowsSubmitted: noteRows.length,
    cloudCounts: {
      subjects: finalSubjects?.length || 0,
      topics: finalTopics?.length || 0,
      subtopics: finalSubtopics?.length || 0,
      studyNotes: finalNotes?.length || 0,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
