import "@polkadot/api-augment";

import { WsProvider } from "@polkadot/api";
import express from "express";
import JSONBigInt from "json-bigint";

import type { LastBlock } from "@commune-ts/subspace/types";
import {
  ApiPromise,
  queryLastBlock,
  queryStakeOut,
} from "@commune-ts/subspace/queries";

const JSONBig = JSONBigInt({
  useNativeBigInt: true,
  alwaysParseAsBig: true,
  strict: true,
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: unknown, ...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
}

const stakeOutData: {
  total: bigint;
  perAddr: Record<string, bigint>;
  perAddrPerNet: Record<number, Record<string, bigint>>;
  atBlock: bigint;
  atTime: Date;
} = {
  total: -1n,
  perAddr: {},
  perAddrPerNet: {},
  atBlock: -1n,
  atTime: new Date(),
};

const stakeOutDataStringfied = {
  data: JSONBig.stringify(stakeOutData),
  atBlock: stakeOutData.atBlock,
};

// as stringify is expensive, we only update it when the block changes to avoid unnecessary work
const getStakeOutDataStringfied = () => {
  if (stakeOutDataStringfied.atBlock !== stakeOutData.atBlock) {
    stakeOutDataStringfied.data = JSONBig.stringify(stakeOutData);
    stakeOutDataStringfied.atBlock = stakeOutData.atBlock;
  }
  return stakeOutDataStringfied.data;
};

async function setup(): Promise<ApiPromise> {
  const wsEndpoint = process.env.NEXT_PUBLIC_WS_PROVIDER_URL;

  log("Connecting to ", wsEndpoint);

  const provider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider });

  return api;
}

async function stakeOutLoop() {
  try {
    const api = await setup();

    let lastBlock: LastBlock;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentTime = new Date();
      lastBlock = await queryLastBlock(api);
      if (lastBlock.blockNumber <= stakeOutData.atBlock) {
        log(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(1000);
        continue;
      }

      log(`Block ${lastBlock.blockNumber}: processing`);

      const data = await queryStakeOut(lastBlock.apiAtBlock);

      const total = data.total;
      const perAddrPerNet: Record<string, Record<string, bigint>> = {};

      for (const [from, toMany] of data.perAddrPerNet.entries()) {
        perAddrPerNet[from] = mapToObj(toMany);
      }
      const perAddr = mapToObj(data.perAddr);

      stakeOutData.total = total;
      stakeOutData.perAddr = perAddr;
      stakeOutData.perAddrPerNet = perAddrPerNet;
      stakeOutData.atBlock = BigInt(lastBlock.blockNumber);
      stakeOutData.atTime = new Date();

      log(
        `Block ${lastBlock.blockNumber}: queryStakeOut in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    }
  } catch (e) {
    log("UNEXPECTED ERROR: ", e);
    log("Restarting loop in 5 seconds");
    await sleep(5000);
    stakeOutLoop().catch(console.error);
    return;
  }
}

function mapToObj<K extends string | number, V>(
  map: Map<K, V>,
): Record<string, V> {
  const obj: Record<string, V> = {};
  for (const [k, v] of map) {
    obj[k as string] = v;
  }
  return obj;
}

stakeOutLoop().catch(console.error);

const app = express();

type Ms = number;

// wait for something, checking if it's ready every interval ms, until maxTime ms have passed
const waitFor = async (
  awaiter: string,
  resourceName: string,
  interval: Ms,
  maxTime: Ms,
  isReady: () => boolean,
  verbose: boolean,
) => {
  let totalTime = 0;
  while (totalTime < maxTime && !isReady()) {
    if (verbose)
      console.log(
        `${awaiter} is waiting for ${resourceName} for ${totalTime / 1000}s`,
      );
    await sleep(interval);
    totalTime += interval;
  }
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/api/stake-out", async (req, res) => {
  const hasData = () => stakeOutData.atBlock !== -1n;

  // if we don't have data yet, wait for it for at most 50s
  await waitFor(
    `request ${req.ip}`,
    "StakeOut data",
    2000,
    50_000,
    hasData,
    true,
  );

  if (!hasData()) {
    res.status(503).send("StakeOut data not available yet");
    return;
  }

  res
    .header("Content-Type", "application/json")
    .send(getStakeOutDataStringfied());
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/api/health/details", (req, res) => {
  res
    .status(200)
    .send({
      status: "ok",
      lastBlock: Number(stakeOutData.atBlock),
      atTime: stakeOutData.atTime,
      deltaSeconds:
        (new Date().getTime() - stakeOutData.atTime.getTime()) / 1000,
    });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
