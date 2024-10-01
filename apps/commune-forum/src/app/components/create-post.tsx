"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@commune-ts/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { toast } from "@commune-ts/providers/use-toast";
import { TransactionStatus } from "@commune-ts/ui";

import { cairo } from "~/utils/fonts";

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export const CreatePost = (): JSX.Element => {
  const router = useRouter();
  const { isConnected, addCustomProposal, balance } = useCommune();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);

  const [editMode, setEditMode] = useState(true);
  function toggleEditMode(): void {
    setEditMode(!editMode);
  }

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  function handleCallback(callbackReturn: TransactionResult): void {
    setTransactionStatus(callbackReturn);
  }

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfs = (await res.json()) as { IpfsHash: string };
      setUploading(false);

      if (ipfs.IpfsHash === "undefined" || !ipfs.IpfsHash) {
        toast.error("Error uploading transfer dao treasury proposal");
        return;
      }

      if (!balance) {
        toast.error("Balance is still loading");
        return;
      }

      const proposalCost = 10000;

      if (Number(balance) > proposalCost) {
        void addCustomProposal({
          IpfsHash: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create proposal. Required: ${proposalCost} but got ${balance}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading proposal");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting proposal creation...",
    });

    const result = proposalSchema.safeParse({
      title,
      body,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation",
      });
      return;
    }

    const proposalData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
      type: "application/json",
    });
    void uploadFile(fileToUpload);
  }

  return (
    <form onSubmit={HandleSubmit}>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex gap-2">
          <button
            className={`border px-4 py-1 ${editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
            onClick={toggleEditMode}
            type="button"
          >
            Edit
          </button>
          <button
            className={`border px-4 py-1 ${!editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
            onClick={toggleEditMode}
            type="button"
          >
            Preview
          </button>
        </div>
        <div className="flex flex-col">
          {editMode ? (
            <div className="flex flex-col gap-3">
              <input
                className="w-full p-3 text-white bg-white/10"
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                placeholder="Your proposal title here..."
                type="text"
                value={title}
              />
              <textarea
                className="w-full p-3 text-white bg-white/10"
                onChange={(e) => {
                  setBody(e.target.value);
                }}
                placeholder="here... (Markdown supported / HTML tags are not supported)"
                rows={5}
                value={body}
              />
            </div>
          ) : (
            <div className="p-4">
              {body ? (
                <MarkdownPreview
                  className={`${cairo.className} max-h-[40vh] overflow-auto`}
                  source={`# ${title}\n${body}`}
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                  }}
                />
              ) : null}
              {/* TODO: skeleton for markdown body */}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            className={`relative w-full border px-4 py-2 font-semibold ${isConnected ? "border-green-500 text-green-500 hover:bg-green-500/5 active:top-1" : "border-gray-500 text-gray-500"}`}
            disabled={!isConnected}
            type="submit"
          >
            {uploading ? "Uploading..." : "Submit Proposal"}
          </button>
        </div>
        {transactionStatus.status && (
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        )}
      </div>
    </form>
  );
}
