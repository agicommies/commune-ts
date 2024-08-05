import { CID } from "multiformats/cid";
import { AssertionError } from "tsafe";

import type {
  Codec,
  DaoApplications,
  Entry,
  Proposal,
  RawEntry,
} from "@commune-ts/subspace/types";
import { parseDaos, parseProposal, URL_SCHEMA } from "@commune-ts/subspace/types";

// == assertion ==

export function assertOrThrow(
  condition: any,
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
  return Number((a * base) / b) / baseNum;
}

export function fromNano(nano: number | bigint): number {
  if (typeof nano === "bigint") return bigintDivision(nano, 1_000_000_000n);
  return nano / 1_000_000_000;
}

export function formatToken(nano: number | bigint): string {
  const amount = fromNano(nano);
  return amount.toFixed(2);
}

export function calculateAmount(amount: string): number {
  return Math.floor(Number(amount) * 10 ** 9);
}

export function smallAddress(address: string, size?: number): string {
  return `${address.slice(0, size || 8)}…${address.slice(size ? size * -1 : -8)}`;
}

// == IPFS ==

export function parseIpfsUri(uri: string): CID | null {
  const validated = URL_SCHEMA.safeParse(uri);
  if (!validated.success) {
    return null;
  }
  const ipfsPrefix = "ipfs://";
  const rest = uri.startsWith(ipfsPrefix) ? uri.slice(ipfsPrefix.length) : uri;
  try {
    const cid = CID.parse(rest);
    return cid;
  } catch (e) {
    return null;
  }
}

export function buildIpfsGatewayUrl(cid: CID): string {
  const cidStr = cid.toString();
  return `https://ipfs.io/ipfs/${cidStr}`;
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
  // @ts-ignore
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
    return `${formattedDate} ${shouldReturnRemainingTime ? "(Expired)" : ""}`;
  }

  // Calculate hours remaining
  const hoursRemaining = Math.floor(secondsRemaining / 3600);

  return `${formattedDate} ${shouldReturnRemainingTime ? `(${hoursRemaining} hours)` : ""}`;
}
