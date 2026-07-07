'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

type KitModule = typeof import('@creit.tech/stellar-wallets-kit');

interface WalletContextValue {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (txXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const kitModuleRef = useRef<KitModule | null>(null);

  const initKit = useCallback((mod: KitModule, walletId?: string) => {
    kitModuleRef.current = mod;
    kitRef.current = new mod.StellarWalletsKit({
      network: mod.WalletNetwork.TESTNET,
      selectedWalletId: walletId,
      modules: mod.allowAllModules(),
    });
  }, []);

  useEffect(() => {
    import('@creit.tech/stellar-wallets-kit').then((mod) => {
      const stored = localStorage.getItem('volme_wallet');
      let walletId: string | undefined;
      if (stored) {
        try {
          const data = JSON.parse(stored);
          walletId = data.walletId;
          setPublicKey(data.publicKey);
          setConnected(true);
        } catch {
          localStorage.removeItem('volme_wallet');
        }
      }
      initKit(mod, walletId);
    });
  }, [initKit]);

  const connect = useCallback(async () => {
    const kit = kitRef.current;
    if (!kit) {
      setError('Wallet kit not initialized.');
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const wallets = await kit.getSupportedWallets();
      if (wallets.length === 0) {
        throw new Error('No wallets found. Please install Freighter or another Stellar wallet.');
      }

      await kit.openModal({
        onWalletSelected: async (option) => {
          const mod = kitModuleRef.current;
          if (!mod) return;

          initKit(mod, option.id);

          try {
            const { address } = await kitRef.current!.getAddress();

            if (!address) {
              setConnecting(false);
              setError('Wallet connection was rejected.');
              return;
            }

            localStorage.setItem(
              'volme_wallet',
              JSON.stringify({ publicKey: address, walletId: option.id })
            );
            setPublicKey(address);
            setConnected(true);
            setConnecting(false);
            setError(null);
          } catch (err: any) {
            setConnecting(false);
            setError(err.message || 'Failed to connect wallet.');
          }
        },
      });

      setConnecting((c) => { if (c) return false; return c; });
    } catch (err: any) {
      setConnecting(false);
      setError(err.message || 'Failed to connect wallet.');
    }
  }, [initKit]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('volme_wallet');
    setPublicKey(null);
    setConnected(false);
    setConnecting(false);
    setError(null);
  }, []);

  const signTransaction = useCallback(async (txXdr: string): Promise<string> => {
    const kit = kitRef.current;
    const mod = kitModuleRef.current;
    if (!kit || !publicKey || !mod) {
      throw new Error('Wallet not connected');
    }
    const { signedTxXdr } = await kit.signTransaction(txXdr, {
      address: publicKey,
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
    return signedTxXdr;
  }, [publicKey]);

  return (
    <WalletContext.Provider value={{ publicKey, connected, connecting, error, connect, disconnect, signTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
