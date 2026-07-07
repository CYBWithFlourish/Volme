# Stellar Contract Development Lifecycle - Volme

## The Full Cycle

```
Write Rust  →  Build WASM  →  Test  →  Deploy  →  Generate TS Bindings  →  Frontend
```

---

## 1. Write → Build → Test

```
contracts/volme_tracker/src/lib.rs
      │
      ├── cargo build ──►  target/wasm32v1-none/release/volme_tracker.wasm
      │
      └── cargo test  ──►  6 unit tests pass (native x86, fast iteration)
```

- `cargo test` runs natively on x86 - fast feedback loop.
- `cargo build` cross-compiles to `wasm32v1-none` - the actual binary that runs on the Stellar ledger.
- The `wasm32v1-none` target is a bare-metal WASM target (no standard library, no OS).
- `target/` is excluded via `.gitignore` - build artifacts are never committed.

---

## 2. Deploy (Two Transactions, One CLI Command)

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/volme_tracker.wasm \
  --source <DEV_WALLET> --network testnet
```

Under the hood, this sends **two Stellar operations** in a single transaction:

| # | Operation | What happens | Returns |
|---|---|---|---|
| 1 | `InstallContractCode` | Upload the `.wasm` bytes to the ledger | `wasm_hash` (hash of the binary) |
| 2 | `CreateContract` | Instantiate from `wasm_hash` + salt → deterministic ID | **`contract_id`** (`CACERGM6...`) |

### Test Snapshots

When you run `cargo test`, the Soroban SDK's test environment (`#[test]` in `src/test.rs`) captures a **ledger snapshot** at the end of each test. These are written to `contracts/volme_tracker/test_snapshots/test/<test_name>.N.json`.

Each snapshot contains:
- Generated address/nonce counters (so tests are deterministic)
- **Auth entries** - the authorizations the contract invoked (which functions were called, with what args)
- **Ledger entries** - storage state (keys written, their values)
- **Events** - emitted contract events and their topics/data
- **Meta** - ledger sequence number, protocol version

They serve as **regression snapshots** - re-running tests compares against them to catch unintended behavior changes.

**This is NOT the test source.** The tests are in `contracts/volme_tracker/src/test.rs`. The snapshots are auto-generated artifacts. They're excluded from git via `contracts/*/test_snapshots/` in `.gitignore`.

### Why two steps?

1. **WASM upload** stores the raw binary on-chain. The hash serves as a content-addressed identifier - any contract can be created from it.
2. **Contract creation** picks a salt (random by default), hashes it with the `wasm_hash` and source account to produce the contract ID. This means:
   - Same WASM + same salt + same source = **same contract ID** (deterministic)
   - Different salt = different contract ID (useful for deploying the same WASM multiple times)

### Output

The only thing printed to stdout is the contract ID string: `CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N`. That's our contract's address.

### Verifiable on Stellar Expert

- **Contract:** [CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N](https://stellar.expert/explorer/testnet/contract/CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N)
- **WASM upload tx:** [c22b5e25812f528b9d2dd2484be96ee4a5c30051bb31a023ac65f0dc77e8a54b](https://stellar.expert/explorer/testnet/tx/c22b5e25812f528b9d2dd2484be96ee4a5c30051bb31a023ac65f0dc77e8a54b)
- **Contract create tx:** [d6d27fb41152e81b8ca28974c282436b4ec713f4850f6ab1b521a8607846741b](https://stellar.expert/explorer/testnet/tx/d6d27fb41152e81b8ca28974c282436b4ec713f4850f6ab1b521a8607846741b)

---

## 3. Generate TypeScript Bindings

```bash
stellar contract bindings typescript \
  --id CACERGM6ATNGNVI33L3P5VJ2BCNRFBC4L5E3IGAIUZTTOBTRL7HDUE3N \
  --network testnet \
  --output-dir src/contract-bindings
```

### What this does

1. Queries Soroban RPC for the deployed contract's **spec** (function signatures, parameter types, return types).
2. Writes `src/contract-bindings/src/index.ts` containing:

   - **6 base64 XDR specs** (lines 91-96) - these encode the function signatures so the SDK can serialize/deserialize calls
   - A typed `Client` class extending `@stellar/stellar-sdk/contract`'s `ContractClient`
   - Typed methods for each contract function:
     ```typescript
     client.record_swap({trader, sell_asset, buy_asset, sell_amount, buy_amount})
     client.get_total_fees()
     client.get_all_traders()
     // ...
     ```
   - A `networks` object mapping network names to `{networkPassphrase, contractId}`

3. You then compile it:
   ```bash
   cd src/contract-bindings && npm run build  # tsc → dist/index.js + dist/index.d.ts
   ```

### When bindings are generated

**After deployment.** The bindings require:
- A deployed contract ID (from step 2)
- An active Soroban RPC endpoint (the CLI fetches the spec from the network)

### Order of operations

```
lib.rs  →  .wasm  →  deployed contract_id  →  bindings .ts  →  dist/ .js
  ▲                                                                          
  └──── frontend also reads spec directly ──────────────────── (lib/contractClient.ts)
```

The generated TS bindings are a **convenience layer**. You could make raw RPC calls yourself, but the bindings handle:
- Serialization of function arguments
- Simulation (dry-run) before submission
- Signing and sending via a wallet
- Deserialization of return values

---

## 4. Gitignore - What's Protected and Why

### Root `.gitignore`

```
# Rust
target                          # WASM .rlib .o build artifacts - megabytes, platform-specific
                                # NEVER commit - redundant with source

# Local settings
.soroban                        # Identity keys/seeds from 'stellar keys generate'
                                # HIGH RISK - contains funded keypairs, testnet XLM can be drained
.stellar                        # CLI config (network preferences, key references)

# Node
node_modules                    # 10k+ npm packages, platform-specific binaries
.next                           # Next.js build cache - compiled server code, source maps
out                             # 'next export' static build - redundant with source

# Generated bindings (build artifact)
src/contract-bindings/dist      # Compiled JS from TS bindings - source .ts is what matters
src/contract-bindings/node_modules  # Bindings' isolated dependencies

# Env
.env                            # RPC URLs, private keys, API tokens - CRITICAL, never commit
.env.local                      # Local overrides - same risk as .env
```

### Inner `.gitignore` (`src/contract-bindings/.gitignore`)

```
node_modules/
dist/
```

- `node_modules/` - redundant with root but explicit
- `dist/` - compiled output from `tsc` (was `out/` in the Stellar CLI template, corrected to match the actual `tsconfig.json` `outDir: "./dist"`)

### Risk table

| Pattern | What it protects | Exposure risk |
|---|---|---|
| `target` | Rust build artifacts (`.wasm`, `.rlib`, `.o`) | Redundant noise |
| `.soroban` | Identity keys/seeds (testnet fund access) | **High** - XLM can be drained |
| `.stellar` | CLI config (network prefs, key refs) | Low |
| `node_modules` | 10k+ npm packages, platform binaries | Standard |
| `.next`, `out` | Build cache, source maps, compiled code | Low-Medium |
| `src/contract-bindings/dist` | Compiled JS (redundant with source `.ts`) | Low |
| `src/contract-bindings/node_modules` | Bindings' isolated deps | Standard |
| `.env`, `.env.local` | RPC URLs, private keys, API tokens | **Critical** - never commit |

### Additional protections worth adding

- `*.pem` - in case any key files end up in the repo
- `*.key` - same for raw private key files
- `*.secret` - any file with "secret" in the name
