'use client';

import type { SwapStatus, SwapResult } from '@/hooks/useSwap';

const STATUS_LABELS: Record<SwapStatus, string> = {
  idle: '',
  quoting: 'Finding best swap path…',
  awaiting_signature: 'Waiting for wallet signature…',
  submitting_swap: 'Submitting DEX swap transaction…',
  recording_on_chain: 'Recording swap on-chain…',
  success: 'Swap completed successfully!',
  failed: 'Swap failed',
};

const STATUS_COLORS: Record<SwapStatus, string> = {
  idle: '',
  quoting: 'text-blue-600',
  awaiting_signature: 'text-amber-600',
  submitting_swap: 'text-blue-600',
  recording_on_chain: 'text-purple-600',
  success: 'text-green-600',
  failed: 'text-red-600',
};

interface Props {
  status: SwapStatus;
  error: string | null;
  result: SwapResult | null;
}

export default function TransactionStatus({ status, error, result }: Props) {
  if (status === 'idle' && !error) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {status !== 'idle' && (
        <p className={`text-sm font-medium ${STATUS_COLORS[status]}`}>
          {status === 'awaiting_signature' && '✍️ '}
          {status === 'submitting_swap' && '🔄 '}
          {status === 'recording_on_chain' && '📝 '}
          {status === 'success' && '✅ '}
          {status === 'failed' && '❌ '}
          {STATUS_LABELS[status]}
        </p>
      )}

      {result && (
        <div className="mt-2 space-y-1">
          {result.dexTxHash && (
            <p className="text-xs text-gray-500">
              DEX swap:{' '}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.dexTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 underline"
              >
                {result.dexTxHash.slice(0, 12)}…
              </a>
            </p>
          )}
          {result.contractTxHash && (
            <p className="text-xs text-gray-500">
              Volume record:{' '}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.contractTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 underline"
              >
                {result.contractTxHash.slice(0, 12)}…
              </a>
            </p>
          )}
        </div>
      )}

      {error && status === 'failed' && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {error && status === 'success' && (
        <p className="mt-1 text-xs text-amber-600">{error}</p>
      )}
    </div>
  );
}
