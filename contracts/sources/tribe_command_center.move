/// Tribe Command Center — On-Chain Tribe Membership & Pledge Tracker
///
/// This Move module implements two core on-chain primitives for EVE Frontier tribes:
///
/// 1. **Tribe Membership NFT** — Each approved member holds a soulbound NFT proving
///    membership. The tribe leader can mint/revoke. This enables Smart Gate access
///    rules to gate on tribe_permit without revealing the full member list.
///
/// 2. **Pledge Commitments** — When a member pledges resources to a goal/task,
///    the commitment is recorded on-chain with amounts and deadlines. Delivery
///    confirmations update the record. This creates a trustless reputation system
///    where pledge reliability is publicly verifiable.
///
/// Design Philosophy:
/// - Players CHOOSE what goes on-chain (OPSEC-first design)
/// - Tribe coordination stays private (off-chain tool)
/// - Only membership proofs and pledge records are published
/// - Smart Gate / Assembly integration via tribe_permit pattern

module tribe_command_center::membership {

    // === Imports ===
    use sui::event;

    // === Errors ===
    const E_NOT_LEADER: u64 = 0;

    // === Structs ===

    /// Tribe registry — owned by the tribe leader
    /// Contains the tribe metadata and member count
    public struct TribeRegistry has key {
        id: UID,
        name: vector<u8>,
        leader: address,
        member_count: u64,
    }

    /// Membership NFT — soulbound to the member's address
    /// Proves tribe membership for Smart Gate access rules
    public struct MembershipNFT has key {
        id: UID,
        tribe_id: address, // address of TribeRegistry object
        member: address,
        role: vector<u8>, // "leader" | "officer" | "member"
        joined_at: u64,   // epoch timestamp
    }

    // === Events ===

    public struct MemberAdded has copy, drop {
        tribe_id: address,
        member: address,
        role: vector<u8>,
    }

    public struct MemberRevoked has copy, drop {
        tribe_id: address,
        member: address,
    }

    // === Functions ===

    /// Create a new tribe registry. The caller becomes the leader.
    public fun create_tribe(
        name: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let registry = TribeRegistry {
            id: object::new(ctx),
            name,
            leader: tx_context::sender(ctx),
            member_count: 1,
        };

        // Mint leader's own membership NFT
        let leader_nft = MembershipNFT {
            id: object::new(ctx),
            tribe_id: object::uid_to_address(&registry.id),
            member: tx_context::sender(ctx),
            role: b"leader",
            joined_at: tx_context::epoch(ctx),
        };

        transfer::transfer(leader_nft, tx_context::sender(ctx));
        transfer::share_object(registry);
    }

    /// Add a member to the tribe (leader only)
    public fun add_member(
        registry: &mut TribeRegistry,
        member: address,
        role: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == registry.leader, E_NOT_LEADER);

        let nft = MembershipNFT {
            id: object::new(ctx),
            tribe_id: object::uid_to_address(&registry.id),
            member,
            role,
            joined_at: tx_context::epoch(ctx),
        };

        registry.member_count = registry.member_count + 1;

        event::emit(MemberAdded {
            tribe_id: object::uid_to_address(&registry.id),
            member,
            role,
        });

        transfer::transfer(nft, member);
    }

    /// Revoke membership — burns the NFT (leader only)
    public fun revoke_member(
        registry: &mut TribeRegistry,
        nft: MembershipNFT,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == registry.leader, E_NOT_LEADER);

        event::emit(MemberRevoked {
            tribe_id: object::uid_to_address(&registry.id),
            member: nft.member,
        });

        registry.member_count = registry.member_count - 1;

        let MembershipNFT { id, tribe_id: _, member: _, role: _, joined_at: _ } = nft;
        object::delete(id);
    }

    /// Verify membership — returns true if NFT tribe matches registry
    public fun is_member(nft: &MembershipNFT, registry: &TribeRegistry): bool {
        nft.tribe_id == object::uid_to_address(&registry.id)
    }
}

module tribe_command_center::pledges {

    // === Imports ===
    use sui::event;

    // === Errors ===
    const E_NOT_PLEDGER: u64 = 0;
    const E_ALREADY_DELIVERED: u64 = 1;
    const E_OVER_DELIVERY: u64 = 2;

    // === Structs ===

    /// A pledge commitment — created when a member pledges resources to a task
    /// Shared object so both pledger and goal creator can interact
    public struct PledgeRecord has key {
        id: UID,
        /// Reference to off-chain goal ID
        goal_id: vector<u8>,
        /// Reference to off-chain task ID
        task_id: vector<u8>,
        /// Who pledged
        pledger: address,
        /// Resource name (e.g., "Building Foam")
        resource: vector<u8>,
        /// Amount pledged
        pledged_amount: u64,
        /// Amount delivered so far
        delivered_amount: u64,
        /// Deadline epoch
        deadline_epoch: u64,
        /// Whether fully delivered
        is_complete: bool,
        /// Created epoch
        created_at: u64,
    }

    // === Events ===

    public struct PledgeMade has copy, drop {
        goal_id: vector<u8>,
        task_id: vector<u8>,
        pledger: address,
        resource: vector<u8>,
        amount: u64,
        deadline_epoch: u64,
    }

    public struct DeliveryConfirmed has copy, drop {
        pledge_id: address,
        pledger: address,
        amount_delivered: u64,
        total_delivered: u64,
        is_complete: bool,
    }

    // === Functions ===

    /// Create a pledge for a specific goal/task
    public fun make_pledge(
        goal_id: vector<u8>,
        task_id: vector<u8>,
        resource: vector<u8>,
        amount: u64,
        deadline_epoch: u64,
        ctx: &mut TxContext,
    ) {
        let record = PledgeRecord {
            id: object::new(ctx),
            goal_id,
            task_id,
            pledger: tx_context::sender(ctx),
            resource,
            pledged_amount: amount,
            delivered_amount: 0,
            deadline_epoch,
            is_complete: false,
            created_at: tx_context::epoch(ctx),
        };

        event::emit(PledgeMade {
            goal_id: record.goal_id,
            task_id: record.task_id,
            pledger: record.pledger,
            resource: record.resource,
            amount,
            deadline_epoch,
        });

        transfer::share_object(record);
    }

    /// Confirm delivery of pledged resources (pledger only)
    public fun confirm_delivery(
        record: &mut PledgeRecord,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == record.pledger, E_NOT_PLEDGER);
        assert!(!record.is_complete, E_ALREADY_DELIVERED);
        assert!(record.delivered_amount + amount <= record.pledged_amount, E_OVER_DELIVERY);

        record.delivered_amount = record.delivered_amount + amount;

        if (record.delivered_amount >= record.pledged_amount) {
            record.is_complete = true;
        };

        event::emit(DeliveryConfirmed {
            pledge_id: object::uid_to_address(&record.id),
            pledger: record.pledger,
            amount_delivered: amount,
            total_delivered: record.delivered_amount,
            is_complete: record.is_complete,
        });
    }

    /// Check if pledge was delivered on time
    public fun is_on_time(record: &PledgeRecord, current_epoch: u64): bool {
        record.is_complete && current_epoch <= record.deadline_epoch
    }

    /// Get pledge completion percentage (0-100)
    public fun completion_pct(record: &PledgeRecord): u64 {
        if (record.pledged_amount == 0) { return 100 };
        (record.delivered_amount * 100) / record.pledged_amount
    }
}
