"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

import { cn } from "..";
import { copyToClipboard } from "../../../subspace/utils";

interface CodeComponentProps {
  code: string;
}

export function CopyButton(props: CodeComponentProps): JSX.Element {
  const { code } = props;
  const [copied, setCopied] = useState(false);

  async function copyTextToClipboard(text: string): Promise<void> {
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
    await copyToClipboard(text);
    return;
  }

  return (
    <button
      className={cn(
        `flex w-fit max-w-28 items-center justify-center border border-gray-500 px-2 py-2 text-gray-400 hover:border-green-600 hover:text-green-600 ${copied && "cursor-not-allowed border-green-500 text-green-500 hover:!border-green-500 hover:!text-green-500"}`,
      )}
      onClick={() => void copyTextToClipboard(code)}
      type="button"
    >
      <span className={cn(`flex items-center`)}>
        {copied ? (
          <CheckBadgeIcon className=" text-green-500" height={20} width={20} />
        ) : (
          <Image alt="" height={20} src="docs-icon.svg" width={20} />
        )}
      </span>
    </button>
  );
}
