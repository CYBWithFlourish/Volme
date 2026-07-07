'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

type KitModule = typeof import('@creit.tech/stellar-wallets-kit');

interface WalletState {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    connected: false,
    connecting: false,
    error: null,
  });
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const kitModuleRef = useRef<KitModule | null>(null);

  useEffect(() => {
    import('@creit.tech/stellar-wallets-kit').then((mod) => {
      kitModuleRef.current = mod;
      kitRef.current = new mod.StellarWalletsKit({
        network: mod.WalletNetwork.TESTNET,
        modules: mod.allowAllModules(),
      });
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('volme_wallet');
    if (stored) {
      try {
        const { publicKey } = JSON.parse(stored);
        setState((prev) => ({
          ...prev,
          publicKey,
          connected: true,
        }));
      } catch {
        localStorage.removeItem('volme_wallet');
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const kit = kitRef.current;
    if (!kit) {
      setState((prev) => ({
        ...prev,
        error: 'Wallet kit not initialized.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));
    try {
      const wallets = await kit.getSupportedWallets();
      if (wallets.length === 0) {
        throw new Error('No wallets found. Please install Freighter or another Stellar wallet.');
      }

      let selectedWallet: string | null = null;

      await kit.openModal({
        onWalletSelected: (option) => {
          selectedWallet = option.id;
          kit.setWallet(option.id);
        },
      });

      if (!selectedWallet) {
        throw new Error('Wallet connection was rejected.');
      }

      const { address } = await kit.getAddress();

      if (!address) {
        throw new Error('Wallet connection was rejected.');
      }

      localStorage.setItem(
        'volme_wallet',
        JSON.stringify({ publicKey: address })
      );

      setState({
        publicKey: address,
        connected: true,
        connecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        connecting: false,
        error: err.message || 'Failed to connect wallet.',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('volme_wallet');
    setState({
      publicKey: null,
      connected: false,
      connecting: false,
      error: null,
    });
  }, []);

  const signTransaction = useCallback(
    async (txXdr: string): Promise<string> => {
      const kit = kitRef.current;
      const mod = kitModuleRef.current;
      if (!kit || !state.publicKey || !mod) {
        throw new Error('Wallet not connected');
      }
      const { signedTxXdr } = await kit.signTransaction(txXdr, {
        address: state.publicKey,
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      return signedTxXdr;
    },
    [state.publicKey]
  );

  return { ...state, connect, disconnect, signTransaction };
}
