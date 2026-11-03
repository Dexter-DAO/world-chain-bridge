    // ── L1 hop B: the anchor game's claimData[0].claim (the output root) ──
    assert_eq!(
        anchor.anchor_game.address, anchor_game_addr,
        "witness anchor_game does not match the proven ASR slot-2 pointer"
    );
    let game_slots = verify_storage_slot_proofs(execution_state_root, &anchor.anchor_game);

    // claimData[0] lives at keccak256(bytes32(GAME_CLAIMDATA_SLOT)); the root claim
    // is at element offset +3, the parentIndex sentinel at +0.
    let claim_base = U256::from_be_bytes(keccak256(slot_key(GAME_CLAIMDATA_SLOT).as_slice()).0);
    let claim_key = u256_to_b256(claim_base + U256::from(GAME_CLAIM_OFFSET));
    let parent_key = u256_to_b256(claim_base + U256::from(GAME_PARENT_OFFSET));

    let output_root = slot_value(&game_slots, claim_key);
    let parent_word = slot_value(&game_slots, parent_key);
    assert_eq!(
        parent_word.as_slice()[28..32],
        ROOT_PARENT_SENTINEL,
        "anchor game claimData[0] is not the root claim (parentIndex != sentinel)"
    );
    let status_word = slot_value(&game_slots, slot_key(GAME_STATUS_SLOT));
    assert_eq!(
        status_word.as_slice()[GAME_STATUS_BYTE], STATUS_DEFENDER_WINS,
        "anchor game is not resolved DEFENDER_WINS"
    );
    // The game must strictly post-date the ASR retirement cutoff
    // (isGameRetired := createdAt <= retirementTimestamp). `createdAt` is the
    // uint64 in game slot-0 bytes [24..32] — the same word we just read.
    assert!(
        u64_at(&status_word, 24) > retirement_ts,
        "anchor game is retired (createdAt <= ASR retirementTimestamp)"
    );

    // ── Preimage: bind l2_state_root to the L1-anchored output root ──
    let computed_output_root = output_root_preimage_hash(
        &anchor.output_root_version,
        &anchor.l2_state_root,
        &anchor.message_passer_storage_root,
        &anchor.l2_block_hash,
    );
    assert_eq!(
        computed_output_root, output_root,
        "output-root preimage does not hash to the L1-anchored root claim"
    );

    // ── L2 hops C+D: WorldIDRegistry slot 15 against the bound l2_state_root ──
    assert_eq!(
        anchor.registry.address, WORLD_ID_REGISTRY,
        "witness registry address is not the World ID registry"
    );
    let registry_slots = verify_storage_slot_proofs(anchor.l2_state_root, &anchor.registry);
    let world_id_root = slot_value(&registry_slots, slot_key(WORLD_ID_LATEST_ROOT_SLOT));

    VerifiedStorageSlot {
        key: slot_key(WORLD_ID_LATEST_ROOT_SLOT),
        value: world_id_root,
        contractAddress: WORLD_ID_REGISTRY,
    }
