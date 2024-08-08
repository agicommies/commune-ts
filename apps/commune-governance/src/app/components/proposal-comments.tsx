"use client";

import { useState } from "react";
import {
  ArrowPathIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  UserIcon,
} from "@heroicons/react/20/solid";

import type { ProposalStatus, SS58Address } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { toast } from "@commune-ts/providers/use-toast";
import { formatToken, smallAddress } from "@commune-ts/providers/utils";

import { api } from "~/trpc/react";

export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}

export function ProposalComment({
  proposalId,
  proposalStatus,
}: {
  proposalId: number;
  proposalStatus: ProposalStatus;
}) {
  const { selectedAccount } = useCommune();
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, VoteType | null>>(
    {},
  );

  function getVoterStake(address: SS58Address) {
    if (!selectedAccount?.address) return null;
    if ("open" in proposalStatus) {
      const { votesFor, votesAgainst, stakeFor, stakeAgainst } =
        proposalStatus.open;

      if (votesFor.includes(address)) {
        return stakeFor / BigInt(votesFor.length);
      }

      if (votesAgainst.includes(address)) {
        return stakeAgainst / BigInt(votesAgainst.length);
      }
    }
    return null;
  }

  const {
    data: proposalComments,
    error,
    isLoading,
    refetch,
  } = api.proposalComment.byId.useQuery(
    { proposalId },
    { enabled: !!proposalId },
  );

  const { data: userVotes } = api.proposalComment.byUserId.useQuery(
    { proposalId, userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address && !!proposalId },
  );

  const castVoteMutation = api.proposalComment.castVote.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteVoteMutation = api.proposalComment.deleteVote.useMutation({
    onSuccess: () => refetch(),
  });

  if (error) {
    console.error("Error fetching proposal comments:", error);
  }

  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center lg:h-auto">
        <h1 className="text-2xl text-white">Loading...</h1>
        <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  const handleVote = async (commentId: string, voteType: VoteType) => {
    if (!selectedAccount?.address) {
      return toast.error("Please connect your wallet to vote");
    }

    setVotingCommentId(commentId);

    try {
      const comment = proposalComments?.find((c) => c.id === commentId);
      if (!comment) return;

      const currentVote = localVotes[commentId] ?? userVotes?.[commentId];

      if (currentVote === voteType) {
        await deleteVoteMutation.mutateAsync({
          commentId,
          userKey: selectedAccount.address,
        });
        setLocalVotes((prev) => ({ ...prev, [commentId]: null }));
      } else {
        await castVoteMutation.mutateAsync({
          commentId,
          userKey: selectedAccount.address,
          voteType,
        });
        setLocalVotes((prev) => ({ ...prev, [commentId]: voteType }));
      }
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setVotingCommentId(null);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <div className="m-2 flex h-full min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md animate-delay-200">
        <div className="mb-4 w-full border-b border-gray-500 border-white/20 pb-2 text-gray-400">
          <h2 className="text-start text-lg font-semibold">
            Community Comments
          </h2>
        </div>
        {proposalComments?.length ? (
          <div className="flex max-h-[25vh] w-full flex-col gap-3 overflow-auto pb-3 pr-2">
            {proposalComments.map((comment) => (
              <div
                key={comment.id}
                className="flex w-full flex-col gap-2 border border-white/20 bg-[#898989]/5 p-2"
              >
                <div className="flex justify-between border-b border-white/20 px-2 py-1 pb-2">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />{" "}
                    {smallAddress(comment.userKey)}
                    <span className="ml-2 text-sm text-gray-400">
                      {formatToken(
                        Number(getVoterStake(comment.userKey as SS58Address)),
                      )}{" "}
                      COMAI
                    </span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleVote(comment.id, VoteType.UP)}
                      disabled={
                        votingCommentId === comment.id ||
                        !selectedAccount?.address
                      }
                      className={`flex items-center ${
                        (localVotes[comment.id] ?? userVotes?.[comment.id]) ===
                        VoteType.UP
                          ? "text-green-500"
                          : ""
                      }`}
                    >
                      <ChevronDoubleUpIcon className="h-5 w-5" />
                      <span>{comment.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(comment.id, VoteType.DOWN)}
                      disabled={
                        votingCommentId === comment.id ||
                        !selectedAccount?.address
                      }
                      className={`flex items-center ${
                        (localVotes[comment.id] ?? userVotes?.[comment.id]) ===
                        VoteType.DOWN
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      <ChevronDoubleDownIcon className="h-5 w-5" />
                      <span>{comment.downvotes}</span>
                    </button>
                  </div>
                </div>
                <p className="p-2">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No comments yet</p>
        )}
      </div>
    </div>
  );
}
