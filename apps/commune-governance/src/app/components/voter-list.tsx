import React from "react";

import type { ProposalStatus, SS58Address } from "@commune-ts/providers/types";
import { formatToken, smallAddress } from "@commune-ts/providers/utils";

import { SectionHeaderText } from "./section-header-text";

interface VoterListProps {
  proposalStatus: ProposalStatus;
}

interface Voter {
  address: SS58Address;
  status: "In Favor" | "Against";
  stake: bigint;
}

export function VoterList({ proposalStatus }: VoterListProps): JSX.Element {
  const getVoters = (): Voter[] => {
    if ("open" in proposalStatus) {
      const { votesFor, votesAgainst, stakeFor, stakeAgainst } =
        proposalStatus.open;

      const forVoters: Voter[] = votesFor.map((address) => ({
        address,
        status: "In Favor",
        stake: stakeFor / BigInt(votesFor.length),
      }));

      const againstVoters: Voter[] = votesAgainst.map((address) => ({
        address,
        status: "Against",
        stake: stakeAgainst / BigInt(votesAgainst.length),
      }));

      return [...forVoters, ...againstVoters].sort((a, b) =>
        Number(b.stake - a.stake),
      );
    }
    return [];
  };

  const voters = getVoters();

  if (voters.length === 0) {
    return (
      <div className="m-2 h-full animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-[1200ms]">
        <SectionHeaderText text="Voters List" />
        <p>This proposal has no voters yet or is closed.</p>
      </div>
    );
  }

  return (
    <div className="m-2 h-full animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-[1200ms]">
      <SectionHeaderText text="Voters List" />
      <div className="max-h-72 overflow-y-auto">
        {voters.map(({ address, status, stake }, index) => (
          <div key={index} className="mb-2 flex items-end justify-between pr-2">
            <span className="text-white">{smallAddress(address)}</span>
            <div className="flex flex-col items-end">
              <span
                className={
                  status === "In Favor" ? "text-green-500" : "text-red-500"
                }
              >
                {status}
              </span>
              <span className="text-sm text-gray-400">
                {formatToken(Number(stake))} COMAI
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
