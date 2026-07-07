import { createClient, contractId, networkPassphrase, Client } from './contractClient';
import { rpcServer } from './stellar';

let clientInstance: Client | null = null;

function getClient(publicKey: string): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      contractId,
      networkPassphrase,
      rpcUrl: rpcServer.serverURL.toString(),
      publicKey,
    });
  }
  return clientInstance;
}

export async function recordSwap(
  publicKey: string,
  trader: string,
  sellAsset: string,
  buyAsset: string,
  sellAmount: bigint,
  buyAmount: bigint
) {
  const client = getClient(publicKey);
  return client.record_swap({
    trader,
    sell_asset: sellAsset,
    buy_asset: buyAsset,
    sell_amount: sellAmount,
    buy_amount: buyAmount,
  });
}

export async function getTotalFees(publicKey: string): Promise<bigint> {
  const client = getClient(publicKey);
  const tx = await client.get_total_fees();
  return tx.result;
}

export async function getTotalSwaps(publicKey: string): Promise<number> {
  const client = getClient(publicKey);
  const tx = await client.get_total_swaps();
  return tx.result;
}

export async function getUserVolume(
  publicKey: string,
  trader: string
): Promise<bigint> {
  const client = getClient(publicKey);
  const tx = await client.get_user_volume({ trader });
  return tx.result;
}

export async function getUserSwapCount(
  publicKey: string,
  trader: string
): Promise<number> {
  const client = getClient(publicKey);
  const tx = await client.get_user_swap_count({ trader });
  return tx.result;
}

export async function getAllTraders(
  publicKey: string
): Promise<string[]> {
  const client = getClient(publicKey);
  const tx = await client.get_all_traders();
  return tx.result;
}

export async function buildLeaderboard(
  publicKey: string
): Promise<{ trader: string; volume: bigint; swapCount: number }[]> {
  const traders = await getAllTraders(publicKey);
  const entries = await Promise.all(
    traders.map(async (trader) => {
      const volume = await getUserVolume(publicKey, trader);
      const swapCount = await getUserSwapCount(publicKey, trader);
      return { trader, volume, swapCount };
    })
  );
  entries.sort((a, b) => {
    if (b.volume > a.volume) return 1;
    if (b.volume < a.volume) return -1;
    return 0;
  });
  return entries;
}
