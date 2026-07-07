'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { shortenAddress } from '@/lib/stellar';

function formatVolume(volume: bigint): string {
  const num = Number(volume) / 10_000_000;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toFixed(2);
}

export default function LeaderboardPanel() {
  const { leaderboard, loading } = useLeaderboard();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>

      {leaderboard.length === 0 && !loading && (
        <p className="text-sm text-gray-400">
          No swaps recorded yet. Be the first!
        </p>
      )}

      {loading && leaderboard.length === 0 && (
        <p className="text-sm text-gray-400">Loading…</p>
      )}

      {leaderboard.length > 0 && (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <div
              key={entry.trader}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-xs font-medium text-gray-400">
                  #{i + 1}
                </span>
                <span className="font-mono text-sm text-gray-700">
                  {shortenAddress(entry.trader)}
                </span>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium">
                  {formatVolume(entry.volume)}
                </p>
                <p className="text-xs text-gray-400">
                  {entry.swapCount} swap{entry.swapCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
