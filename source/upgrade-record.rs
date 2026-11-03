    require!(
        ctx.accounts.credit_root.version == 2,
        VaultError::CreditRootNotUpgradable
    );

    // 2) Verify the groth16 proof against the production verifying key. Ok here
    //    only attests "valid proof for SOME public inputs against the World ID v4 VK".
    verify_world_id_pi2(&args.proof_a, &args.proof_b, &args.proof_c, &args.public_inputs)?;

    // 3) Bind the public inputs to the cached (trustless) root + Dexter context +
    //    pinned credential/network signals, and extract the verified nullifier.
    //    Every expected value comes from program state (root) or constants (the
    //    rest) — NONE from `args`. Pinning oprf_pk/cred_pk is what keeps
    //    one-human-one-root intact (an attacker-supplied oprf_pk would otherwise
    //    let one human grind unlimited nullifiers).
    let nullifier = bind_world_id_context_with_history(
        &args.public_inputs,
        &ctx.accounts.root_cache.root,
        &root_history,
        &DEXTER_RP_ID,
        &DEXTER_ACTION,
        &WorldIdCredentialPins {
            issuer_schema_id: &DEXTER_ISSUER_SCHEMA_ID,
            cred_pk_0: &DEXTER_CRED_PK_0,
            cred_pk_1: &DEXTER_CRED_PK_1,
            depth: &DEXTER_TREE_DEPTH,
            oprf_pk_0: &DEXTER_OPRF_PK_0,
            oprf_pk_1: &DEXTER_OPRF_PK_1,
        },
    )?;

    // 4) The proof must be for THIS human: the verified nullifier must equal the
    //    stored one. Combined with the PDA seed (also the nullifier) this makes
    //    upgrading someone else's root or minting a second impossible.
    require!(
        nullifier == ctx.accounts.credit_root.nullifier,
        VaultError::CreditRootNullifierMismatch
    );

    // 5) Flip to trustless. Same layout (v1/v2 byte-identical) → a one-byte
    //    version change; nullifier / established_at / event_count are preserved.
    ctx.accounts.credit_root.version = 1;
