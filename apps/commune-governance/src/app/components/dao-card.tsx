import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

import type { DaoState } from "@commune-ts/providers/types";
import { smallAddress } from "@commune-ts/providers/utils";

import { handleCustomDaos } from "../../utils";
import { Card } from "./card";
import { DaoStatusLabel } from "./dao-status-label";
import { MarkdownView } from "./markdown-view";
import { Skeleton } from "./skeleton";

interface DaoCardProps {
  daoState: DaoState;
}

export function DaoCard(props: DaoCardProps): JSX.Element {
  const { daoState } = props;
  const { body, title } = handleCustomDaos(
    daoState.id,
    daoState.customData ?? null,
  );

  return (
    <Card.Root className="animate-fade-in-down" key={daoState.id}>
      <Card.Header className="flex-col bg-[#898989]/5 backdrop-blur-md">
        {title ? (
          <h2 className="pb-4 text-base font-semibold text-white lg:pb-0">
            {title}
          </h2>
        ) : null}
        {!title && <Skeleton className="w-8/12 py-3 pb-4" />}
        <div className="mb-2 flex w-full flex-row justify-center gap-2 lg:mb-0 lg:ml-auto lg:w-auto lg:flex-row lg:justify-end lg:pl-4">
          <DaoStatusLabel result={daoState.status} />
        </div>
      </Card.Header>
      <Card.Body className="px-0 py-0">
        <div className="bg-black/[50%] p-4 py-10 backdrop-blur-md">
          <MarkdownView className="line-clamp-4" source={body ?? ""} />
        </div>
        <div className="flex flex-col items-start justify-between border-t border-white/20 bg-[#898989]/5 p-2 backdrop-blur-md lg:flex-row lg:items-center lg:p-4">
          <div className="flex w-full flex-col-reverse lg:flex-row lg:items-center">
            <div className="mr-3 w-full py-2 lg:w-auto lg:min-w-fit lg:py-0">
              <Link
                className="min-w-auto flex w-full items-center border border-white/10 px-2 py-4 text-sm text-white hover:border-green-500 hover:bg-green-500/5 hover:text-green-500 lg:w-auto lg:px-4"
                href={`/dao/${daoState.id}`}
              >
                View full S2 Application
                <ArrowRightIcon className="ml-auto w-5 lg:ml-2" />
              </Link>
            </div>
            <span className="line-clamp-1 block w-full truncate text-base text-green-500">
              Posted by{" "}
              <span className="text-white">
                {smallAddress(daoState.userId)}
              </span>
            </span>
          </div>
        </div>
      </Card.Body>
    </Card.Root>
  );
}
