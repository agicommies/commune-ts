import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { Header } from "@polkadot/types/interfaces";
import type { Codec, IU8a } from "@polkadot/types/types";
import type { Enum, Tagged } from "rustie";
import { Variant } from "rustie/dist/enum";
import { z } from "zod";

import {
  CUSTOM_METADATA_SCHEMA,
  DAO_APPLICATIONS_SCHEMA,
  PROPOSAL_DATA_SCHEMA,
  PROPOSAL_STATUS_SCHEMA,
  SUBSPACE_MODULE_SCHEMA,
} from "./validations";

export type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

export type { ApiPromise } from "@polkadot/api";
export type { StorageKey } from "@polkadot/types";
export type { AnyTuple, Codec } from "@polkadot/types/types";

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

export type UnionToVariants<T> =
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

export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;

export interface CustomDataError {
  message: string;
}

export type CustomMetadataState = Result<CustomMetadata, CustomDataError>;
export type WithMetadataState<T> = T & { customData?: CustomMetadataState };

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

export interface addTransferDaoTreasuryProposal {
  IpfsHash: string;
  value: string;
  dest: string;
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

// == DAO Applications ==

export type DaoStatus = "Pending" | "Accepted" | "Refused";

export type DaoApplications = z.infer<typeof DAO_APPLICATIONS_SCHEMA>;

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export type DaoState = WithMetadataState<DaoApplications>;

// == Proposals ==

export type ProposalStatus = UnionToVariants<
  z.infer<typeof PROPOSAL_STATUS_SCHEMA>
>;

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

export type ProposalState = WithMetadataState<Proposal>;

export interface ProposalCardFields {
  title: string | null;
  body: string | null;
  netuid: number | "GLOBAL";
  invalid?: boolean;
}

export interface UnrewardedProposal {
  subnetId: number;
  block: bigint;
  votesFor: Map<SS58Address, bigint>;
  votesAgainst: Map<SS58Address, bigint>;
}

// == Field Params ==

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