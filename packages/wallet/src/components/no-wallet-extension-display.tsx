import "../output.css";

export function NoWalletExtensionDisplay() {
  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-text-center tw-text-sm tw-text-gray-300">
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p>
          <b className="tw-text-red-500">No wallet found</b>. Please install a
          Wallet extension or check permission settings.
        </p>
      </div>
      <p>If you don&apos;t have a wallet, we recommend one of these:</p>
      <div className="tw-flex tw-gap-3">
        <a
          className="tw-text-blue-600"
          href="https://subwallet.app/"
          rel="noreferrer"
          target="_blank"
        >
          SubWallet
        </a>
        <a
          className="tw-text-blue-600"
          href="https://polkadot.js.org/extension/"
          rel="noreferrer"
          target="_blank"
        >
          Polkadot JS
        </a>
      </div>
    </div>
  );
}
