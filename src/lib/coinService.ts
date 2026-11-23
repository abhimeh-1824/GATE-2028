import { supabase } from './supabase';
import {
  CoinAwardBreakdown,
  CoinAwardItem,
  CoinCategory,
  CoinTransaction,
  LeaderboardEntry,
  LevelTest,
  TestAttempt,
  UserRole,
} from '../types';

// ============================================================================
// Coin Economy Constants
// ============================================================================
export const COINS_TEST_CREATE = 25;
export const COINS_FIRST_ATTEMPT = 15;
export const COINS_ACCURACY_60 = 10;
export const COINS_ACCURACY_80 = 20;
export const COINS_ACCURACY_100 = 30;
export const COINS_IMPROVEMENT = 5;

export interface CoinTierInfo {
  name: string;
  shortLabel: string;
  minCoins: number;
  nextTierCoins: number | null;
  nextTierName: string | null;
  progressPct: number;
  badgeClass: string;
  barClass: string;
}

const COIN_TIERS = [
  {
    name: 'Bronze Aspirant',
    shortLabel: 'Bronze',
    minCoins: 0,
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    barClass: 'bg-orange-500',
  },
  {
    name: 'Silver Scholar',
    shortLabel: 'Silver',
    minCoins: 100,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    barClass: 'bg-slate-500',
  },
  {
    name: 'Gold Challenger',
    shortLabel: 'Gold',
    minCoins: 300,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    barClass: 'bg-amber-500',
  },
  {
    name: 'Platinum Ranker',
    shortLabel: 'Platinum',
    minCoins: 600,
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    barClass: 'bg-sky-600',
  },
  {
    name: 'AIR 1 Legend',
    shortLabel: 'Legend',
    minCoins: 1000,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    barClass: 'bg-indigo-700',
  },
];

export function getCoinTier(coins: number): CoinTierInfo {
  const safeCoins = Math.max(0, Math.floor(coins));
  let idx = 0;
  for (let i = COIN_TIERS.length - 1; i >= 0; i--) {
    if (safeCoins >= COIN_TIERS[i].minCoins) {
      idx = i;
      break;
    }
  }
  const current = COIN_TIERS[idx];
  const next = COIN_TIERS[idx + 1] || null;
  const progressPct = next
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((safeCoins - current.minCoins) / (next.minCoins - current.minCoins)) * 100)
        )
      )
    : 100;

  return {
    name: current.name,
    shortLabel: current.shortLabel,
    minCoins: current.minCoins,
    nextTierCoins: next ? next.minCoins : null,
    nextTierName: next ? next.name : null,
    progressPct,
    badgeClass: current.badgeClass,
    barClass: current.barClass,
  };
}

/**
 * Pure reward calculator for submitting a test attempt.
 * - First attempt on a test: +15 base + accuracy bonus (+10 for >=60%, +20 for >=80%, +30 for 100%)
 * - Retake on an already-attempted test: +5 improvement bonus ONLY if beating previous best score
 *   (prevents infinite farming while rewarding genuine improvement)
 */
export function calculateAttemptCoinReward(
  percentage: number,
  previousBestPercentage: number | null,
  testTitle: string
): CoinAwardBreakdown {
  const items: CoinAwardItem[] = [];
  const safeTitle = testTitle.trim() || 'Assessment';

  if (previousBestPercentage === null) {
    items.push({
      category: 'test_attempted',
      amount: COINS_FIRST_ATTEMPT,
      reason: `Attempted "${safeTitle}"`,
    });

    if (percentage >= 100) {
      items.push({
        category: 'accuracy_bonus',
        amount: COINS_ACCURACY_100,
        reason: `Perfect 100% score on "${safeTitle}"`,
      });
    } else if (percentage >= 80) {
      items.push({
        category: 'accuracy_bonus',
        amount: COINS_ACCURACY_80,
        reason: `High accuracy (${percentage}%) on "${safeTitle}"`,
      });
    } else if (percentage >= 60) {
      items.push({
        category: 'accuracy_bonus',
        amount: COINS_ACCURACY_60,
        reason: `Solid accuracy (${percentage}%) on "${safeTitle}"`,
      });
    }
  } else if (percentage > previousBestPercentage) {
    items.push({
      category: 'improvement_bonus',
      amount: COINS_IMPROVEMENT,
      reason: `Beat personal best (${previousBestPercentage}% → ${percentage}%) on "${safeTitle}"`,
    });
  }

  const totalCoins = items.reduce((sum, item) => sum + item.amount, 0);
  return { totalCoins, items };
}

