'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { buildLeaderboard, getTotalFees, getTotalSwaps } from '@/lib/contract';
import { useWallet } from './useWallet';

const POLL_INTERVAL = 5000;

export interface LeaderboardEntry {
  trader: string;
  volume: bigint;
  swapCount: number;
}

export interface ProtocolStats {
  totalFees: bigint;
  totalSwaps: number;
}

export function useLeaderboard() {
  const { publicKey } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ProtocolStats>({
    totalFees: BigInt(0),
    totalSwaps: 0,
  });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const [entries, totalFees, totalSwaps] = await Promise.all([
        buildLeaderboard(publicKey),
        getTotalFees(publicKey),
        getTotalSwaps(publicKey),
      ]);
      setLeaderboard(entries);
      setStats({ totalFees, totalSwaps });
    } catch {
      // silent fail on poll errors
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const refreshImmediately = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { leaderboard, stats, loading, refreshImmediately };
}
