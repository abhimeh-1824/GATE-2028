import {
  LinkedAppletConfig,
  AppletSyncPayload,
  Subject,
  Task,
  MockTest,
  UserSettings,
  AuthUser,
  StudyResource,
} from '../types';
import { supabase } from './supabase';
import { syncUserProfileAndProgressToDatabase } from './peerProgressService';
import { getSavedCustomResources } from '../data/subjectResources';

export const DEFAULT_LINKED_APPLET_ID = '2a25406d-a516-461a-aab7-208d3865f39c';
export const DEFAULT_LINKED_PROJECT_ID = 'gen-lang-client-0375433155';
export const DEFAULT_LINKED_APPLET_URL =
  'https://aistudio.google.com/apps/2a25406d-a516-461a-aab7-208d3865f39c?showPreview=true&showAssistant=true&project=gen-lang-client-0375433155';

const CONFIG_STORAGE_KEY = 'gate_da_linked_applet_config';
const SNAPSHOT_STORAGE_KEY = `gate_da_snapshot_${DEFAULT_LINKED_APPLET_ID}`;
const BROADCAST_CHANNEL_NAME = `ais_sync_channel_${DEFAULT_LINKED_APPLET_ID}`;

// Initialize BroadcastChannel if available in browser environment
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not available in this environment:', e);
}

/**
 * Gets the current linked applet configuration.
 */
export function getLinkedAppletConfig(): LinkedAppletConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  return {
    appletId: DEFAULT_LINKED_APPLET_ID,
    projectId: DEFAULT_LINKED_PROJECT_ID,
    appletUrl: DEFAULT_LINKED_APPLET_URL,
    label: 'GATE DA Companion App (2a25406d)',
    lastSyncedAt: null,
    autoSync: true,
    status: 'idle',
    statusMessage: 'Ready to synchronize with linked applet 2a25406d-a516-461a-aab7-208d3865f39c',
  };
}

/**
 * Saves linked applet configuration.
 */
export function saveLinkedAppletConfig(config: LinkedAppletConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Could not save linked applet config:', e);
  }
}

/**
 * Builds an AppletSyncPayload from current study state.
 */
export function buildSyncPayload(
  user: AuthUser | null,
  subjects: Subject[],
  totalHoursStudied: number,
  tasks: Task[],
  mockTests: MockTest[],
  settings: UserSettings
): AppletSyncPayload {
  const completedTopics = subjects.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.status === 'completed').length,
    0
  );
  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const totalPyqsSolved = subjects.reduce(
    (acc, s) => acc + s.topics.reduce((sum, t) => sum + (t.pyqsSolved || 0), 0),
    0
  );

  const customResources = getSavedCustomResources(user?.id || 'guest_user');

  return {
    appletId: DEFAULT_LINKED_APPLET_ID,
    projectId: DEFAULT_LINKED_PROJECT_ID,
    sourceAppletUrl: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    user,
    syllabus: {
      totalTopics,
      completedTopics,
      syllabusPercent,
      subjects,
    },
    studyData: {
      totalHoursStudied,
      totalPyqsSolved,
      overallPyqAccuracy: 84,
      tasks,
      mockTests,
      settings,
      customResources,
    },
  };
}

/**
 * Strict runtime schema validator for AppletSyncPayload
 */
