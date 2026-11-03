<p align="center">
  <img src="https://raw.githubusercontent.com/Dexter-DAO/dexter-x402-sdk/main/assets/dexter-wordmark.svg" alt="Dexter" width="360">
</p>

<h1 align="center">World Chain Bridge</h1>

<p align="center">
  <strong>Solana verified World&nbsp;ID against the registry on World&nbsp;Chain.</strong>
</p>

<p align="center">
  <a href="archive/transactions.json"><img src="https://img.shields.io/badge/Solana-mainnet-6f5cff.svg" alt="Solana mainnet transactions"></a>
  <a href="verify.mjs"><img src="https://img.shields.io/badge/proof-Groth16-555.svg" alt="Groth16 verifier"></a>
  <a href="#verify-two-mainnet-proofs-offline"><img src="https://img.shields.io/badge/node-20%20%2F%2022-339933.svg" alt="Tested with Node 20 and 22"></a>
</p>

<p align="center">
  <a href="#how-solana-checked-world-chain">Proof path</a> ·
  <a href="#verify-two-mainnet-proofs-offline">Verify</a> ·
  <a href="SOURCES.md#original-code-excerpts">Rust source</a> ·
  <a href="https://github.com/Dexter-DAO/demos">Demos</a>
</p>

World ID's registry lives on World Chain, an OP Stack rollup on Ethereum. To check a person's enrollment on Solana, Dexter needed to establish which version of that registry it could trust. Dexter extended the SP1-Helios Ethereum light client to prove which World Chain state had survived the rollup's dispute process and what the registry held in that state. Anyone could submit the proof on Solana.

<a id="what-crossed-the-bridge"></a>

## How Solana checked World Chain

The light client followed Ethereum finality from a trusted checkpoint. In the finalized Ethereum state, Dexter's proof program looked up the dispute game that World Chain's anchor registry had selected. It required the game to have resolved in the defender's favor. The program then reconstructed the game's winning claim from the World Chain state root, block hash and other committed fields. With that state root established, it could verify the World ID contract's registry storage. [World Chain proof code](source/world-chain-anchor.rs)

On Solana, the receiving program verified the Groth16 proof and matched its starting beacon slot, header and sync committee to the checkpoint on file. It advanced the checkpoint and recorded the proven registry root together. Dexter's relay could deliver an update without having the authority to pick its result. The first checkpoint came from an authorized signer. World Chain's dispute contracts and governance determined which game qualified. [Solana checkpoint code](source/advance-checkpoint.rs) · [Bootstrap transaction](https://explorer.solana.com/tx/4WxbAdvjpJBo3r8BvuvmzqgxtmVCaqJJRo1RAMTpFLYcvEsvHoKbjr8Uj56qS9AdFJ4voiPxACHTwC45kzV3hY5d)

<a id="how-solana-checked-a-world-id-enrollment-ten-days-later"></a>

## The July enrollment

On July 5, 2026, Dexter's operator vouched for a person's World ID enrollment so the person could open a credit record on Solana. The registry changed after they enrolled. On July 15, the bridge proved that the root from their original enrollment was in World Chain's registry history. [Enrollment](https://explorer.solana.com/tx/5cokzweFVwxBegnrtA3UZrpyghGGGRVHNjuQUqyvQ2S3AZ7FBhhKzUigGbYSNmCTGaXuhsBnT86MknJ6CSr7uw3P) · [Registry update](https://explorer.solana.com/tx/2SYRfu3YqBRYJCziJqFZPkfmpJqg2BhdXNYM5tMCSVtDVkhY2r2grPb76h56z4qtZUnCQAihPKfVHFro84AVASZw)

The credit program checked the person's original World ID proof against that history. It matched the proof's identifier (the nullifier) to the one already in the account. A one-byte change upgraded the same record from operator-attested to proof-verified. Its address, creation time and event count stayed intact. [Account upgrade](https://explorer.solana.com/tx/ryHhTwcGjhVDJVcWTu7EN2pnnGNmHU92c5C4ZCx3qShh6CE7cPF6dppWUbwmvszEnzfe6tqLFcc8WYp8t9DhqTZ) · [Account upgrade code](source/upgrade-record.rs)

## Verify two mainnet proofs offline

Run this from the repository with Node.js (tested with 20.10.0 and 22.19.0). All inputs and the pairing library are included.

```sh
node verify.mjs
```

The command verifies two consecutive July 1 proofs and prints the World ID registry root in each. Ethereum's finalized beacon slot advances from 14,670,208 to 14,670,272 and then to 14,670,592. The check also substitutes a valid curve point from the other proof, changes the claimed registry root, tries a different guest key and skips a checkpoint. Each change must fail. The source manifest identifies the exact historical files behind the three Rust excerpts. [First proof](https://explorer.solana.com/tx/2MZTSvWiqa165NDMceqiyuZLari9zK3QS4sX8YhJQXfinWoxJssyKZV1bw7EZMJeDCJtUjkhoGj1reJfpqCz59wR) · [Second proof](https://explorer.solana.com/tx/SDe73CXzh7dnuxrDNuUxQYbYzg5WgU8hcPWtfJANqb5c7AbNCnmycr52HZpYgnuNsF7YJDzSWF9Da4vQBAjuMbj) · [Sources and notices](SOURCES.md)

## What the archive covers

The offline check reads the original proof and public values from the two July 1 registry updates. The July 15 transactions used a later guest that could also attest historical roots. The [July enrollment](#the-july-enrollment) has separate mainnet receipts. The archive supplies no individual credential or witness. [Transaction index](archive/transactions.json)

The registry can record a root permanently and later stop accepting it for new proofs. Historical membership answers the July enrollment question. Accepting a credential today also depends on its validity at the time of presentation. Dexter closed the original Solana bridge accounts on October 31. This repository documents the July deployment. [Original cache closure](https://explorer.solana.com/tx/2YHW2Yx768The4AdPLXSyvudF7RsDL38AKeeKrm6PxB4C1oKEceBDNXajGp3yGG5oJ2EJdn9xbYT6e9xnQMsLWYJ)
