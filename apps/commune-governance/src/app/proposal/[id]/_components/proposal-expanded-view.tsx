"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";

import type { ProposalStatus, SS58Address } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { getExpirationTime, smallAddress } from "@commune-ts/providers/utils";

import type { Vote } from "../../../components/vote-label";
import { CreateComment } from "~/app/components/create-comment";
import { ProposalComment } from "~/app/components/proposal-comments";
import { ProposalTypeLabel } from "~/app/components/proposal-type-label";
import { SectionHeaderText } from "~/app/components/section-header-text";
import { VoterList } from "~/app/components/voter-list";
import {
  calcProposalFavorablePercent,
  handleCustomProposal,
  handleProposalVotesAgainst,
  handleProposalVotesInFavor,
} from "../../../../utils";
import { MarkdownView } from "../../../components/markdown-view";
import { StatusLabel } from "../../../components/status-label";
import { VoteCard } from "../../../components/vote-card";
import { VoteLabel } from "../../../components/vote-label";
import { VotingPowerButton } from "../../../components/voting-power-button";

interface CustomContent {
  paramId: number;
}

function renderVoteData(
  favorablePercent: number | null,
  proposalStatus: ProposalStatus,
) {
  if (favorablePercent === null) {
    return (
      <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-1000">
        <SectionHeaderText text="Votes" />
        <p>This proposal has no votes yet or is closed.</p>
      </div>
    );
  }

  const againstPercent = 100 - favorablePercent;
  return (
    <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-1000">
      <SectionHeaderText text="Votes" />
      <div className="flex justify-between">
        <span className="text-sm font-semibold">Favorable</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesInFavor(proposalStatus)} COMAI
          </span>
          <span className="pl-2 text-sm font-semibold text-green-500">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="my-2 w-full bg-section-gray">
        <div
          className="bg-green-400 py-2"
          style={{
            width: `${favorablePercent.toFixed(0)}%`,
          }}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <span className="font-semibold">Against</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesAgainst(proposalStatus)} COMAI
          </span>
          <span className="pl-2 text-sm font-semibold text-red-500">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="my-2 w-full bg-section-gray">
        <div
          className="bg-red-400 py-2"
          style={{
            width: `${againstPercent.toFixed(0)}%`,
          }}
        />
      </div>
    </div>
  );
}

const handleUserVotes = ({
  proposalStatus,
  selectedAccountAddress,
}: {
  proposalStatus: ProposalStatus;
  selectedAccountAddress: SS58Address;
}): Vote => {
  if (!Object.prototype.hasOwnProperty.call(proposalStatus, "open"))
    return "UNVOTED";

  if (
    "open" in proposalStatus &&
    proposalStatus.open.votesFor.includes(selectedAccountAddress)
  ) {
    return "FAVORABLE";
  }
  if (
    "open" in proposalStatus &&
    proposalStatus.open.votesAgainst.includes(selectedAccountAddress)
  ) {
    return "AGAINST";
  }

  return "UNVOTED";
};

export function ProposalExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const { selectedAccount, proposalsWithMeta, isProposalsLoading, lastBlock } =
    useCommune();

  function handleProposalsContent() {
    const proposal = proposalsWithMeta?.find((p) => p.id === paramId);
    if (!proposal) return null;

    const { body, netuid, title, invalid } = handleCustomProposal(proposal);

    const voted = handleUserVotes({
      proposalStatus: proposal.status,
      selectedAccountAddress: selectedAccount?.address as SS58Address,
    });

    const CustomContent = {
      body,
      title,
      netuid,
      invalid,
      id: proposal.id,
      status: proposal.status,
      data: proposal.data,
      author: proposal.proposer,
      expirationBlock: proposal.expirationBlock,
      voted,
    };
    return CustomContent;
  }

  function handleContent() {
    return handleProposalsContent();
  }

  const content = handleContent();

  if (isProposalsLoading || !content)
    return (
      <div className="flex min-h-screen w-full items-center justify-center lg:h-auto">
        <h1 className="text-2xl text-white">Loading...</h1>
        <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="flex h-full w-full flex-col lg:w-2/3">
        <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[50vh] md:min-h-[50vh]">
          <SectionHeaderText
            text={content.title ?? "No Custom Metadata Title"}
          />
          <div className="h-full lg:overflow-auto">
            <MarkdownView source={(content.body as string | undefined) ?? ""} />
          </div>
        </div>
        <div className="w-full">
          <ProposalComment
            proposalId={content.id}
            proposalStatus={content.status}
          />
        </div>
        <div className="m-2 hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md  animate-delay-200 md:flex">
          <CreateComment proposalId={content.id} />
        </div>
      </div>

      <div className="flex flex-col lg:w-1/3">
        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400  backdrop-blur-md animate-delay-200">
          <div className="flex flex-col gap-3">
            <div>
              <span>ID</span>
              <span className="flex items-center text-white">{content.id}</span>
            </div>

            <div>
              <span>Author</span>
              <span className="flex items-center text-white">
                {smallAddress(content.author)}
              </span>
            </div>
            <div>
              <span>Expiration Time</span>
              <span className="flex items-end gap-1 text-white">
                {getExpirationTime(
                  lastBlock?.blockNumber,
                  content.expirationBlock,
                  true,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-300">
          <SectionHeaderText text="Subnet / Status / Type" />
          <div className="flex items-center gap-3">
            <VoteLabel vote={content.voted} />
            <span className="border border-white px-4 py-1.5 text-center text-sm font-medium text-white">
              <span>{content.netuid}</span>
            </span>
            <StatusLabel result={content.status} />
            <ProposalTypeLabel result={content.data} />
          </div>
        </div>

        <div className="m-2 hidden animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-500 md:block">
          <VoteCard proposalId={content.id} voted="UNVOTED" />
        </div>

        <div className="m-2 hidden animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-700 md:block">
          <VotingPowerButton />
        </div>

        {renderVoteData(
          calcProposalFavorablePercent(content.status),
          content.status,
        )}

        <VoterList proposalStatus={content.status} />
      </div>
    </div>
  );
}
