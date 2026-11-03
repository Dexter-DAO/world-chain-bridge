    require!(
        extracted.prev_head == lc.head,
        VaultError::LightClientHeadMismatch
    );
    require!(
        extracted.prev_header == lc.header,
        VaultError::LightClientHeaderMismatch
    );
    require!(
        extracted.start_sync_committee_hash == lc.sync_committee_hash,
        VaultError::SyncCommitteeStartMismatch
    );
    // Forward-only: the new head must strictly advance. (Replay is already
    // precluded by `prev_head == lc.head` once the head has moved on, but this
    // makes monotonicity explicit and rejects a same-head no-op.)
    require!(
        extracted.beacon_head > lc.head,
        VaultError::BeaconHeadNotMonotonic
    );

    // 3) Advance the trusted light-client state. The proof — now verified against
    //    the trusted committee — carries the next head, header, and committees.
    lc.head = extracted.beacon_head;
    lc.header = extracted.new_header;
    lc.sync_committee_hash = extracted.sync_committee_hash;
    lc.next_sync_committee_hash = extracted.next_sync_committee_hash;
