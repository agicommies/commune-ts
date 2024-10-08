"use client";

import { useState } from "react";

import { cn } from "..";

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
    await navigator.clipboard.writeText(text);

    return;
  }

  return (
    <button
      className={cn(
        `flex w-fit items-center text-nowrap border border-white/20 px-3 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 ${copied && "cursor-not-allowed border-green-500 text-green-500 hover:!border-green-500 hover:!text-green-500"}`,
      )}
      onClick={() => void copyTextToClipboard(code)}
      type="button"
    >
      <span className={cn(`flex items-center ${copied ? "text-green-" : ""}`)}>
        <img
          alt=""
          className="ml-0.5"
          height={30}
          src="docs-icon.svg"
          width={30}
        />
      </span>
    </button>
  );
}
