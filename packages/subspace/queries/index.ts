import "@polkadot/api-augment";

import { ApiPromise } from "@polkadot/api";

import {
  Api,
  isSS58,
  LastBlock,
  SS58Address,
  SubspaceModule,
  SUBSPACE_MODULE_SCHEMA,
  OptionalProperties,
  modulePropResolvers, StorageEntry, newSubstrateModule } from "@commune-ts/subspace/types";
import { assertOrThrow, handleDaos, handleProposals } from "@commune-ts/subspace/utils";

export { ApiPromise };

// == chain ==

export async function queryLastBlock(api: ApiPromise): Promise<LastBlock> {
  const blockHeader = await api.rpc.chain.getHeader();
  const blockNumber = blockHeader.number.toNumber();
  const blockHash = blockHeader.hash;
  const blockHashHex = blockHash.toHex();
  const apiAtBlock = await api.at(blockHeader.hash);
  return {
    blockHeader,
    blockNumber,
    blockHash,
    blockHashHex,
    apiAtBlock,
  };
}

// == system ==

export async function queryBalance(api: Api, address: SS58Address | string) {
  if (!isSS58(address)) {
    throw new Error("Invalid address format, expected SS58");
  }
  const {
    data: { free: freeBalance },
  } = (await api.query.system!.account(address)) || {};
  return BigInt(freeBalance.toString());
}

// == governanceModule ==

export async function queryProposalsEntries(api: Api) {
  const proposalsQuery = await api.query.governanceModule?.proposals?.entries();

  const [proposals, proposalsErrs] = handleProposals(proposalsQuery);
  for (const err of proposalsErrs) {
    console.error(err);
  }

  return proposals;
}

export async function queryDaosEntries(api: Api) {
  const daosQuery =
    await api.query.governanceModule?.curatorApplications?.entries();

  const [daos, daosErrs] = handleDaos(daosQuery);
  for (const err of daosErrs) {
    console.error(err);
  }

  return daos;
}

export async function queryDaoTreasuryAddress(api: Api) {
  return api.query.governanceModule
    ?.daoTreasuryAddress?.()
    .then((address) => address.toHuman() as SS58Address);
}

export async function queryNotDelegatingVotingPower(
  api: Api,
): Promise<string[] | undefined> {
  return api.query.governanceModule
    ?.notDelegatingVotingPower?.()
    .then((power) => power.toHuman() as SS58Address[]);
}

// == subspaceModule ==

export async function queryStakeOut(api: Api) {
  const stakeToQuery = await api.query.subspaceModule?.stakeTo?.entries();

  if (!stakeToQuery) {
    throw new Error("stakeTo is probably undefined");
  }

  let total = 0n;
  const perAddr = new Map<string, bigint>();
  const perAddrPerNet = new Map<string, Map<string, bigint>>();

  for (const [keyRaw, valueRaw] of stakeToQuery) {
    const [fromAddrRaw, toAddrRaw] = keyRaw.args;
    const fromAddr = fromAddrRaw!.toString();
    const toAddr = toAddrRaw!.toString();

    const staked = BigInt(valueRaw.toString());

    total += staked;
    perAddr.set(fromAddr, (perAddr.get(fromAddr) ?? 0n) + staked);

    const mapTo = perAddrPerNet.get(fromAddr) ?? new Map<string, bigint>();
    mapTo.set(toAddr, (mapTo.get(toAddr) ?? 0n) + staked);
    perAddrPerNet.set(fromAddr, mapTo);
  }

  return {
    total,
    perAddr,
    perAddrPerNet,
  };
}
// === modules ===

/**
 * @param api
 * @param extraProps if empty, only the required properties are returned (netuid, uid, key)
 * @param netuidWhitelist if empty, modules from all subnets are returned
 */
export async function queryRegisteredModulesInfo<
  P extends OptionalProperties<SubspaceModule>,
