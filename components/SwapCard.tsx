'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/lib/WalletProvider';
import { useSwap } from '@/hooks/useSwap';
import TransactionStatus from './TransactionStatus';
import { getAccountBalances, findStrictSendPath, parseAsset } from '@/lib/stellar';

const SELL_ASSETS = ['XLM', 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'];
const BUY_ASSETS = ['XLM', 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'];

export default function SwapCard() {
  const { publicKey, connected } = useWallet();
  const { status, error, result, executeSwap, reset } = useSwap();

  const [sellAsset, setSellAsset] = useState(SELL_ASSETS[0]);
  const [buyAsset, setBuyAsset] = useState(BUY_ASSETS[1]);
  const [sellAmount, setSellAmount] = useState('');
  const [minBuyAmount, setMinBuyAmount] = useState('');
  const [balances, setBalances] = useState<{ asset: string; balance: string }[]>([]);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      getAccountBalances(publicKey).then(setBalances).catch(() => {});
    }
  }, [publicKey]);

  useEffect(() => {
    if (!sellAmount || isNaN(Number(sellAmount)) || Number(sellAmount) <= 0) {
      setMinBuyAmount('');
      setQuoteError(null);
      return;
    }
    setFetchingQuote(true);
    setQuoteError(null);
    const fetchQuote = async () => {
      try {
        const paths = await findStrictSendPath(
          parseAsset(sellAsset),
          sellAmount,
          parseAsset(buyAsset)
        );
        if (paths.records.length === 0) {
          setQuoteError('No liquidity found for this pair on the DEX.');
          setMinBuyAmount('');
          return;
        }
        setMinBuyAmount(paths.records[0].destination_amount);
      } catch {
        setQuoteError('Failed to fetch quote.');
        setMinBuyAmount('');
      } finally {
        setFetchingQuote(false);
      }
    };
    const timer = setTimeout(fetchQuote, 400);
    return () => clearTimeout(timer);
  }, [sellAmount, sellAsset, buyAsset]);

  const formatRate = (sell: string, buy: string) => {
    const s = Number(sell);
    const b = Number(buy);
    if (s === 0) return '—';
    return (b / s).toFixed(7);
  };

  const handleSwapAssets = useCallback(() => {
    setSellAsset(buyAsset);
    setBuyAsset(sellAsset);
    reset();
  }, [sellAsset, buyAsset, reset]);

  const handleSubmit = useCallback(async () => {
    if (!sellAmount || !minBuyAmount) return;
    await executeSwap(sellAsset, buyAsset, sellAmount, minBuyAmount);
  }, [sellAsset, buyAsset, sellAmount, minBuyAmount, executeSwap]);

  const balanceForAsset = (asset: string): string => {
    const entry = balances.find((b) => b.asset === asset);
    return entry ? entry.balance : '0';
  };

  const assetLabel = (asset: string) => {
    if (asset === 'XLM') return 'XLM';
    return asset.split(':')[0];
  };

  if (!connected) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">Connect your wallet to swap assets.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Swap</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Sell
          </label>
          <div className="flex gap-2">
            <select
              value={sellAsset}
              onChange={(e) => {
                setSellAsset(e.target.value);
                reset();
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {SELL_ASSETS.map((a) => (
                <option key={a} value={a}>
                  {assetLabel(a)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={sellAmount}
              onChange={(e) => {
                setSellAmount(e.target.value);
                setQuoteError(null);
              }}
              placeholder="0.00"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Balance: {balanceForAsset(sellAsset)}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSwapAssets}
            className="rounded-full border border-gray-300 p-2 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
          >
            ⇅
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Buy (estimated)
          </label>
          <div className="flex gap-2">
            <select
              value={buyAsset}
              onChange={(e) => {
                setBuyAsset(e.target.value);
                reset();
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {BUY_ASSETS.map((a) => (
                <option key={a} value={a}>
                  {assetLabel(a)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={minBuyAmount}
              onChange={(e) => setMinBuyAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          {minBuyAmount && !quoteError && (
            <p className="mt-1 text-xs text-gray-400">
              1 {assetLabel(sellAsset)} ≈ {formatRate(sellAmount, minBuyAmount)} {assetLabel(buyAsset)}
            </p>
          )}
          {fetchingQuote && (
            <p className="mt-1 text-xs text-gray-400">Fetching quote…</p>
          )}
        </div>

        {quoteError && (
          <p className="text-xs text-red-500">{quoteError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={
            !sellAmount ||
            !minBuyAmount ||
            status === 'quoting' ||
            status === 'adding_trustline' ||
            status === 'submitting_swap' ||
            status === 'recording_on_chain' ||
            status === 'awaiting_signature'
          }
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {status === 'adding_trustline'
            ? 'Adding Trustline…'
            : status === 'quoting' || status === 'awaiting_signature'
              ? 'Processing…'
              : status === 'submitting_swap'
                ? 'Submitting…'
                : status === 'recording_on_chain'
                  ? 'Recording…'
                  : 'Swap'}
        </button>
      </div>

      <div className="mt-4">
        <TransactionStatus status={status} error={error} result={result} />
      </div>
    </div>
  );
}
