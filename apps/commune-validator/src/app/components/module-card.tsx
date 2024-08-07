"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

import { fetchCustomMetadata } from "@commune-ts/providers/hooks";
import { smallAddress } from "@commune-ts/providers/utils";

import { CopySquareButton } from "./copy-square-button";
import { DelegateModuleWeight } from "./delegate-module-weight";

interface ModuleCardProps {
  id: number;
  name?: string;
  moduleKey: string; // SS58.1
  metadata: string | null; // IPFS
}

interface CustomMetadata {
  Ok?: {
    title?: string;
    body?: string;
  };
}

// Custom hook for fetching metadata
function useCustomMetadata(id: number, metadata: string | null) {
  const [customMetadata, setCustomMetadata] = useState<CustomMetadata | null>(
    null,
  );

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const result = await fetchCustomMetadata(
          "proposal",
          id,
          metadata ?? "",
        );
        setCustomMetadata(result as CustomMetadata);
      } catch (error) {
        console.error("Error fetching custom metadata:", error);
      }
    }

    void fetchMetadata();
  }, [id, metadata]);

  return customMetadata;
}

export function ModuleCard(props: ModuleCardProps) {
  const customMetadata = useCustomMetadata(props.id, props.metadata);

  const title = customMetadata?.Ok?.title ?? "No Metadata";

  return (
    <div className="flex min-w-full flex-col gap-2 border border-white/20 bg-[#898989]/5 p-6 text-gray-400">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p>{props.name ?? ""}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="flex w-full items-center gap-1 border border-white/20 bg-[#898989]/5 py-2 pl-2 backdrop-blur-md  md:text-sm 2xl:text-base">
          <Squares2X2Icon className="h-6 w-6 text-green-500" />{" "}
          {smallAddress(String(props.moduleKey))}
        </span>
        <CopySquareButton address={props.moduleKey} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <DelegateModuleWeight
          id={props.id}
          title={title}
          name={props.name ?? ""}
          moduleKey={props.moduleKey}
        />
        <Link
          className="flex w-full items-center justify-between border border-white/20 bg-[#898989]/5 p-2 pl-3 text-white backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/10"
          href={`module/${props.id}`}
        >
          View More <ArrowRightIcon className="h-5 w-5 text-green-500" />
        </Link>
      </div>
    </div>
  );
}