>(
  api: Api,
  extraProps: P[] = [],
  netuidWhitelist?: number[],
): Promise<SubspaceModule[]> {
  netuidWhitelist = netuidWhitelist?.length
    ? Array.from(new Set(netuidWhitelist))
    : undefined;

  console.log("Fetching module keys from the chain...");

  const keyEntries = (await api.query.subspaceModule!.keys!.entries())
    .map((entry) => new StorageEntry(entry))
    .filter(
      (entry: StorageEntry) =>
        !netuidWhitelist || netuidWhitelist.includes(entry.netuid),
    );

  console.log(`Fetched ${keyEntries.length} module keys`);

  const modulesMap = newSubstrateModuleMap(keyEntries.map(newSubstrateModule));

  await enrichSubspaceModules(api, modulesMap, extraProps, netuidWhitelist);

  console.log("modules per netuid:");
  for (const [netuid, map] of modulesMap) {
    console.log(`netuid ${netuid}: ${map.size} modules`);
  }

  const modules = Array.from(modulesMap.values()).flatMap((map) =>
    Array.from(map.values()),
  );

  return modules
    .map((m) => SUBSPACE_MODULE_SCHEMA.safeParse(m))
    .filter(
      (parsed) =>
        parsed.success || console.error("UNEXPECTED ERROR: ", parsed.error),
    )
    .map((parsed) => parsed.data!);
}

/**
 * enriches the modules fetching the properties in `props`
 *
 * @returns the same moduleMap passed as argument
 */
async function enrichSubspaceModules<
  P extends OptionalProperties<SubspaceModule>,
>(
  api: Api,
  moduleMap: Map<number, Map<SS58Address, SubspaceModule>>,
  props: P[],
  netuidWhitelist?: number[] | undefined,
): Promise<Map<number, Map<SS58Address, SubspaceModule>>> {
  if (props.length === 0) {
    return moduleMap;
  }
  props = Array.from(new Set(props));

  const uidKeyMap = newUidKeyMap(moduleMap);

  await Promise.all(
    props.map(async (prop) => {
      console.log(`Fetching "${prop}" entries...`);
      const entries = (await api.query.subspaceModule?.[prop]?.entries())
        ?.map((entry) => new StorageEntry(entry))
        .filter(
          (entry: StorageEntry) =>
            !netuidWhitelist || netuidWhitelist.includes(entry.netuid),
        );

      assertOrThrow(Array.isArray(entries), `entries of "${prop}" is an array`);

      console.log(`Fetched ${entries?.length} "${prop}" entries`);

      for (const entry of entries) {
        const netuid = entry.netuid;
        const key = entry.resolveKey(uidKeyMap);

        const module = moduleMap.get(netuid)?.get(key);

        if (!module) {
          if (process.env.DEBUG === "true") {
            console.info(
              `WARNING: while resolving "${prop}", key ${netuid}::${key} not found in moduleMap`,
            );
          }
          continue;
        }

        const parsedValue = modulePropResolvers[prop](entry.value);

        if (!parsedValue.success) {
          console.error(
            `Error parsing "${prop}" for module ${netuid}::${key} - fallback to undefined`,
          );
          console.error(parsedValue.error);
          continue;
        }

        module[prop] = parsedValue.data;
      }
    }),
  );

  return moduleMap;
}

/**
 * maps netuid -> uid -> key
 */
function newUidKeyMap(
  moduleMap: Map<number, Map<SS58Address, SubspaceModule>>,
): Map<number, Map<number, SS58Address>> {
  const uidKeyMap = new Map<number, Map<number, SS58Address>>();

  for (const [netuid, keyMap] of moduleMap) {
    if (!uidKeyMap.has(netuid)) {
      uidKeyMap.set(netuid, new Map());
    }

    for (const [key, module] of keyMap) {
      uidKeyMap.get(netuid)!.set(module.uid, key);
    }
  }

  return uidKeyMap;
}

/**
 * maps netuid -> key -> SubspaceModule
 */
function newSubstrateModuleMap(
  subspaceModules: SubspaceModule[],
): Map<number, Map<SS58Address, SubspaceModule>> {
  const moduleMap = new Map<number, Map<SS58Address, SubspaceModule>>();

  for (const module of subspaceModules) {
    if (!moduleMap.has(module.netuid)) {
      moduleMap.set(module.netuid, new Map());
    }

    moduleMap.get(module.netuid)!.set(module.key, module);
  }

  return moduleMap;
}
