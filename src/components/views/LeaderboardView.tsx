import React, { useMemo } from 'react';
import {
  Trophy,
  Coins,
  Award,
  Plus,
  Play,
  RefreshCw,
  Crown,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  History,
  FilePlus2,
  Target,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  COINS_TEST_CREATE,
  COINS_FIRST_ATTEMPT,
  COINS_ACCURACY_60,
  COINS_ACCURACY_80,
  COINS_ACCURACY_100,
  COINS_IMPROVEMENT,
  getCoinTier,
} from '../../lib/coinService';
import { CoinCategory } from '../../types';

function formatRelativeDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function getCategoryMeta(category: CoinCategory): { label: string; badgeClass: string } {
  switch (category) {
    case 'test_created':
      return {
        label: 'Test Created',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'test_attempted':
      return {
        label: 'Test Attempt',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'accuracy_bonus':
      return {
        label: 'Accuracy Bonus',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'improvement_bonus':
      return {
        label: 'Personal Best',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      };
  }
}

export const LeaderboardView: React.FC = () => {
  const {
    currentUser,
    coinBalance,
    coinTransactions,
    leaderboard,
    coinsLoading,
    levelTests,
    testAttempts,
    refreshCoinsAndLeaderboard,
    setActiveView,
  } = useStudy();

  const tier = useMemo(() => getCoinTier(coinBalance), [coinBalance]);

  const myEntry = useMemo(
    () => leaderboard.find((e) => e.isCurrentUser || (currentUser && e.userId === currentUser.id)) || null,
    [leaderboard, currentUser]
  );

  const myTestsCreated = useMemo(() => {
    if (!currentUser) return 0;
    return levelTests.filter((t) => t.createdBy === currentUser.id).length;
  }, [levelTests, currentUser]);

  const myUniqueTestsAttempted = useMemo(
    () => new Set(testAttempts.map((a) => a.testId)).size,
    [testAttempts]
  );

  const pendingTestsCount = useMemo(() => {
    const attemptedIds = new Set(testAttempts.map((a) => a.testId));
    return levelTests.filter((t) => t.isActive && !attemptedIds.has(t.id)).length;
  }, [levelTests, testAttempts]);

  const leaderCoins = leaderboard[0]?.coinBalance ?? coinBalance;
  const coinsToTop = Math.max(0, leaderCoins - coinBalance);

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <header className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Coin System &amp; Competitive Leaderboard
            </h1>
            <p className="text-xs text-slate-500">
              Earn coins by creating tests and scoring high on assessments. Climb ranks across the GATE DA cohort.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refreshCoinsAndLeaderboard()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${coinsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setActiveView('Tests')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Attempt Tests {pendingTestsCount > 0 ? `(${pendingTestsCount} new)` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('ContentStudio')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold whitespace-nowrap shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Test (+{COINS_TEST_CREATE} Coins)
          </button>
        </div>
      </header>

      {/* Personal Rank & Coin KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Coin Balance + Tier */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              Your Coin Balance
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tier.badgeClass}`}
            >
              {tier.name}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {coinBalance.toLocaleString()}{' '}
            <span className="text-xs font-sans font-semibold text-amber-700">Coins</span>
          </div>
          {tier.nextTierCoins !== null ? (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${tier.barClass}`}
                  style={{ width: `${tier.progressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                {Math.max(0, tier.nextTierCoins - coinBalance)} coins to {tier.nextTierName}
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Maximum Tier Reached
            </div>
          )}
        </div>

        {/* Live Cohort Rank */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            Current Rank
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            #{myEntry?.rank ?? 1}
            <span className="text-xs font-normal text-slate-400 ml-1">
              / {Math.max(1, leaderboard.length)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {myEntry?.rank === 1
              ? 'Leading the portal leaderboard'
              : `${coinsToTop} coins behind #1`}
          </div>
        </div>

        {/* Tests Created */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FilePlus2 className="w-3.5 h-3.5 text-indigo-600" />
            Tests Created
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {myTestsCreated}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            +{COINS_TEST_CREATE} coins per test created
          </div>
        </div>

        {/* Tests Attempted */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tests Attempted
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {myUniqueTestsAttempted}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Up to +{COINS_FIRST_ATTEMPT + COINS_ACCURACY_100} coins on 100% score
          </div>
        </div>
      </section>

      {/* Main Two-Column Grid: Leaderboard Table + Rules & Coin Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left (8 cols): Live Ranked Leaderboard */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Aspirant Leaderboard ({leaderboard.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Ranked by Total Coins</span>
          </div>

          {coinsLoading && leaderboard.length === 0 ? (
            <div className="p-6 space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No leaderboard rankings yet</p>
              <p className="text-xs text-slate-500">
                Create a test or attempt an assessment to earn your first coins and claim #1!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold w-20">Rank</th>
                    <th className="text-left px-4 py-3 font-bold">Aspirant</th>
                    <th className="text-left px-4 py-3 font-bold whitespace-nowrap">Tier</th>
                    <th className="text-right px-4 py-3 font-bold whitespace-nowrap">
                      Tests Created
                    </th>
                    <th className="text-right px-4 py-3 font-bold whitespace-nowrap">
                      Total Coins
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((entry) => {
                    const entryTier = getCoinTier(entry.coinBalance);
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;
                    const initials = entry.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors ${
                          entry.isCurrentUser
                            ? 'bg-indigo-50/60 hover:bg-indigo-50 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-7 rounded-md font-mono font-bold text-xs border ${
                              isTop1
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : isTop2
                                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                                  : isTop3
                                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                        </td>

                        {/* Member Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 ${
                                entry.isCurrentUser
                                  ? 'bg-indigo-700 text-white'
                                  : isTop1
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {initials || 'DA'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">
                                  {entry.fullName}
                                </span>
                                {entry.isCurrentUser && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    YOU
                                  </span>
                                )}
                                {isTop1 && entry.coinBalance > 0 && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${entryTier.badgeClass}`}
                          >
                            {entryTier.name}
                          </span>
                        </td>

                        {/* Tests Created */}
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-slate-700 whitespace-nowrap">
                          {entry.testsCreated}
                        </td>

                        {/* Total Coins */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 font-mono tabular-nums font-bold text-amber-800">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            {entry.coinBalance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right (4 cols): How Coins Work + Personal Coin Ledger */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Transparent Coin Rules */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                How to Earn Coins
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <div>
                  <div className="font-bold text-slate-900">Create a New Test</div>
                  <div className="text-[11px] text-slate-500">Subject, Topic, or Subtopic level</div>
                </div>
                <span className="font-mono font-bold text-indigo-700 whitespace-nowrap">
                  +{COINS_TEST_CREATE}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div>
                  <div className="font-bold text-slate-900">Attempt a Test (First Time)</div>
                  <div className="text-[11px] text-slate-500">Complete any unattempted test</div>
                </div>
                <span className="font-mono font-bold text-emerald-700 whitespace-nowrap">
                  +{COINS_FIRST_ATTEMPT}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                <div>
                  <div className="font-bold text-slate-900">Accuracy Bonus (1st Attempt)</div>
                  <div className="text-[11px] text-slate-500">
                    ≥60% (+{COINS_ACCURACY_60}) • ≥80% (+{COINS_ACCURACY_80}) • 100% (+{COINS_ACCURACY_100})
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-800 whitespace-nowrap">
                  Up to +{COINS_ACCURACY_100}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-sky-50/60 border border-sky-100">
                <div>
                  <div className="font-bold text-slate-900">Retake Personal Best</div>
                  <div className="text-[11px] text-slate-500">Beat your previous top score</div>
                </div>
                <span className="font-mono font-bold text-sky-700 whitespace-nowrap">
                  +{COINS_IMPROVEMENT}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Coin History Ledger */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Recent Coin Activity
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {coinTransactions.length} entries
              </span>
            </div>

            {coinTransactions.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <TrendingUp className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No coins earned yet</p>
                <p className="text-[11px] text-slate-500">
                  Attempt your first test or create a quiz to start earning coins.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {coinTransactions.slice(0, 20).map((tx) => {
                  const meta = getCategoryMeta(tx.category);
                  return (
                    <li
                      key={tx.id}
                      className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0 space-y-1">
                        <span
                          className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                          {tx.reason}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {formatRelativeDate(tx.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono tabular-nums text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        +{tx.amount}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
