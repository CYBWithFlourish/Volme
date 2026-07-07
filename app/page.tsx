'use client';

import Header from '@/components/Header';
import SwapCard from '@/components/SwapCard';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import StatsStrip from '@/components/StatsStrip';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <StatsStrip />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SwapCard />
          </div>
          <div className="lg:col-span-2">
            <LeaderboardPanel />
          </div>
        </div>

        <footer className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Built on Stellar Testnet ·{' '}
          <a
            href={`https://stellar.expert/explorer/testnet/contract/CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Volme Tracker Contract
          </a>
        </footer>
      </main>
    </div>
  );
}
