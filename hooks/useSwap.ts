'use client';

import { useState, useCallback } from 'react';
import {
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';
import { horizon, parseAsset, hasTrustline, buildTrustlineTx, isNative } from '@/lib/stellar';
import { recordSwap } from '@/lib/contract';
import { useWallet } from '@/lib/WalletProvider';

export type SwapStatus =
  | 'idle'
  | 'quoting'
  | 'adding_trustline'
  | 'awaiting_signature'
  | 'submitting_swap'
  | 'recording_on_chain'
  | 'success'
  | 'failed';

export interface SwapResult {
  dexTxHash: string | null;
  contractTxHash: string | null;
}

function msgIncludes(err: any, ...keywords: string[]) {
  const msg = err.message || String(err);
  return keywords.some((k) => msg.includes(k));
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

        const account = await horizon.loadAccount(publicKey);

        if (!isNative(buyAssetStr)) {
          const hasTL = await hasTrustline(publicKey, buyAssetStr);
          if (!hasTL) {
            setStatus('adding_trustline');
            const tlXdr = buildTrustlineTx(account, buyAssetStr, Networks.TESTNET);
            const signedTlXdr = await signTransaction(tlXdr);
            const signedTlTx = TransactionBuilder.fromXDR(signedTlXdr, Networks.TESTNET);
            await horizon.submitTransaction(signedTlTx);
          }
        }

        const swapAccount = await horizon.loadAccount(publicKey);

        setStatus('awaiting_signature');

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
          const toStroops = (val: string): bigint => {
            const parts = val.split('.');
            const whole = parts[0];
            const frac = (parts[1] || '').padEnd(7, '0').slice(0, 7);
            return BigInt(whole + frac);
          };
          const assetCode = (a: string) => a.split(':')[0];
          const sellAmountBig = toStroops(sellAmount);
          const buyAmountBig = toStroops(minBuyAmount);

          const contractTx = await recordSwap(
            publicKey,
            publicKey,
            assetCode(sellAssetStr),
            assetCode(buyAssetStr),
            sellAmountBig,
            buyAmountBig
          );

          const sentTx = await contractTx.signAndSend({
            signTransaction: async (xdr: string) => {
              const signed = await signTransaction(xdr);
              return { signedTxXdr: signed };
            },
          });

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

        const codes = err?.response?.data?.extras?.result_codes;
        if (codes?.operations) {
          const opCode = codes.operations[0];
          if (opCode === 'op_no_trust') {
            setError(
              'Trustline creation failed. Please try the swap again.'
            );
          } else if (opCode === 'op_underfunded' || opCode === 'op_line_full') {
            setError('Insufficient balance or trustline limit reached.');
          } else if (opCode === 'op_sell_not_authorized') {
            setError('Asset issuer has not authorized your account.');
          } else if (opCode === 'op_path_payment_strict_send_no_issuer') {
            setError('Destination asset issuer does not exist.');
          } else if (
            msgIncludes(err, 'path') ||
            msgIncludes(err, 'liquidity')
          ) {
            setError('No liquidity found for this pair on the testnet orderbook.');
          } else {
            setError(`Transaction failed: ${opCode}`);
          }
        } else if (
          msgIncludes(err, 'rejected') ||
          msgIncludes(err, 'cancel') ||
          msgIncludes(err, 'User')
        ) {
          setError('User rejected the wallet signature request.');
        } else if (codes?.transaction === 'tx_bad_seq') {
          setError('Transaction sequence error. Please refresh and try again.');
        } else {
          setError(err.message || 'Request failed with status code 400');
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
