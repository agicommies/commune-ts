"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";

import type { DaoStatus } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { smallAddress } from "@commune-ts/providers/utils";

import { handleCustomDaos } from "../../../../utils";
import { DaoStatusLabel } from "../../../components/dao-status-label";
import { MarkdownView } from "../../../components/markdown-view";

interface CustomContent {
  paramId: number;
}

export function DaoExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const { daosWithMeta, isDaosLoading } = useCommune();

  function handleDaosContent() {
    const dao = daosWithMeta?.find((d) => d.id === paramId);
    if (!dao) return null;

    const { body, title } = handleCustomDaos(dao.id, dao.customData ?? null);

    const daoContent = {
      body,
      title,
      status: dao.status,
      author: dao.userId,
      id: dao.id,
    };
    return daoContent;
  }

  const content = handleDaosContent();

  if (isDaosLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-2xl text-white">Loading...</h1>
        <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );
  console.log(content);

  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="m-2 flex h-fit animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[77.5vh] md:min-h-[77.5vh] lg:w-2/3">
        <div className="mb-8 border-b border-gray-500 border-white/20 pb-2">
          <h2 className="text-lg font-semibold">{content.title}</h2>
        </div>
        <div className="h-full lg:overflow-auto">
          <MarkdownView source={(content.body as string | undefined) ?? ""} />
        </div>
      </div>

      <div className="flex flex-col lg:w-1/3">
        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400  backdrop-blur-md animate-delay-200">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-gray-500">ID</span>
              <span className="flex items-center text-white">{content.id}</span>
            </div>

            <div>
              <span className="text-gray-500">Author</span>
              <span className="flex items-center text-white">
                {smallAddress(content.author, 16)}
              </span>
            </div>
          </div>
        </div>
        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400  backdrop-blur-md animate-delay-200">
          <div className="flex items-center gap-3">
            <DaoStatusLabel result={content.status as DaoStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}
