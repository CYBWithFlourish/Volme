'use client';

import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/stellar';

export default function Header() {
  const { publicKey, connected, connecting, connect, disconnect, error } =
    useWallet();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">volme</h1>
          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Testnet
          </span>
        </div>

        <div className="flex items-center gap-3">
          {connected && publicKey ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                <span className="font-mono font-medium text-gray-700">
                  {shortenAddress(publicKey)}
                </span>
              </span>
              <button
                onClick={disconnect}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mx-auto max-w-6xl px-6 pb-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </header>
  );
}
