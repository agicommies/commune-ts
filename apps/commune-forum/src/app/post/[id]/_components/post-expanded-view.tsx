"use client";

// import { ArrowPathIcon } from "@heroicons/react/20/solid";

import { useCommune } from "@commune-ts/providers/use-commune";
import { MarkdownView } from "@commune-ts/ui/markdown-view";
import {
  removeEmojis,
  // smallAddress,
} from "@commune-ts/utils";

import {
  handleCustomProposal,
} from "../../../../utils";
import { SectionHeaderText } from "~/app/components/section-header-text";

interface CustomContent {
  paramId: number;
}

export function ProposalExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const {
    proposalsWithMeta,
    // isProposalsLoading 
  } =
    useCommune();

  function handleProposalsContent() {
    const proposal = proposalsWithMeta?.find((p) => p.id === paramId);
    if (!proposal) return null;

    const { body, netuid, title, invalid } = handleCustomProposal(proposal);

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
    };
    return CustomContent;
  }

  function handleContent() {
    return handleProposalsContent();
  }

  const content = handleContent();

  // if (isProposalsLoading || !content)
  //   return (
  //     <div className="flex min-h-screen w-full items-center justify-center lg:h-auto">
  //       <h1 className="text-2xl text-white">Loading...</h1>
  //       <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
  //     </div>
  //   );

  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="flex h-full w-full flex-col lg:w-2/3">
        <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[60vh] md:min-h-[50vh]">
          <SectionHeaderText
            text={content?.title ?? "No Custom Metadata Title"}
          />
          <div className="h-full lg:overflow-auto">
            <MarkdownView source={removeEmojis(content?.body ?? "")} />
          </div>
        </div>
        {/* <div className="w-full">
          <ViewComment modeType="PROPOSAL" proposalId={content.id} />
        </div>
        <div className="m-2 hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md  animate-delay-200 md:flex">
          <CreateComment proposalId={content.id} ModeType="PROPOSAL" />
        </div> */}
      </div>

      <div className="flex flex-col lg:w-1/3">
        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400  backdrop-blur-md animate-delay-200">
          <div className="flex flex-col gap-3">
            <div>
              <span>ID</span>
              <span className="flex items-center text-white">{content?.id}</span>
            </div>
            <div>
              <span>Author</span>
              <span className="flex items-center text-white">
                {/* {smallAddress(content?.author)} */}
                Adidas
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
