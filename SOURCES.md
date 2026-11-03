# Sources and notices

## Original code excerpts

Each file preserves one continuous range verbatim, including the original comments. The files are excerpts from two Rust programs. They depend on code outside this archive.

| Excerpt | Historical source | Commit | Lines |
| --- | --- | --- | --- |
| [World Chain anchor](source/world-chain-anchor.rs) | Dexter's SP1-Helios fork, `program/src/main.rs` | `7c4c8ecfd073a4b2d890933d793a9d6155d5f204` | 201–258 |
| [Advance a checkpoint](source/advance-checkpoint.rs) | Dexter Vault, `programs/dexter-vault/src/instructions/establish_root.rs` | `73d57dfc3b551fe8447ac75141a3e3f095a5615c` | 80–105 |
| [Upgrade an existing record](source/upgrade-record.rs) | Dexter Vault, `programs/dexter-vault/src/instructions/upgrade_credit_root.rs` | `a285bb9cd63e02e1d5e4278406a2d3d0915d946c` | 116–157 |

Dexter added the entire World Chain excerpt in the cited fork commit. Its guest crate inherits the upstream workspace's MIT designation. The original SP1-Helios workspace credits `xavierdmello` and `ratankaliani`. The excerpt shows Dexter's checks for the resolved claim, the output-root preimage and the registry storage proof. The full guest also checks the selected registry and anchor game, blacklist, retirement and game type. The rollup's contracts and governance determine which game the registry admits. [SP1-Helios](https://github.com/succinctlabs/sp1-helios) · [Across SP1-Helios fork](https://github.com/across-protocol/sp1-helios) · [Helios consensus dependency](https://github.com/a16z/helios/tree/3686d998e1e87c840ca04d3bea9c7386bbace6cb)

The two Dexter Vault extracts carry the project's original MIT notice. [Dexter source license](source/LICENSE-dexter)

## Proofs and verifier

The two `*-proof.bin` and `*-public-values.bin` pairs contain instruction bytes from finalized Solana transactions. The instruction used Anchor's eight-byte discriminator, a four-byte little-endian proof length, the proof, a four-byte little-endian public-value length and the public values. The transaction index records each signature, timestamp, Solana slot, proof hash and public-values hash. The bootstrap checkpoint is from a separate finalized transaction. [Transaction index](archive/transactions.json)

The 492-byte Groth16 verification key is byte-identical to the published `sp1-verifier` 6.1.0 key. Its SHA-256 is `4388a21c687fdd5f218d7e3d13190cac4c5355818d3605fd5fb811df468ee696`. Succinct distributes that package under MIT or Apache-2.0. The Apache-2.0 text accompanies this copy. [Key at the package revision](https://github.com/succinctlabs/sp1/blob/d714f028a22963e6173d57eb616363182296838c/crates/verifier/vk-artifacts/groth16_vk.bin) · [Published crate](https://crates.io/crates/sp1-verifier/6.1.0) · [License](vendor/LICENSE-sp1-key)

`verify.mjs` independently implements the July 1 SP1 v6 verifier's five-input framing, key checks, Groth16 pairing equation and checkpoint comparisons. Its results were compared with the historical Rust verifier; it does not execute the guest, generate a proof or rebuild the Solana program. The included bytes suffice to verify what each proof attests. A reader who wants to establish which transactions Solana finalized must also consult the ledger.

`vendor/bn254.mjs` packages the BN254 entry point from `@noble/curves` 1.9.7 and modules from `@noble/hashes` 1.8.0. Both have the same MIT license and copyright notice. To recreate the bundle with those packages installed, give esbuild 0.21.5 the entry line `export { bn254 } from '@noble/curves/bn254.js'` and flags `--bundle --platform=node --format=esm --minify --legal-comments=inline`. [noble-curves](https://github.com/paulmillr/noble-curves/tree/1.9.7) · [noble-hashes](https://github.com/paulmillr/noble-hashes/tree/1.8.0) · [License](vendor/LICENSE-noble)
