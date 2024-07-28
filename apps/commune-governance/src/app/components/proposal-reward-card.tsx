"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

import { useCommune } from "@commune-ts/providers/use-commune";
import { formatToken } from "@commune-ts/providers/utils";

export default function ProposalRewardCard() {
  const { rewardAllocation } = useCommune();

  if (!rewardAllocation) return null;

  return (
    <div className="flex w-full animate-fade-down border-b border-gray-500 py-2.5">
      <div className="mx-auto flex max-w-screen-md items-center gap-1 px-2">
        <InformationCircleIcon className="h-10 w-10 text-green-500 md:h-5 md:w-5" />
        <p className="text-gray-400">
          Current reward allocation:{" "}
          <span className="text-green-500">
            {formatToken(rewardAllocation)}
          </span>{" "}
          $COMAI
        </p>
      </div>
    </div>
  );
}