// ============================================================================
// Local Storage Fallback (Demo Mode & Pre-Migration Resilience)
// ============================================================================
const LOCAL_COINS_KEY_PREFIX = 'gate_da_coin_ledger_v1_';

interface LocalCoinStore {
  balance: number;
  transactions: CoinTransaction[];
}

function getLocalStorageKey(userId: string): string {
  return `${LOCAL_COINS_KEY_PREFIX}${userId}`;
}

function readLocalCoinStore(userId: string): LocalCoinStore {
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return { balance: 0, transactions: [] };
    const parsed = JSON.parse(raw) as LocalCoinStore;
    const txs = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const balance =
      typeof parsed.balance === 'number'
        ? parsed.balance
        : txs.reduce((s, t) => s + (t.amount || 0), 0);
    return { balance, transactions: txs };
  } catch {
    return { balance: 0, transactions: [] };
  }
}

function writeLocalCoinStore(userId: string, store: LocalCoinStore): void {
  try {
    window.localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(store));
  } catch {
    // Ignore quota errors in restricted sandboxes
  }
}

function isMissingSchemaError(err: any): boolean {
  const code = err?.code || '';
  const msg = String(err?.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    msg.includes('coin_transactions') ||
    msg.includes('coin_balance') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ============================================================================
// Supabase + Fallback API Operations
// ============================================================================

export interface CoinStateResult {
  balance: number;
  transactions: CoinTransaction[];
  usingLocalFallback: boolean;
}

export async function fetchCoinState(
  userId?: string,
  isDemo?: boolean
): Promise<CoinStateResult> {
  if (!userId) {
    return { balance: 0, transactions: [], usingLocalFallback: true };
  }

  if (isDemo || !isUuid(userId)) {
    const local = readLocalCoinStore(userId);
    return {
      balance: local.balance,
      transactions: local.transactions,
      usingLocalFallback: true,
    };
  }

  try {
    const [txRes, profileRes] = await Promise.all([
      supabase
        .from('coin_transactions')
        .select('id, user_id, amount, category, reason, reference_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (txRes.error || profileRes.error) {
      if (isMissingSchemaError(txRes.error) || isMissingSchemaError(profileRes.error)) {
        const local = readLocalCoinStore(userId);
        return {
          balance: local.balance,
          transactions: local.transactions,
          usingLocalFallback: true,
        };
      }
      throw txRes.error || profileRes.error;
    }

    const transactions: CoinTransaction[] = (txRes.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount) || 0,
      category: row.category as CoinCategory,
      reason: row.reason,
      referenceId: row.reference_id ?? null,
      createdAt: row.created_at,
    }));

    const txSum = transactions.reduce((sum, t) => sum + t.amount, 0);
    const profileBalance =
      typeof profileRes.data?.coin_balance === 'number' ? profileRes.data.coin_balance : txSum;
    const balance = Math.max(profileBalance, txSum);

    return {
      balance,
      transactions,
      usingLocalFallback: false,
    };
  } catch (err) {
    console.warn('Coin state fallback activated:', err);
    const local = readLocalCoinStore(userId);
    return {
      balance: local.balance,
      transactions: local.transactions,
      usingLocalFallback: true,
    };
  }
}

export async function awardCoins(params: {
  userId?: string;
  items: CoinAwardItem[];
  referenceId?: string | null;
  isDemo?: boolean;
}): Promise<{
  totalAwarded: number;
  transactions: CoinTransaction[];
  usingLocalFallback: boolean;
}> {
  const { userId, items, referenceId = null, isDemo = false } = params;
  const validItems = items.filter((i) => i.amount > 0);
  if (!userId || validItems.length === 0) {
    return { totalAwarded: 0, transactions: [], usingLocalFallback: true };
  }

  const totalAwarded = validItems.reduce((sum, i) => sum + i.amount, 0);

  const saveLocally = () => {
    const now = new Date().toISOString();
    const created: CoinTransaction[] = validItems.map((item, idx) => ({
      id: `local_coin_${Date.now()}_${idx}`,
      userId,
      amount: item.amount,
      category: item.category,
      reason: item.reason,
      referenceId,
      createdAt: now,
    }));
    const existing = readLocalCoinStore(userId);
    const updated: LocalCoinStore = {
      balance: existing.balance + totalAwarded,
      transactions: [...created, ...existing.transactions].slice(0, 100),
    };
    writeLocalCoinStore(userId, updated);
    return { totalAwarded, transactions: created, usingLocalFallback: true };
  };

  if (isDemo || !isUuid(userId)) {
    return saveLocally();
  }

  try {
    const payload = validItems.map((item) => ({
      user_id: userId,
      amount: item.amount,
      category: item.category,
      reason: item.reason,
      reference_id: referenceId,
    }));

    const { data, error } = await supabase
      .from('coin_transactions')
      .insert(payload)
      .select('id, user_id, amount, category, reason, reference_id, created_at');

    if (error) {
      if (isMissingSchemaError(error)) {
        return saveLocally();
      }
      throw error;
    }

    const created: CoinTransaction[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount) || 0,
      category: row.category as CoinCategory,
      reason: row.reason,
      referenceId: row.reference_id ?? null,
      createdAt: row.created_at,
    }));

    return {
      totalAwarded,
      transactions: created,
      usingLocalFallback: false,
    };
  } catch (err) {
    console.warn('Could not persist coin transaction to Supabase, saving locally:', err);
    return saveLocally();
  }
}