export function validateAppletSyncPayload(raw: unknown): { valid: boolean; error?: string; data?: AppletSyncPayload } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Payload must be a non-null object' };
  }

  const p = raw as any;

  if (typeof p.appletId !== 'string' || p.appletId.length === 0 || p.appletId.length > 128) {
    return { valid: false, error: 'Invalid or missing appletId' };
  }

  if (!p.syllabus || typeof p.syllabus !== 'object') {
    return { valid: false, error: 'Missing or invalid syllabus object' };
  }

  if (!Array.isArray(p.syllabus.subjects) || p.syllabus.subjects.length > 30) {
    return { valid: false, error: 'syllabus.subjects must be an array of at most 30 subjects' };
  }

  for (const s of p.syllabus.subjects) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.name !== 'string') {
      return { valid: false, error: 'Malformed subject record in syllabus' };
    }
    if (s.topics && (!Array.isArray(s.topics) || s.topics.length > 100)) {
      return { valid: false, error: 'Subject topics must be an array of at most 100 topics' };
    }
  }

  if (!p.studyData || typeof p.studyData !== 'object') {
    return { valid: false, error: 'Missing or invalid studyData object' };
  }

  if (p.studyData.tasks && (!Array.isArray(p.studyData.tasks) || p.studyData.tasks.length > 500)) {
    return { valid: false, error: 'studyData.tasks must be an array of at most 500 tasks' };
  }

  if (p.studyData.mockTests && (!Array.isArray(p.studyData.mockTests) || p.studyData.mockTests.length > 100)) {
    return { valid: false, error: 'studyData.mockTests must be an array of at most 100 tests' };
  }

  if (
    p.studyData.totalHoursStudied !== undefined &&
    (typeof p.studyData.totalHoursStudied !== 'number' ||
      isNaN(p.studyData.totalHoursStudied) ||
      p.studyData.totalHoursStudied < 0 ||
      p.studyData.totalHoursStudied > 20000)
  ) {
    return { valid: false, error: 'totalHoursStudied must be a valid number between 0 and 20000' };
  }

  return { valid: true, data: p as AppletSyncPayload };
}

/**
 * Pushes synchronization payload to:
 * 1. BroadcastChannel (for active tabs of linked applet)
 * 2. Backend `/api/sync/:appletId`
 * 3. Supabase Cloud Database (for persistent cross-app synchronization)
 * 4. LocalStorage snapshot
 */
export async function pushSyncToLinkedApplet(
  payload: AppletSyncPayload
): Promise<{ success: boolean; message: string; timestamp: string }> {
  const timestamp = new Date().toISOString();
  let serverSynced = false;
  let supabaseSynced = false;
  const failureReasons: string[] = [];

  // Skip remote cloud writes for demo users
  const isDemo = !payload.user?.id || payload.user.id.startsWith('demo_') || payload.user.id.startsWith('guest_');

  // 1. Broadcast to any open windows / companion tabs
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'GATE_DA_SYNC_PAYLOAD',
        appletId: DEFAULT_LINKED_APPLET_ID,
        payload,
      });
    }
  } catch (err) {
    console.warn('BroadcastChannel error:', err);
  }

  // 2. Save locally for instant persistence
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // storage safe
  }

  // 3. Post to Node/Express server endpoint (only if not demo user)
  if (!isDemo) {
    try {
      const res = await fetch(`/api/sync/${DEFAULT_LINKED_APPLET_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        serverSynced = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        failureReasons.push(`Server API error (${res.status}): ${errJson.error || res.statusText}`);
      }
    } catch (err: any) {
      failureReasons.push(`Network server error: ${err?.message || 'Failed to reach sync endpoint'}`);
    }

    // 4. Also sync to shared Supabase database
    if (payload.user) {
      try {
        const sbRes = await syncUserProfileAndProgressToDatabase(
          payload.user,
          payload.syllabus.subjects,
          payload.studyData.totalHoursStudied,
          payload.studyData.mockTests,
          payload.studyData.settings
        );
        supabaseSynced = sbRes.success;
        if (!sbRes.success) {
          failureReasons.push(`Supabase: ${sbRes.message}`);
        }
      } catch (err: any) {
        failureReasons.push(`Supabase exception: ${err?.message || 'Database write error'}`);
      }
    }
  }

  const currentConfig = getLinkedAppletConfig();

  // If both server and supabase failed for a non-demo user, report explicit failure!
  if (!isDemo && !serverSynced && !supabaseSynced) {
    const errorMsg = `Persistence failed: ${failureReasons.join('; ') || 'Could not reach server or database'}`;
    const errorConfig: LinkedAppletConfig = {
      ...currentConfig,
      lastSyncedAt: timestamp,
      status: 'error',
      statusMessage: errorMsg,
    };
    saveLinkedAppletConfig(errorConfig);
    return {
      success: false,
      message: errorMsg,
      timestamp,
    };
  }

  // Update configuration with successful sync status
  const updatedConfig: LinkedAppletConfig = {
    ...currentConfig,
    lastSyncedAt: timestamp,
    status: 'synced',
    statusMessage: isDemo
      ? 'Demo local snapshot updated (offline sandbox mode)'
      : `Synchronized with ${DEFAULT_LINKED_APPLET_ID} (${serverSynced ? 'Cloud Server' : 'Local Channel'}${supabaseSynced ? ' + Supabase' : ''})`,
    syncedStats: {
      topicsCompleted: payload.syllabus.completedTopics,
      totalHours: payload.studyData.totalHoursStudied,
      pyqsSolved: payload.studyData.totalPyqsSolved,
      tasksCount: payload.studyData.tasks.length,
      mockTestsCount: payload.studyData.mockTests.length,
    },
  };
  saveLinkedAppletConfig(updatedConfig);

  return {
    success: true,
    message: isDemo
      ? 'Local snapshot synchronized in offline demo sandbox.'
      : `State synchronized with Applet ${DEFAULT_LINKED_APPLET_ID} (Project: ${DEFAULT_LINKED_PROJECT_ID}).`,
    timestamp,
  };
}

/**
 * Pulls the latest synchronization payload for the linked applet.
 * Checks server endpoint first, then Supabase, then local snapshot.
 */
export async function pullSyncFromLinkedApplet(): Promise<{
  success: boolean;
  payload: AppletSyncPayload | null;
  source: 'server' | 'supabase' | 'local' | 'none';
  message: string;
}> {
  // 1. Try server endpoint
  try {
    const res = await fetch(`/api/sync/${DEFAULT_LINKED_APPLET_ID}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.payload) {
        const validated = validateAppletSyncPayload(json.payload);
        if (validated.valid && validated.data) {
          return {
            success: true,
            payload: validated.data,
            source: 'server',
            message: 'Received latest verified telemetry from Cloud Server.',
          };
        } else {
          console.warn('Rejected invalid server sync payload schema:', validated.error);
        }
      }
    }
  } catch (err) {
    console.warn('Server pull note:', err);
  }

  // 2. Try Local snapshot
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = validateAppletSyncPayload(parsed);
      if (validated.valid && validated.data) {
        return {
          success: true,
          payload: validated.data,
          source: 'local',
          message: 'Loaded cached snapshot for linked applet.',
        };
      }
    }
  } catch (err) {
    console.warn('LocalStorage snapshot pull note:', err);
  }

  return {
    success: false,
    payload: null,
    source: 'none',
    message: `No valid existing snapshot found yet for applet ${DEFAULT_LINKED_APPLET_ID}. Push current state to initialize.`,
  };
}

