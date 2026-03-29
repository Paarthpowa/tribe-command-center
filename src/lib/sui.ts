/**
 * Sui Move contract integration — Tribe Command Center
 *
 * Connects the React frontend to the on-chain tribe_command_center package.
 * Provides transaction builders for membership and pledge operations.
 */
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';

// ── Configuration ──────────────────────────────────────────────────────────────

/** Package ID after `sui client publish`. Update after deploying contracts/ */
const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID ?? '';

/** Shared TribeRegistry object ID (created by create_tribe). Update after first call. */
const TRIBE_REGISTRY_ID = import.meta.env.VITE_SUI_TRIBE_REGISTRY_ID ?? '';

/** Sui network — testnet for hackathon, mainnet for production */
const SUI_NETWORK: 'testnet' | 'mainnet' | 'devnet' = 'testnet';

// ── Client ─────────────────────────────────────────────────────────────────────

export const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(SUI_NETWORK), network: SUI_NETWORK });

// ── Helpers ────────────────────────────────────────────────────────────────────

export function isContractDeployed(): boolean {
  return PACKAGE_ID.length > 2 && PACKAGE_ID !== '0x0';
}

export function hasRegistryId(): boolean {
  return TRIBE_REGISTRY_ID.length > 2 && TRIBE_REGISTRY_ID !== '0x0';
}

function textEncoder(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

// ── Transaction Builders ───────────────────────────────────────────────────────

/**
 * Build a transaction to create a new tribe on-chain.
 * Calls: membership::create_tribe(name)
 * Returns a shared TribeRegistry + leader's MembershipNFT.
 */
export function buildCreateTribeTx(tribeName: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::membership::create_tribe`,
    arguments: [tx.pure.vector('u8', textEncoder(tribeName))],
  });
  return tx;
}

/**
 * Build a transaction to add a member to the tribe.
 * Calls: membership::add_member(registry, member, role)
 * Only callable by the tribe leader.
 */
export function buildAddMemberTx(memberAddress: string, role: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::membership::add_member`,
    arguments: [
      tx.object(TRIBE_REGISTRY_ID),
      tx.pure.address(memberAddress),
      tx.pure.vector('u8', textEncoder(role)),
    ],
  });
  return tx;
}

/**
 * Build a transaction to record a pledge commitment on-chain.
 * Calls: pledges::make_pledge(goal_id, task_id, resource, amount, deadline_epoch)
 */
export function buildMakePledgeTx(
  goalId: string,
  taskId: string,
  resource: string,
  amount: number,
  deadlineEpoch: number,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::pledges::make_pledge`,
    arguments: [
      tx.pure.vector('u8', textEncoder(goalId)),
      tx.pure.vector('u8', textEncoder(taskId)),
      tx.pure.vector('u8', textEncoder(resource)),
      tx.pure.u64(amount),
      tx.pure.u64(deadlineEpoch),
    ],
  });
  return tx;
}

/**
 * Build a transaction to confirm delivery of pledged resources.
 * Calls: pledges::confirm_delivery(pledge_record, amount)
 */
export function buildConfirmDeliveryTx(pledgeObjectId: string, amount: number): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::pledges::confirm_delivery`,
    arguments: [
      tx.object(pledgeObjectId),
      tx.pure.u64(amount),
    ],
  });
  return tx;
}

// ── On-chain Reads ─────────────────────────────────────────────────────────────

/** Fetch MembershipNFT objects owned by an address */
export async function fetchMembershipNFTs(ownerAddress: string) {
  if (!isContractDeployed()) return [];
  const { data } = await suiClient.getOwnedObjects({
    owner: ownerAddress,
    filter: { StructType: `${PACKAGE_ID}::membership::MembershipNFT` },
    options: { showContent: true },
  });
  return data;
}

/** Fetch PledgeRecord objects (shared) for a given pledger via events */
export async function fetchPledgeEvents(pledgerAddress: string) {
  if (!isContractDeployed()) return [];
  const { data } = await suiClient.queryEvents({
    query: {
      MoveEventType: `${PACKAGE_ID}::pledges::PledgeMade`,
    },
    limit: 50,
  });
  return data.filter(
    (e: { parsedJson?: unknown }) => (e.parsedJson as Record<string, unknown>)?.pledger === pledgerAddress,
  );
}

/** Get the tribe registry object data */
export async function fetchTribeRegistry() {
  if (!hasRegistryId()) return null;
  const obj = await suiClient.getObject({
    id: TRIBE_REGISTRY_ID,
    options: { showContent: true },
  });
  return obj.data;
}
