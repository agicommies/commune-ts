import {
  queryLastBlock,
  queryRegisteredModulesInfo,
} from "@commune-ts/subspace/queries";

import type { WorkerProps } from "../types";
import { BLOCK_TIME, isNewBlock, log, NETUID_ZERO, sleep } from "../common";
import { upsertModuleData } from "../db";

export async function moduleFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const currentTime = new Date();
      const lastBlock = await queryLastBlock(props.api);
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(BLOCK_TIME);
        continue;
      }
      props.lastBlock = lastBlock;

      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const modules = await queryRegisteredModulesInfo(
        props.lastBlock.apiAtBlock,
        ["name", "address", "metadata", "registrationBlock"],
        [NETUID_ZERO],
      );

      log(
        `Block ${props.lastBlock.blockNumber}: upserting  ${modules.length} modules`,
      );

      await upsertModuleData(modules, props.lastBlock.blockNumber);

      log(
        `Block ${props.lastBlock.blockNumber}: module data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}
