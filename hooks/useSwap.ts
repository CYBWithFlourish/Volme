'use client';

import { useState, useCallback } from 'react';
import {
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';
import { horizon, parseAsset } from '@/lib/stellar';
import { recordSwap } from '@/lib/contract';
import { useWallet } from './useWallet';

export type SwapStatus =
  | 'idle'
  | 'quoting'
  | 'awaiting_signature'
  | 'submitting_swap'
  | 'recording_on_chain'
  | 'success'
  | 'failed';

export interface SwapResult {
  dexTxHash: string | null;
  contractTxHash: string | null;
}

export function useSwap() {
  const { publicKey, signTransaction } = useWallet();
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SwapResult | null>(null);

  const executeSwap = useCallback(
    async (
      sellAssetStr: string,
      buyAssetStr: string,
      sellAmount: string,
      minBuyAmount: string
    ) => {
      if (!publicKey) {
        setError('Wallet not connected');
        setStatus('failed');
        return;
      }

      setStatus('quoting');
      setError(null);
      setResult(null);

      try {
        const sellAsset = parseAsset(sellAssetStr);
        const buyAsset = parseAsset(buyAssetStr);

        setStatus('awaiting_signature');

        const account = await horizon.loadAccount(publicKey);

        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.pathPaymentStrictSend({
              sendAsset: sellAsset,
              sendAmount: sellAmount,
              destination: publicKey,
              destAsset: buyAsset,
              destMin: minBuyAmount,
              path: [],
            })
          )
          .setTimeout(30)
          .build();

        setStatus('submitting_swap');

        const signedXdr = await signTransaction(tx.toXDR());
        const signedTx = TransactionBuilder.fromXDR(
          signedXdr,
          Networks.TESTNET
        );

        const dexResult = await horizon.submitTransaction(signedTx);
        const dexTxHash = dexResult.hash;

        setStatus('recording_on_chain');

        try {
          const sellAmountBig = BigInt(sellAmount);
          const buyAmountBig = BigInt(minBuyAmount);

          const contractTx = await recordSwap(
            publicKey,
            publicKey,
            sellAssetStr,
            buyAssetStr,
            sellAmountBig,
            buyAmountBig
          );

          const sentTx = await contractTx.signAndSend();

          setStatus('success');
          setResult({
            dexTxHash,
            contractTxHash: sentTx.sendTransactionResponse?.hash || null,
          });
        } catch (contractErr: any) {
          setStatus('success');
          setResult({
            dexTxHash,
            contractTxHash: null,
          });
          setError(
            `Swap succeeded but volume tracking failed. Will retry. Error: ${contractErr.message}`
          );
        }
      } catch (err: any) {
        setStatus('failed');
        const msg = err.message || String(err);
        if (
          msg.includes('path') ||
          msg.includes('Path') ||
          msg.includes('liquidity')
        ) {
          setError(
            'No liquidity found for this pair on the testnet orderbook.'
          );
        } else if (
          msg.includes('balance') ||
          msg.includes('insufficient') ||
          msg.includes('op_underfunded')
        ) {
          setError('Insufficient balance for the sell amount + network fee.');
        } else if (
          msg.includes('rejected') ||
          msg.includes('cancel') ||
          msg.includes('User')
        ) {
          setError('User rejected the wallet signature request.');
        } else {
          setError(msg);
        }
      }
    },
    [publicKey, signTransaction]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, executeSwap, reset };
}
