import {
  AssembledTransaction,
  Client as ContractClient,
  MethodOptions,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type { u32, i128 } from '@stellar/stellar-sdk/contract';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

export const contractId = 'CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N';
export const networkPassphrase = 'Test SDF Network ; September 2015';

const spec = new ContractSpec([
  'AAAAAAAAAAAAAAALcmVjb3JkX3N3YXAAAAAABQAAAAAAAAAGdHJhZGVyAAAAAAATAAAAAAAAAApzZWxsX2Fzc2V0AAAAAAARAAAAAAAAAAlidXlfYXNzZXQAAAAAAAARAAAAAAAAAAtzZWxsX2Ftb3VudAAAAAALAAAAAAAAAApidXlfYW1vdW50AAAAAAALAAAAAA==',
  'AAAAAAAAAAAAAAAOZ2V0X3RvdGFsX2ZlZXMAAAAAAAAAAAABAAAACw==',
  'AAAAAAAAAAAAAAAPZ2V0X2FsbF90cmFkZXJzAAAAAAAAAAABAAAD6gAAABM=',
  'AAAAAAAAAAAAAAAPZ2V0X3RvdGFsX3N3YXBzAAAAAAAAAAABAAAABA==',
  'AAAAAAAAAAAAAAAPZ2V0X3VzZXJfdm9sdW1lAAAAAAEAAAAAAAAABnRyYWRlcgAAAAAAEwAAAAEAAAAL',
  'AAAAAAAAAAAAAAATZ2V0X3VzZXJfc3dhcF9jb3VudAAAAAABAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAABAAAABA==',
]);

export interface Client {
  record_swap: (
    { trader, sell_asset, buy_asset, sell_amount, buy_amount }: {
      trader: string;
      sell_asset: string;
      buy_asset: string;
      sell_amount: i128;
      buy_amount: i128;
    },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<null>>;

  get_total_fees: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;

  get_all_traders: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>;

  get_total_swaps: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>;

  get_user_volume: (
    { trader }: { trader: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<i128>>;

  get_user_swap_count: (
    { trader }: { trader: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<u32>>;
}

class VolmeClient extends ContractClient {
  constructor(options: { contractId: string; networkPassphrase: string; rpcUrl: string; publicKey: string }) {
    super(spec, options);
  }
}

const VolmeClientCtor = VolmeClient as unknown as new (
  options: { contractId: string; networkPassphrase: string; rpcUrl: string; publicKey: string }
) => Client;

export function createClient(options: {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
  publicKey: string;
}): Client {
  return new VolmeClientCtor(options);
}
