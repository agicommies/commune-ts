import type { ApiDecoration } from "@polkadot/api/types";
import type { Header } from "@polkadot/types/interfaces";
import type { AnyTuple, Codec, IU8a } from "@polkadot/types/types";
import type { Enum, Tagged } from "rustie";
import type { Extends } from "tsafe";
import { ApiPromise } from "@polkadot/api";
import { StorageKey } from "@polkadot/types";
import { decodeAddress } from "@polkadot/util-crypto";
import { Variant } from "rustie/dist/enum";
import { assert } from "tsafe";
import { z } from "zod";

import { assertOrThrow } from "../utils";

export type { Codec } from "@polkadot/types/types";

// == Misc ==

export type Entry<T> = [unknown, T];
export type RawEntry = Entry<Codec>[] | undefined;
export type Result<T, E> = Enum<{ Ok: T; Err: E }>;

export type Nullish = null | undefined;
export type Api = ApiDecoration<"promise"> | ApiPromise;

// == rustie related stuff ==
type KeysOfUnion<T> = T extends T ? keyof T : never;

type ValueOfUnion<T, K extends KeysOfUnion<T>> = Extract<
  T,
  Record<K, unknown>
>[K];

type UnionToVariants<T> =
  KeysOfUnion<T> extends infer K
    ? K extends KeysOfUnion<T>
      ? Variant<K, ValueOfUnion<T, K>>
      : never
    : never;
// ==========================

export interface BaseProposal {
  id: number;
  metadata: string;
}

export interface BaseDao {
  id: number;
  data: string;
}

export const CUSTOM_METADATA_SCHEMA = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;

export interface CustomDataError {
  message: string;
}

export type CustomMetadataState = Result<CustomMetadata, CustomDataError>;
export type WithMetadataState<T> = T & { customData?: CustomMetadataState };

export const URL_SCHEMA = z.string().trim().url();

export const isNotNull = <T>(item: T | null): item is T => item !== null;

/**
 * == Subspace refresh times ==
 *
 * TODO: these values should be passed as parameters in the functions passed by the apps (env).
 *
 * Time to consider last block query un-fresh. Half block time is the expected
 * time for a new block at a random point in time, so:
 * block_time / 2  ==  8 seconds / 2  ==  4 seconds
 */
export const LAST_BLOCK_STALE_TIME = (1000 * 8) / 2;

/**
 * Time to consider proposals query state un-fresh. They don't change a lot,
 * only when a new proposal is created and people should be able to see new
 * proposals fast enough.
 *
 * 1 minute (arbitrary).
 */
export const PROPOSALS_STALE_TIME = 1000 * 60;

/**
 * Time to consider stake query state un-fresh. They also don't change a lot,
 * only when people move their stake / delegation. That changes the way votes
 * are computed, but only very marginally for a given typical stake change, with
 * a small chance of a relevant difference in displayed state.
 * 5 minutes (arbitrary).
 */
export const STAKE_STALE_TIME = 1000 * 60 * 5; // 5 minutes (arbitrary)

// == Stake ==

export interface StakeOutData {
  total: bigint;
  perAddr: Map<string, bigint>;
  perAddrPerNet: Map<string, Map<string, bigint>>;
}

export interface LastBlock {
  blockHeader: Header;
  blockNumber: number;
  blockHash: IU8a;
  blockHashHex: `0x${string}`;
  apiAtBlock: ApiDecoration<"promise">;
}

export interface ProposalStakeInfo {
  stakeFor: bigint;
  stakeAgainst: bigint;
  stakeVoted: bigint;
  stakeTotal: bigint;
}

// == SS58 ==

export type SS58Address = Tagged<string, "SS58Address">;

export function isSS58(value: string | null): value is SS58Address {
  let decoded: Uint8Array | null;
  try {
    decoded = decodeAddress(value);
  } catch (e) {
    return false;
  }
  return decoded != null;
}

export const ADDRESS_SCHEMA = z.string().refine(isSS58, "Invalid SS58 address");

export function parseAddress(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

// == Query params validation ==
export const QUERY_PARAMS_SCHEMA = z.object({
  netuid: z.number(),
  address: ADDRESS_SCHEMA,
});

// == Transactions ==
export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
}