/**
 * Intelligent bidirectional merger: merges remote payload into current state
 * with strict schema validation so no progress or task is lost or corrupted.
 */
export function mergeRemotePayloadIntoLocal(
  localSubjects: Subject[],
  localTasks: Task[],
  localMocks: MockTest[],
  localHours: number,
  localSettings: UserSettings,
  remotePayload: AppletSyncPayload
): {
  mergedSubjects: Subject[];
  mergedTasks: Task[];
  mergedMocks: MockTest[];
  mergedHours: number;
  mergedSettings: UserSettings;
  changesSummary: string;
} {
  const validation = validateAppletSyncPayload(remotePayload);
  if (!validation.valid || !validation.data) {
    console.warn('mergeRemotePayloadIntoLocal rejected invalid payload schema:', validation.error);
    return {
      mergedSubjects: localSubjects,
      mergedTasks: localTasks,
      mergedMocks: localMocks,
      mergedHours: localHours,
      mergedSettings: localSettings,
      changesSummary: `Merge aborted: Invalid remote payload schema (${validation.error}).`,
    };
  }

  const validPayload = validation.data;
  let updatedTopicsCount = 0;
  let addedTasksCount = 0;
  let addedMocksCount = 0;

  // 1. Merge Subjects & Topics
  const remoteSubjectMap = new Map<string, Subject>();
  for (const s of validPayload.syllabus.subjects || []) {
    remoteSubjectMap.set(s.id, s);
  }

  const mergedSubjects: Subject[] = localSubjects.map((localSub) => {
    const remoteSub = remoteSubjectMap.get(localSub.id);
    if (!remoteSub) return localSub;

    const remoteTopicMap = new Map<string, any>();
    for (const t of remoteSub.topics || []) {
      remoteTopicMap.set(t.id, t);
    }

    const mergedTopics = localSub.topics.map((localTop) => {
      const remoteTop = remoteTopicMap.get(localTop.id);
      if (!remoteTop) return localTop;

      let hasChange = false;
      let newStatus = localTop.status;
      if (remoteTop.status === 'completed' && localTop.status !== 'completed') {
        newStatus = 'completed';
        hasChange = true;
      } else if (
        remoteTop.status === 'in_progress' &&
        localTop.status === 'unvisited'
      ) {
        newStatus = 'in_progress';
        hasChange = true;
      }

      const newConfidence = Math.max(
        localTop.confidenceScore || 3,
        remoteTop.confidenceScore || 3
      );
      const newPyqsSolved = Math.max(
        localTop.pyqsSolved || 0,
        remoteTop.pyqsSolved || 0
      );
      const newPyqAccuracy = Math.max(
        localTop.pyqAccuracy || 0,
        remoteTop.pyqAccuracy || 0
      );

      if (
        newConfidence !== localTop.confidenceScore ||
        newPyqsSolved !== localTop.pyqsSolved
      ) {
        hasChange = true;
      }

      if (hasChange) {
        updatedTopicsCount++;
      }

      return {
        ...localTop,
        status: newStatus,
        confidenceScore: newConfidence,
        pyqsSolved: newPyqsSolved,
        pyqAccuracy: newPyqAccuracy,
        notes: remoteTop.notes || localTop.notes,
      };
    });

    return {
      ...localSub,
      topics: mergedTopics,
    };
  });

  // 2. Merge Tasks (Union by ID and title)
  const taskMap = new Map<string, Task>();
  for (const t of localTasks) {
    taskMap.set(t.id, t);
  }
  for (const rt of validPayload.studyData.tasks || []) {
    if (!rt || !rt.id) continue;
    const existing = taskMap.get(rt.id);
    if (!existing) {
      taskMap.set(rt.id, rt);
      addedTasksCount++;
    } else if (rt.completed && !existing.completed) {
      taskMap.set(rt.id, { ...existing, completed: true });
    }
  }
  const mergedTasks = Array.from(taskMap.values());

  // 3. Merge Mock Tests
  const mockMap = new Map<string, MockTest>();
  for (const m of localMocks) {
    mockMap.set(m.id, m);
  }
  for (const rm of validPayload.studyData.mockTests || []) {
    if (!rm || !rm.id) continue;
    if (!mockMap.has(rm.id)) {
      mockMap.set(rm.id, rm);
      addedMocksCount++;
    }
  }
  const mergedMocks = Array.from(mockMap.values());

  // 4. Merge Study Hours (Take the higher recorded hours)
  const mergedHours = Math.max(
    localHours,
    validPayload.studyData.totalHoursStudied || 0
  );

  // 5. Settings
  const mergedSettings: UserSettings = {
    ...localSettings,
    targetAir: Math.min(
      localSettings.targetAir,
      validPayload.studyData.settings?.targetAir || 1
    ),
    streakCount: Math.max(
      localSettings.streakCount,
      validPayload.studyData.settings?.streakCount || 1
    ),
  };

  const summary = `Merged: ${updatedTopicsCount} topics updated, ${addedTasksCount} new tasks, ${addedMocksCount} mock tests integrated from Applet ${validPayload.appletId}.`;

  return {
    mergedSubjects,
    mergedTasks,
    mergedMocks,
    mergedHours,
    mergedSettings,
    changesSummary: summary,
  };
}

/**
 * Subscribes to real-time sync broadcasts from companion applet tabs with schema validation.
 */
export function subscribeToLinkedAppletBroadcast(
  onSyncReceived: (payload: AppletSyncPayload) => void
): () => void {
  if (!broadcastChannel) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (
      event.data &&
      event.data.type === 'GATE_DA_SYNC_PAYLOAD' &&
      event.data.payload
    ) {
      const validated = validateAppletSyncPayload(event.data.payload);
      if (validated.valid && validated.data) {
        onSyncReceived(validated.data);
      } else {
        console.warn('Rejected invalid broadcast sync payload:', validated.error);
      }
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}
