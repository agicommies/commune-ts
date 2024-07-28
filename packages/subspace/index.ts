import "@polkadot/api-augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import {
  getRewardAllocation,
  queryBalance,
  queryDaoTreasuryAddress,
  queryGlobalGovernanceConfig,
  queryUnrewardedProposals,
} from "./queries";
import { SS58Address } from "./types";

// == To run this file: npx tsx index.ts ==

console.log("Hello from Subspace!");

// == Start API ==

const wsProvider = new WsProvider(
  "wss://testnet-commune-api-node-1.communeai.net",
);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");

const balance = await queryDaoTreasuryAddress(api).then((result) =>
  queryBalance(api, result as SS58Address),
);

const governanceConfig = await queryGlobalGovernanceConfig(api);

console.log(
  "getRewardAllocation",
  getRewardAllocation(balance, governanceConfig),
);

console.log("queryUnrewardedProposals", await queryUnrewardedProposals(api));
