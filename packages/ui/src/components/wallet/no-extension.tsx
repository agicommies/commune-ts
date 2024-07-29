import Link from "next/link";

import { cn } from "../..";

export function NoWalletExtension() {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-gray-300",
      )}
    >
      <div className={cn("flex flex-col gap-2")}>
        <p>
          <b className={cn("text-red-500")}>No wallet found</b>. Please install
          a Wallet extension or check permission settings.
        </p>
      </div>
      <p>If you don&apos;t have a wallet, we recommend one of these:</p>
      <div className={cn("flex gap-3")}>
        <Link
          className={cn("text-blue-600")}
          href="https://subwallet.app/"
          rel="noreferrer"
          target="_blank"
        >
          SubWallet
        </Link>
        <Link
          className={cn("text-blue-600")}
          href="https://polkadot.js.org/extension/"
          rel="noreferrer"
          target="_blank"
        >
          Polkadot JS
        </Link>
      </div>
    </div>
  );
}
