# How Solana checked a World ID enrollment ten days later

On July 5, 2026, a person used World ID to establish a credit identity on Solana. Dexter's operator vouched for the enrollment so the person could open the record immediately. By July 15, the World ID registry on World Chain had moved on. Solana still upgraded the **same credit record** from operator-attested to proof-verified. The upgrade kept the original address and changed one byte, leaving the creation time and event counter in place. [July 5 enrollment](https://explorer.solana.com/tx/5cokzweFVwxBegnrtA3UZrpyghGGGRVHNjuQUqyvQ2S3AZ7FBhhKzUigGbYSNmCTGaXuhsBnT86MknJ6CSr7uw3P) · [July 15 upgrade](https://explorer.solana.com/tx/ryHhTwcGjhVDJVcWTu7EN2pnnGNmHU92c5C4ZCx3qShh6CE7cPF6dppWUbwmvszEnzfe6tqLFcc8WYp8t9DhqTZ)

A person's proof refers to the state of the registry when they used it. Solana needed to verify that the registry had held that value. At 20:54 UTC on July 15, it accepted a proof that included the earlier registry root in World Chain's history. Four minutes and 41 seconds later, the credit program verified the person's proof against that history and changed the record's version. The registry's latest root at the time was already different. [Registry update](https://explorer.solana.com/tx/2SYRfu3YqBRYJCziJqFZPkfmpJqg2BhdXNYM5tMCSVtDVkhY2r2grPb76h56z4qtZUnCQAihPKfVHFro84AVASZw) · [Account upgrade code](source/upgrade-record.rs)

## What crossed the bridge

Dexter extended an Ethereum light client to follow a specific claim from Ethereum to World Chain. The proof program checked which rollup dispute game Ethereum had recorded, required a win for the defender, and recomputed the game's winning claim from the World Chain block data. That let it verify what the World ID registry stored at that block. On Solana, anyone could submit the result. The receiving program checked the proof and required it to continue from the Ethereum checkpoint the program already held. Trust began at the initial checkpoint and depended on the rollup's dispute process. [World Chain proof code](source/world-chain-anchor.rs) · [Solana checkpoint code](source/advance-checkpoint.rs) · [Bootstrap transaction](https://explorer.solana.com/tx/4WxbAdvjpJBo3r8BvuvmzqgxtmVCaqJJRo1RAMTpFLYcvEsvHoKbjr8Uj56qS9AdFJ4voiPxACHTwC45kzV3hY5d)

## Verify two mainnet proofs offline

Run this from the repository with Node.js (tested with 20.10.0 and 22.19.0). All inputs and the pairing library are included.

```sh
node verify.mjs
```

The command verifies two consecutive July 1 proofs and prints the World ID registry root in each. Ethereum's finalized beacon slot advances from 14,670,208 to 14,670,272 and then to 14,670,592. The check also substitutes a valid curve point from the other proof, changes the claimed registry root, tries a different guest key and skips a checkpoint. Each change must fail. The source manifest identifies the exact historical files behind the three Rust excerpts. [First proof](https://explorer.solana.com/tx/2MZTSvWiqa165NDMceqiyuZLari9zK3QS4sX8YhJQXfinWoxJssyKZV1bw7EZMJeDCJtUjkhoGj1reJfpqCz59wR) · [Second proof](https://explorer.solana.com/tx/SDe73CXzh7dnuxrDNuUxQYbYzg5WgU8hcPWtfJANqb5c7AbNCnmycr52HZpYgnuNsF7YJDzSWF9Da4vQBAjuMbj) · [Sources and notices](SOURCES.md)

## What the archive covers

The offline check reads the original proof and public values from the two July 1 registry updates. The July 15 transactions used a later guest that could also attest historical roots. Follow the three enrollment and upgrade receipts above to inspect that case separately. The archive supplies no individual credential or witness. [Transaction index](archive/transactions.json)

The registry can record a root permanently and later stop accepting it for new proofs. Historical membership answers the July enrollment question. Accepting a credential today also depends on its validity at the time of presentation. Dexter closed the original Solana bridge accounts on October 31. This repository documents the July deployment. [Original cache closure](https://explorer.solana.com/tx/2YHW2Yx768The4AdPLXSyvudF7RsDL38AKeeKrm6PxB4C1oKEceBDNXajGp3yGG5oJ2EJdn9xbYT6e9xnQMsLWYJ)