export interface Stake {
  validator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

export interface Transfer {
  to: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

export interface TransferStake {
  fromValidator: string;
  toValidator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

// == Governance ==

export interface Vote {
  proposalId: number;
  vote: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddCustomProposal {
  IpfsHash: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddDaoApplication {
  IpfsHash: string;
  applicationKey: string;
  callback?: (status: TransactionResult) => void;
}

export interface UpdateDelegatingVotingPower {
  isDelegating: boolean;
  callback?: (status: TransactionResult) => void;
}

export const TOKEN_AMOUNT_SCHEMA = z
  .string()
  .or(z.number())
  .transform((value) => BigInt(value));

// == DAO Applications ==

export type DaoStatus = "Pending" | "Accepted" | "Refused";

export const DAO_APPLICATIONS_SCHEMA = z.object({
  id: z.number(),
  userId: ADDRESS_SCHEMA, // TODO: validate SS58 address
  payingFor: ADDRESS_SCHEMA, // TODO: validate SS58 address
  data: z.string(),
  status: z
    .string()
    .refine(
      (value) => ["Pending", "Accepted", "Refused"].includes(value),
      "Invalid proposal status",
    )
    .transform((value) => value as DaoStatus),
  applicationCost: TOKEN_AMOUNT_SCHEMA,
});

export type DaoApplications = z.infer<typeof DAO_APPLICATIONS_SCHEMA>;

export function parseDaos(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export type DaoState = WithMetadataState<DaoApplications>;

// == Proposals ==

const PROPOSAL_STATUS_SCHEMA = z.union([
  z.object({
    open: z.object({
      votesFor: z.array(ADDRESS_SCHEMA),
      votesAgainst: z.array(ADDRESS_SCHEMA),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    accepted: z.object({
      block: z.number(),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    refused: z.object({
      block: z.number(),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    expired: z.null(),
  }),
]);

export type ProposalStatus = UnionToVariants<
  z.infer<typeof PROPOSAL_STATUS_SCHEMA>
>;

export const PROPOSAL_DATA_SCHEMA = z.union([
  z.object({ globalCustom: z.null() }),
  z.object({ globalParams: z.record(z.unknown()) }),
  z.object({ subnetCustom: z.object({ subnetId: z.number() }) }),
  z.object({
    subnetParams: z.object({
      subnetId: z.number(),
      params: z.record(z.unknown()),
    }),
  }),
  z.object({
    transferDaoTreasury: z.object({
      account: ADDRESS_SCHEMA,
      amount: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
]);

export function parseProposal(valueRaw: Codec): Proposal | null {
  const value = valueRaw.toPrimitive();
  const validated = PROPOSAL_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data;
}

export type ProposalData = UnionToVariants<
  z.infer<typeof PROPOSAL_DATA_SCHEMA>
>;

export interface Proposal {
  id: number;
  proposer: SS58Address;
  expirationBlock: number;
  data: ProposalData;
  status: ProposalStatus;
  metadata: string;
  proposalCost: bigint;
  creationBlock: number;
}

export const PROPOSAL_SCHEMA = z.object({
  id: z.number(),
  proposer: ADDRESS_SCHEMA,
  expirationBlock: z.number(),
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: z.string(),
  proposalCost: TOKEN_AMOUNT_SCHEMA,
  creationBlock: z.number(),
});

assert<Extends<Proposal, z.infer<typeof PROPOSAL_SCHEMA>>>();
assert<Extends<z.infer<typeof PROPOSAL_SCHEMA>, Proposal>>();

export type ProposalState = WithMetadataState<Proposal>;

export interface ProposalCardFields {
  title: string | null;
  body: string | null;
  netuid: number | "GLOBAL";
  invalid?: boolean;
}

// == Field Params ==

const PARAM_FIELD_DISPLAY_NAMES = {
  // # Global
  maxNameLength: "Max Name Length",
  maxAllowedSubnets: "Max Allowed Subnets",
  maxAllowedModules: "Max Allowed Modules",
  unitEmission: "Unit Emission",
  floorDelegationFee: "Floor Delegation Fee",
  maxRegistrationsPerBlock: "Max Registrations Per Block",
  targetRegistrationsPerInterval: "Target Registrations Per Interval",
  targetRegistrationsInterval: "Target Registrations Interval",
  burnRate: "Burn Rate",
  minBurn: "Min Burn",
  maxBurn: "Max Burn",
  adjustmentAlpha: "Adjustment Alpha",
  minStake: "Min Stake",
  maxAllowedWeights: "Max Allowed Weights",
  minWeightStake: "Min Weight Stake",
  proposalCost: "Proposal Cost",
  proposalExpiration: "Proposal Expiration",
  proposalParticipationThreshold: "Proposal Participation Threshold",
  // # Subnet
  founder: "Founder",
  founderShare: "Founder Share",
  immunityPeriod: "Immunity Period",
  incentiveRatio: "Incentive Ratio",
  maxAllowedUids: "Max Allowed UIDs",
  // maxAllowedWeights: "Max Allowed Weights",
  maxStake: "Max Stake",
  maxWeightAge: "Max Weight Age",
  minAllowedWeights: "Min Allowed Weights",
  // minStake: "Min Stake",
  name: "Name",
  tempo: "Tempo",
  trustRatio: "Trust Ratio",
  voteMode: "Vote Mode",
} as const;

export const paramNameToDisplayName = (paramName: string): string => {
  return (
    PARAM_FIELD_DISPLAY_NAMES[
      paramName as keyof typeof PARAM_FIELD_DISPLAY_NAMES
    ] ?? paramName
  );
};

export const SUBSPACE_MODULE_NAME_SCHEMA = z.string();
export const SUBSPACE_MODULE_ADDRESS_SCHEMA = z.string();
export const SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA = z.number();
export const SUBSPACE_MODULE_METADATA_SCHEMA = z.string(); // TODO: validate it's a valid ipfs hash or something (?)
export const SUBSPACE_MODULE_LAST_UPDATE_SCHEMA = z.any();

export const SUBSPACE_MODULE_SCHEMA = z.object({
  netuid: z.number(),
  key: ADDRESS_SCHEMA,
  uid: z.number(),
  name: SUBSPACE_MODULE_NAME_SCHEMA.optional(),
  address: SUBSPACE_MODULE_ADDRESS_SCHEMA.optional(),
  registrationBlock: SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA.optional(),
  metadata: SUBSPACE_MODULE_METADATA_SCHEMA.optional(),
  lastUpdate: SUBSPACE_MODULE_LAST_UPDATE_SCHEMA.optional(),
});

export interface SubspaceModule
  extends z.infer<typeof SUBSPACE_MODULE_SCHEMA> {}

export type OptionalProperties<T> = keyof T extends infer K
  ? K extends keyof T
    ? T[K] extends infer U
      ? U extends undefined
        ? K
        : never
      : never
    : never
  : never;

export const modulePropResolvers: {
  [P in OptionalProperties<SubspaceModule>]: (
    value: Codec,
  ) => z.SafeParseReturnType<any, SubspaceModule[P]>;
} = {
  name: (value: Codec) =>
    SUBSPACE_MODULE_NAME_SCHEMA.safeParse(value.toPrimitive()),
  address: (value: Codec) =>
    SUBSPACE_MODULE_ADDRESS_SCHEMA.safeParse(value.toPrimitive()),
  registrationBlock: (value: Codec) =>
    SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA.safeParse(value.toPrimitive()),
  lastUpdate: (value: Codec) =>
    SUBSPACE_MODULE_LAST_UPDATE_SCHEMA.safeParse(value.toPrimitive()), // not really working right now (Cannot read properties of undefined (reading 'toPrimitive'))
  metadata: (value: Codec) =>
    SUBSPACE_MODULE_METADATA_SCHEMA.safeParse(value.toPrimitive()),
};

export class StorageEntry {
  constructor(private readonly entry: [StorageKey<AnyTuple>, unknown]) {}

  get netuid(): number {
    return this.entry[0].args[0]!.toPrimitive() as number;
  }

  get uidOrKey(): string | number {
    return this.entry[0].args[1]!.toPrimitive() as string | number;
  }

  get value(): Codec {
    return this.entry[1] as Codec;
  }

  /**
   * as the module identifier can be a uid or a key, this function resolves it to a key
   */
  resolveKey(uidKeyMap: Map<number, Map<number, SS58Address>>): SS58Address {
    const isUid = typeof this.uidOrKey === "number";

    const key = isUid
      ? uidKeyMap.get(this.netuid)!.get(this.uidOrKey)!
      : this.uidOrKey;

    assertOrThrow(isSS58(key), `key ${this.netuid}::${key} is an SS58Address`);

    return key;
  }
}

// the value of a "keys" entry is a codec that holds a ss58 address
export function newSubstrateModule(keyEntry: StorageEntry): SubspaceModule {
  const key = keyEntry.value.toPrimitive() as SS58Address;

  return SUBSPACE_MODULE_SCHEMA.parse({
    uid: keyEntry.uidOrKey as number,
    netuid: keyEntry.netuid,
    key,
  });
}
