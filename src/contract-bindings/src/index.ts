import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N",
  }
} as const


export interface Client {
  /**
   * Construct and simulate a record_swap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_swap: ({trader, sell_asset, buy_asset, sell_amount, buy_amount}: {trader: string, sell_asset: string, buy_asset: string, sell_amount: i128, buy_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_total_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_fees: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_all_traders transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_all_traders: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_total_swaps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_swaps: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_user_volume transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_volume: ({trader}: {trader: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_user_swap_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_swap_count: ({trader}: {trader: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAALcmVjb3JkX3N3YXAAAAAABQAAAAAAAAAGdHJhZGVyAAAAAAATAAAAAAAAAApzZWxsX2Fzc2V0AAAAAAARAAAAAAAAAAlidXlfYXNzZXQAAAAAAAARAAAAAAAAAAtzZWxsX2Ftb3VudAAAAAALAAAAAAAAAApidXlfYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAOZ2V0X3RvdGFsX2ZlZXMAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAPZ2V0X2FsbF90cmFkZXJzAAAAAAAAAAABAAAD6gAAABM=",
        "AAAAAAAAAAAAAAAPZ2V0X3RvdGFsX3N3YXBzAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAAPZ2V0X3VzZXJfdm9sdW1lAAAAAAEAAAAAAAAABnRyYWRlcgAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAATZ2V0X3VzZXJfc3dhcF9jb3VudAAAAAABAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAABAAAABA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    record_swap: this.txFromJSON<null>,
        get_total_fees: this.txFromJSON<i128>,
        get_all_traders: this.txFromJSON<Array<string>>,
        get_total_swaps: this.txFromJSON<u32>,
        get_user_volume: this.txFromJSON<i128>,
        get_user_swap_count: this.txFromJSON<u32>
  }
}