export async function fetchCoinLeaderboard(params: {
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: UserRole;
  currentUserBalance: number;
  levelTests: LevelTest[];
  testAttempts: TestAttempt[];
  isDemo?: boolean;
}): Promise<{ entries: LeaderboardEntry[]; usingLocalFallback: boolean }> {
  const {
    currentUserId,
    currentUserName = 'You',
    currentUserRole = 'student',
    currentUserBalance,
    levelTests,
    testAttempts,
    isDemo = false,
  } = params;

  // Count tests created per user from already-loaded levelTests
  const testsCreatedByUser = new Map<string, number>();
  const creatorNamesByUser = new Map<string, string>();
  levelTests.forEach((t) => {
    if (!t.createdBy) return;
    testsCreatedByUser.set(t.createdBy, (testsCreatedByUser.get(t.createdBy) || 0) + 1);
    if (t.creatorName) {
      creatorNamesByUser.set(t.createdBy, t.creatorName);
    }
  });

  // Unique tests attempted by current user
  const myUniqueAttemptedTests = new Set(testAttempts.map((a) => a.testId)).size;

  const buildFallbackEntries = (): LeaderboardEntry[] => {
    const map = new Map<string, LeaderboardEntry>();

    if (currentUserId) {
      map.set(currentUserId, {
        userId: currentUserId,
        fullName: currentUserName,
        role: currentUserRole,
        coinBalance: currentUserBalance,
        testsCreated: testsCreatedByUser.get(currentUserId) || 0,
        testsAttempted: myUniqueAttemptedTests,
        rank: 1,
        isCurrentUser: true,
      });
    }

    testsCreatedByUser.forEach((createdCount, uid) => {
      if (map.has(uid)) return;
      map.set(uid, {
        userId: uid,
        fullName: creatorNamesByUser.get(uid) || 'Portal Aspirant',
        role: 'student',
        coinBalance: createdCount * COINS_TEST_CREATE,
        testsCreated: createdCount,
        testsAttempted: 0,
        rank: 0,
        isCurrentUser: false,
      });
    });

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.coinBalance !== a.coinBalance) return b.coinBalance - a.coinBalance;
      if (b.testsCreated !== a.testsCreated) return b.testsCreated - a.testsCreated;
      return a.fullName.localeCompare(b.fullName);
    });

    return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  };

  if (isDemo || !currentUserId || !isUuid(currentUserId)) {
    return { entries: buildFallbackEntries(), usingLocalFallback: true };
  }

  try {
    let profileRows: Array<{
      id: string;
      full_name?: string | null;
      role?: string | null;
      coin_balance?: number | null;
    }> | null = null;
    let usingFallbackCoins = false;

    const primaryRes = await supabase
      .from('profiles')
      .select('id, full_name, role, coin_balance')
      .order('coin_balance', { ascending: false })
      .limit(200);

    if (primaryRes.error) {
      if (isMissingSchemaError(primaryRes.error)) {
        // Migration not run yet: still fetch ALL registered users from profiles without coin_balance
        usingFallbackCoins = true;
        const basicRes = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .order('created_at', { ascending: true })
          .limit(200);

        if (!basicRes.error && basicRes.data) {
          profileRows = basicRes.data;
        } else {
          return { entries: buildFallbackEntries(), usingLocalFallback: true };
        }
      } else {
        throw primaryRes.error;
      }
    } else {
      profileRows = primaryRes.data;
    }

    if (!profileRows || profileRows.length === 0) {
      return { entries: buildFallbackEntries(), usingLocalFallback: true };
    }

    const entriesMap = new Map<string, LeaderboardEntry>();

    profileRows.forEach((row) => {
      const uid = row.id;
      const isMe = uid === currentUserId;
      const createdCount = testsCreatedByUser.get(uid) || 0;
      const estimatedCoins = createdCount * COINS_TEST_CREATE;
      const dbCoins =
        typeof row.coin_balance === 'number' ? row.coin_balance : estimatedCoins;

      entriesMap.set(uid, {
        userId: uid,
        fullName: row.full_name || (isMe ? currentUserName : 'GATE Aspirant'),
        role: (row.role as UserRole) || 'student',
        coinBalance: isMe ? Math.max(dbCoins, currentUserBalance) : dbCoins,
        testsCreated: createdCount,
        testsAttempted: isMe ? myUniqueAttemptedTests : 0,
        rank: 0,
        isCurrentUser: isMe,
      });
    });

    // Ensure current user is always visible even if profile row hasn't synced yet
    if (!entriesMap.has(currentUserId)) {
      entriesMap.set(currentUserId, {
        userId: currentUserId,
        fullName: currentUserName,
        role: currentUserRole,
        coinBalance: currentUserBalance,
        testsCreated: testsCreatedByUser.get(currentUserId) || 0,
        testsAttempted: myUniqueAttemptedTests,
        rank: 0,
        isCurrentUser: true,
      });
    }

    const sorted = Array.from(entriesMap.values()).sort((a, b) => {
      if (b.coinBalance !== a.coinBalance) return b.coinBalance - a.coinBalance;
      if (b.testsCreated !== a.testsCreated) return b.testsCreated - a.testsCreated;
      return a.fullName.localeCompare(b.fullName);
    });

    return {
      entries: sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 })),
      usingLocalFallback: usingFallbackCoins,
    };
  } catch (err) {
    console.warn('Leaderboard fetch fallback:', err);
    return { entries: buildFallbackEntries(), usingLocalFallback: true };
  }
}
