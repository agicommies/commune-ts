import "@polkadot/api-augment";

import { WsProvider } from "@polkadot/api";
import express from "express";

import type { SQL, Table } from "@commune-ts/db";
import type { LastBlock, SubspaceModule } from "@commune-ts/subspace/types";
import { getTableColumns, sql } from "@commune-ts/db";
import { db } from "@commune-ts/db/client";
import { moduleData } from "@commune-ts/db/schema";
import {
  ApiPromise,
  queryLastBlock,
  queryRegisteredModulesInfo,
} from "@commune-ts/subspace/queries";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(...args: unknown[]) {
  const [first, ...rest] = args;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${new Date().toISOString()}] ${first}`, ...rest);
}

const NETUID_ZERO = 0;

async function setup(): Promise<ApiPromise> {
  const wsEndpoint = process.env.NEXT_PUBLIC_WS_PROVIDER_URL;

  log("Connecting to ", wsEndpoint);

  const provider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider });

  return api;
}

async function main() {
  const api = await setup();

  let lastBlockNumber = -1;
  let lastBlock: LastBlock;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const currentTime = new Date();
      lastBlock = await queryLastBlock(api);
      if (lastBlock.blockNumber === lastBlockNumber) {
        log(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(1000);
        continue;
      }
      lastBlockNumber = lastBlock.blockNumber;

      log(`Block ${lastBlock.blockNumber}: processing`);

      const modules = await queryRegisteredModulesInfo(
        lastBlock.apiAtBlock,
        ["name", "address", "metadata", "registrationBlock"],
        [NETUID_ZERO],
      );

      log(
        `Block ${lastBlock.blockNumber}: upserting  ${modules.length} modules`,
      );

      await upsertModuleData(modules, lastBlock.blockNumber);

      log(
        `Block ${lastBlock.blockNumber}: module data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(1000);
      continue;
    }
  }
}

async function upsertModuleData(modules: SubspaceModule[], atBlock: number) {
  await db
    .insert(moduleData)
    .values(
      modules.map((m) => ({
        netuid: m.netuid,
        moduleKey: m.key,
        name: m.name,
        atBlock,
        addressUri: m.address,
        metadataUri: m.metadata,
        registrationBlock: m.registrationBlock,
      })),
    )
    .onConflictDoUpdate({
      target: [moduleData.netuid, moduleData.moduleKey],
      set: buildConflictUpdateColumns(moduleData, [
        "atBlock",
        "addressUri",
        "metadataUri",
        "registrationBlock",
        "name",
      ]),
    })
    .execute();
}

// util for upsert https://orm.drizzle.team/learn/guides/upsert#postgresql-and-sqlite
function buildConflictUpdateColumns<
  T extends Table,
  Q extends keyof T["_"]["columns"],
>(table: T, columns: Q[]): Record<Q, SQL> {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const colName = cls[column]?.name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit());

const app = express();

app.get("/api/health", (_, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  log(`/helth listening on port ${port}`);
});
