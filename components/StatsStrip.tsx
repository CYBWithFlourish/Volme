'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

function formatFee(fee: bigint): string {
  const num = Number(fee) / 10_000_000;
  return num.toFixed(2);
}

export default function StatsStrip() {
  const { stats, loading } = useLeaderboard();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Fees</p>
          <p className="font-mono text-base font-semibold">
            {loading ? '…' : `${formatFee(stats.totalFees)} XLM`}
          </p>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Swaps</p>
          <p className="font-mono text-base font-semibold">
            {loading ? '…' : stats.totalSwaps}
          </p>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-xs text-gray-400">Protocol Fee</p>
          <p className="font-mono text-base font-semibold">0.1%</p>
        </div>
      </div>
    </div>
  );
}
