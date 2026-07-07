import {
  Horizon,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Asset,
  Operation,
} from '@stellar/stellar-sdk';
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const RPC_URL = 'https://soroban-testnet.stellar.org';

export const horizon = new Horizon.Server(HORIZON_URL);
export const rpcServer = new SorobanRpcServer(RPC_URL, {
  allowHttp: true,
});

export const NATIVE_ASSET = 'XLM';

export async function findStrictSendPath(
  sourceAsset: Asset,
  sourceAmount: string,
  destAsset: Asset
) {
  return horizon.strictSendPaths(sourceAsset, sourceAmount, [destAsset]).call();
}

export async function getAccountBalances(
  publicKey: string
): Promise<{ asset: string; balance: string }[]> {
  const account = await horizon.loadAccount(publicKey);
  return account.balances.map((b: any) => ({
    asset:
      b.asset_type === 'native'
        ? NATIVE_ASSET
        : `${b.asset_code}:${b.asset_issuer}`,
    balance: b.balance,
  }));
}

export function parseAsset(assetStr: string): Asset {
  if (assetStr === NATIVE_ASSET) return Asset.native();
  const [code, issuer] = assetStr.split(':');
  return new Asset(code, issuer);
}

export function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
