import { BN, stringToHex } from "@polkadot/util";
import { CID } from "multiformats/cid";
import { match } from "rustie";
import { AssertionError } from "tsafe";

import type {
  AnyTuple,
  Api,
  AuthReq,
  Codec,
  CustomDaoMetadata,
  CustomDataError,
  CustomMetadata,
  DaoApplications,
  Entry,
  Proposal,
  RawEntry,
  Result,
  SignedPayload,
  SS58Address,
  StorageKey,
  ZodSchema,
} from "@commune-ts/types";
import {
  CUSTOM_METADATA_SCHEMA,
  DAO_APPLICATIONS_SCHEMA,
  PROPOSAL_SCHEMA,
  URL_SCHEMA,
} from "@commune-ts/types";

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

export const PARAM_FIELD_DISPLAY_NAMES = {
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

// == assertion ==

export function assertOrThrow(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

// == Calc ==

export function bigintDivision(a: bigint, b: bigint, precision = 8n): number {
  if (b === 0n) return NaN;
  const base = 10n ** precision;
  const baseNum = Number(base);
  return (Number(a) * Number(base)) / Number(b) / baseNum;
}

const NANO_MULTIPLIER = new BN("1000000000");

/**
 * Converts a nano value to its standard unit representation
 * @param nanoValue - The value in nano units (as a number, string, or BN)
 * @param decimals - Number of decimal places to round to (default: 6)
 * @returns The value in standard units as a string
 */
export function fromNano(
  nanoValue: number | string | bigint | BN,
  decimals = 9,
): string {
  const bnValue = new BN(nanoValue.toString());
  const integerPart = bnValue.div(NANO_MULTIPLIER);
  const fractionalPart = bnValue.mod(NANO_MULTIPLIER);

  const fractionalStr = fractionalPart.toString().padStart(9, "0");
  const roundedFractionalStr = fractionalStr.slice(0, decimals);

  return `${integerPart.toString()}.${roundedFractionalStr}`;
}

/**
 * Converts a standard unit value to nano
 * @param standardValue - The value in standard units (as a number or string)
 * @returns The value in nano units as a BN
 */
export function toNano(standardValue: number | string): BN {
  const [integerPart, fractionalPart = ""] = standardValue
    .toString()
    .split(".");
  const paddedFractionalPart = fractionalPart.padEnd(9, "0");
  const nanoValue = `${integerPart}${paddedFractionalPart}`;
  return new BN(nanoValue);
}

export function formatToken(nano: number | bigint, decimalPlaces = 2): string {
  const fullPrecisionAmount = fromNano(nano).toString();
  const [integerPart = "0", fractionalPart = ""] =
    fullPrecisionAmount.split(".");

  const formattedIntegerPart = Number(integerPart).toLocaleString("en-US");
  const roundedFractionalPart = fractionalPart
    .slice(0, decimalPlaces)
    .padEnd(decimalPlaces, "0");

  return `${formattedIntegerPart}.${roundedFractionalPart}`;
}

export function calculateAmount(amount: string): number {
  return Math.floor(Number(amount) * 10 ** 9);
}

export function smallAddress(address: string, size?: number): string {
  return `${address.slice(0, size ?? 8)}…${address.slice(size ? size * -1 : -8)}`;
}

// == IPFS ==

export function buildIpfsGatewayUrl(cid: CID): string {
  const cidStr = cid.toString();
  return `https://ipfs.io/ipfs/${cidStr}`;
}

export function parseIpfsUri(uri: string): Result<CID, CustomDataError> {
  const validated = URL_SCHEMA.safeParse(uri);
  if (!validated.success) {
    const message = `Invalid IPFS URI '${uri}'`;
    return { Err: { message } };
  }
  const ipfsPrefix = "ipfs://";
  const rest = uri.startsWith(ipfsPrefix) ? uri.slice(ipfsPrefix.length) : uri;
  try {
    const cid = CID.parse(rest);
    return { Ok: cid };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    const message = `Unable to parse IPFS URI '${uri}'`;
    return { Err: { message } };
  }
}

// == Handlers ==

export function handleEntries<T>(
  rawEntries: RawEntry,
  parser: (value: Codec) => T | null,
): [T[], Error[]] {
  const entries: T[] = [];
  const errors: Error[] = [];
  for (const entry of rawEntries ?? []) {
    const [, valueRaw] = entry;
    const parsedEntry = parser(valueRaw);
    if (parsedEntry == null) {
      errors.push(new Error(`Invalid entry: ${entry.toString()}`));
      continue;
    }
    entries.push(parsedEntry);
  }
  entries.reverse();
  return [entries, errors];
}

export function handleProposals(
  rawProposals: Entry<Codec>[] | undefined,
): [Proposal[], Error[]] {
  return handleEntries(rawProposals, parseProposal);
}

export function handleDaos(
  rawDaos: Entry<Codec>[] | undefined,
): [DaoApplications[], Error[]] {
  return handleEntries(rawDaos, parseDaos);
}

export const copyToClipboard = (text: string) => {
  // @ts-expect-error navigator is a global object
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  navigator.clipboard.writeText(text);
};

// == Time ==

export function getExpirationTime(
  blockNumber: number | undefined,
  expirationBlock: number,
  shouldReturnRemainingTime: boolean,
) {
  if (!blockNumber) return "Unknown";

  const blocksRemaining = expirationBlock - blockNumber;
  const secondsRemaining = blocksRemaining * 8; // 8 seconds per block

  const expirationDate = new Date(Date.now() + secondsRemaining * 1000);
  const currentDate = new Date();

  // Format the date as MM/DD/YYYY
  const month = (expirationDate.getMonth() + 1).toString().padStart(2, "0");
  const day = expirationDate.getDate().toString().padStart(2, "0");
  const year = expirationDate.getFullYear();

  const formattedDate = `${month}/${day}/${year}`;

  // Check if the expiration time has passed
  if (expirationDate <= currentDate) {
    return `${formattedDate} ${shouldReturnRemainingTime ? "(Matured)" : ""}`;
  }

  // Calculate hours remaining
  const hoursRemaining = Math.floor(secondsRemaining / 3600);

  return `${formattedDate} ${shouldReturnRemainingTime ? `(${hoursRemaining} hours)` : ""}`;
}

export interface ChainEntry {
  getMapModules(netuid?: number): Record<string, string>;
}

export type SubspacePalletName =
  | "subspaceModule"
  | "governanceModule"
  | "subnetEmissionModule";

export type SubspaceStorageName =
  | "emission"
  | "incentive"
  | "dividends"
  | "lastUpdate"
  | "metadata"
  | "registrationBlock"
  | "name"
  | "address"
  | "keys"
  | "subnetNames"
  | "immunityPeriod"
  | "minAllowedWeights"
  | "maxAllowedWeights"
  | "tempo"
  | "maxAllowedUids"
  | "founder"
  | "founderShare"
  | "incentiveRatio"
  | "trustRatio"
  | "maxWeightAge"
  | "bondsMovingAverage"
  | "maximumSetWeightCallsPerEpoch"
  | "minValidatorStake"
  | "maxAllowedValidators"
  | "moduleBurnConfig"
  | "subnetMetadata"
  | "subnetGovernanceConfig"
  | "subnetEmission";

// TODO: add MinimumAllowedStake, stakeFrom

export function standardizeUidToSS58address<T extends SubspaceStorageName>(
  outerRecord: Record<T, Record<string, any>>,
  uidToKey: Record<string, SS58Address>,
): Record<T, Record<string, string | number>> {
  const processedRecord: Record<
    T,
    Record<string, string | number>
  > = {} as Record<T, Record<string, string | number>>;

  const entries = Object.entries(outerRecord) as [T, Record<string, any>][];
  for (const [outerKey, innerRecord] of entries) {
    const processedInnerRecord: Record<string, string | number> = {};

    for (const [innerKey, value] of Object.entries(innerRecord)) {
      if (!isNaN(Number(innerKey))) {
        const newKey = uidToKey[innerKey];
        if (newKey !== undefined) {
          processedInnerRecord[newKey] = value;
        }
      } else {
        processedInnerRecord[innerKey] = value;
      }
    }

    processedRecord[outerKey] = processedInnerRecord;
  }

  return processedRecord;
}

type StorageTypes = "VecMapping" | "DoubleMap" | "SimpleMap";

export function getSubspaceStorageMappingKind(
  prop: SubspaceStorageName,
): StorageTypes | null {
  const vecProps: SubspaceStorageName[] = [
    "emission",
    "incentive",
    "dividends",
    "lastUpdate",
  ];
  const doubleMapProps: SubspaceStorageName[] = [
    "metadata",
    "registrationBlock",
    "name",
    "address",
    "keys",
  ];
  const simpleMapProps: SubspaceStorageName[] = [
    "minAllowedWeights",
    "maxWeightAge",
    "maxAllowedWeights",
    "trustRatio",
    "tempo",
    "founderShare",
    "subnetNames",
    "immunityPeriod",
    "maxAllowedUids",
    "founder",
    "incentiveRatio",
    "bondsMovingAverage",
    "maximumSetWeightCallsPerEpoch",
    "minValidatorStake",
    "maxAllowedValidators",
    "moduleBurnConfig",
    "subnetMetadata",
    "subnetGovernanceConfig",
    "subnetEmission",
  ];
  const mapping = {
    VecMapping: vecProps,
    DoubleMap: doubleMapProps,
    SimpleMap: simpleMapProps,
  };
  if (mapping.VecMapping.includes(prop)) return "VecMapping";
  else if (mapping.DoubleMap.includes(prop)) return "DoubleMap";
  else if (mapping.SimpleMap.includes(prop)) return "SimpleMap";
  else return null;
}

export async function getPropsToMap(
  props: Partial<Record<SubspacePalletName, SubspaceStorageName[]>>,
  api: Api,
  netuid?: number,
): Promise<Record<SubspaceStorageName, ChainEntry>> {
  const mapped_prop_entries: Record<SubspaceStorageName, ChainEntry> =
    {} as Record<SubspaceStorageName, ChainEntry>;

  for (const [palletName, storageNames] of Object.entries(props)) {
    const asyncOperations = storageNames.map(async (storageName) => {
      const value = getSubspaceStorageMappingKind(storageName);

      if (value === "VecMapping") {
        const entries = await api.query[palletName]?.[storageName]?.entries();

        if (entries === undefined) {
          console.log(`No entries for ${palletName}.${storageName}`);
          // TODO: panic
          process.exit(1);
        }
        mapped_prop_entries[storageName] = new StorageVecMap(entries);
      } else if (value === "DoubleMap") {
        const entries =
          await api.query[palletName]?.[storageName]?.entries(netuid);

        if (entries === undefined) {
          console.log(`No entries for ${palletName}.${storageName}`);
          // TODO: panic
          process.exit(1);
        }
        mapped_prop_entries[storageName] = new DoubleMapEntries(entries);
      } else if (value === "SimpleMap") {
        const entries = await api.query[palletName]?.[storageName]?.entries();

        if (entries === undefined) {
          console.log(`No entries for ${palletName}.${storageName}`);
          // TODO: panic
          process.exit(1);
        }
        mapped_prop_entries[storageName] = new SimpleMap(entries);
      }
    });

    await Promise.all(asyncOperations);
  }

  return mapped_prop_entries;
}

export class StorageVecMap implements ChainEntry {
  constructor(private readonly entry: [StorageKey<AnyTuple>, Codec][]) {}

  getMapModules(netuid: number) {
    if (netuid === undefined) {
      throw new Error("netuid is required for StorageVecMap");
    }
    const subnet_values = this.entry[netuid];
    if (subnet_values != undefined) {
      const values = subnet_values[1].toPrimitive() as string[];
      const modules_map = Object.fromEntries(
        values.map((value, index) => [index, value]),
      );
      return modules_map;
    } else return {};
  }
}

export class SimpleMap implements ChainEntry {
  constructor(private readonly entry: [StorageKey<AnyTuple>, Codec][]) {}

  getMapModules() {
    const modules_map = Object.fromEntries(
      this.entry.map((value, index) => [index, value[1].toPrimitive()]),
    );
    return modules_map as Record<string, string>;
  }
}

export class DoubleMapEntries implements ChainEntry {
  constructor(private readonly entries: [StorageKey<AnyTuple>, Codec][]) {}
  getMapModules() {
    const moduleIdToPropValue: Record<number, string> = {};

    this.entries.forEach((entry) => {
      const moduleCodec = entry[1];
      const moduleId = entry[0].args[1]?.toPrimitive() as number;
      moduleIdToPropValue[moduleId] = moduleCodec.toPrimitive() as string;
    });
    return moduleIdToPropValue;
  }
}

export function parseAddress(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export function parseDaos(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export function parseProposal(valueRaw: Codec): Proposal | null {
  const value = valueRaw.toPrimitive();
  const validated = PROPOSAL_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data;
}

export const paramNameToDisplayName = (paramName: string): string => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PARAM_FIELD_DISPLAY_NAMES[
      paramName as keyof typeof PARAM_FIELD_DISPLAY_NAMES
    ] ?? paramName
  );
};

export const isNotNull = <T>(item: T | null): item is T => item !== null;

export function removeEmojis(text: string): string {
  const emojiPattern =
    /[\u{1F000}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F191}-\u{1F251}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}-\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu;

  return text.replace(emojiPattern, "");
}

export function appendErrorInfo(
  error: CustomDataError,
  info: string,
  sep = " ",
): CustomDataError {
  const old_info = error.message;
  const message = old_info + sep + info;
  return { message };
}

export async function processMetadata(
  url: string,
  zodSchema: ZodSchema,
  entryId: number,
  kind?: string,
) {
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const validated = zodSchema.safeParse(obj);
  if (!validated.success) {
    const message = `Invalid metadata for ${kind} ${entryId} at ${url}`;
    return { Err: { message } };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { Ok: validated.data };
}

export async function processProposalMetadata(url: string, entryId: number) {
  return await processMetadata(
    url,
    CUSTOM_METADATA_SCHEMA,
    entryId,
    "proposal",
  );
}
export async function processDaoMetadata(
  url: string,
  entryId: number,
): Promise<Result<CustomDaoMetadata, CustomDataError>> {
  return await processMetadata(url, CUSTOM_METADATA_SCHEMA, entryId, "dao");
}
export async function fetchCustomMetadata(
  kind: "proposal" | "dao",
  entryId: number,
  metadataField: string,
): Promise<Result<CustomMetadata, CustomDataError>> {
  const r = parseIpfsUri(metadataField);

  const result = match(r)({
    async Ok(cid): Promise<Result<CustomMetadata, CustomDataError>> {
      const url = buildIpfsGatewayUrl(cid); // this is wrong
      const metadata =
        kind == "proposal"
          ? await processProposalMetadata(url, entryId)
          : await processDaoMetadata(url, entryId);
      return metadata;
    },
    async Err(err_message) {
      return Promise.resolve({
        Err: appendErrorInfo(err_message, `for ${kind} ${entryId}`),
      });
    },
  });
  return result;
}

export function flattenResult<T, E>(x: Result<T, E>): T | null {
  return match(x)({
    Ok(r) {
      return r;
    },
    Err() {
      return null;
    },
  });
}

// ==== Auth ====

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function createAuthReqData(uri: string): AuthReq {
  return {
    statement: `Sign in with Polkadot extension to authenticate your session at ${uri}`,
    uri,
    nonce: generateNonce(),
    created: new Date().toISOString(),
  };
}

export const signData = async <T>(
  signer: (
    msgHex: `0x${string}`,
  ) => Promise<{ signature: `0x${string}`; address: string }>,
  data: T,
): Promise<SignedPayload> => {
  const dataHex = stringToHex(JSON.stringify(data));
  const { signature, address } = await signer(dataHex);
  return {
    payload: dataHex,
    signature,
    address,
  };
};
