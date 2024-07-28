import { match } from "rustie";

import type { ProposalStatus } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";

import { Label } from "./label";

interface RewardLabelProps {
  result: ProposalStatus;
  proposalId: number;
  className?: string;
}

export function RewardLabel(props: RewardLabelProps): JSX.Element {
  const { result, proposalId, className = "" } = props;
  const { unrewardedProposals } = useCommune();

  const isUnrewarded = unrewardedProposals?.includes(proposalId);

  return match(result)({
    open() {
      return (
        <Label
          className={`w-auto border border-purple-500 bg-purple-500/10 py-1.5 text-center text-purple-500 lg:text-left ${className}`}
        >
          To Be Rewarded
        </Label>
      );
    },
    accepted() {
      return (
        <Label
          className={`w-auto border ${
            isUnrewarded
              ? "border-purple-500 bg-purple-500/10 text-purple-500"
              : "border-green-500 bg-green-500/10 text-green-500"
          } py-1.5 text-center lg:text-left ${className}`}
        >
          {isUnrewarded ? "To Be Rewarded" : "Rewarded"}
        </Label>
      );
    },
    expired() {
      return (
        <Label
          className={`w-auto border ${
            isUnrewarded
              ? "border-purple-500 bg-purple-500/10 text-purple-500"
              : "border-green-500 bg-green-500/10 text-green-500"
          } py-1.5 text-center lg:text-left ${className}`}
        >
          {isUnrewarded ? "To Be Rewarded" : "Rewarded"}
        </Label>
      );
    },
    refused() {
      return (
        <Label
          className={`w-auto border ${
            isUnrewarded
              ? "border-purple-500 bg-purple-500/10 text-purple-500"
              : "border-green-500 bg-green-500/10 text-green-500"
          } py-1.5 text-center lg:text-left ${className}`}
        >
          {isUnrewarded ? "To Be Rewarded" : "Rewarded"}
        </Label>
      );
    },
  });
}
