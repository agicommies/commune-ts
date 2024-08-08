"use client";

import "../output.css";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { TransactionResult } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { formatToken, smallAddress } from "@commune-ts/providers/utils";
import { CopyButton, InjectedAccountWithMeta, Loading } from "@commune-ts/ui";

import { NoWalletExtensionDisplay, WalletButton } from "./";

type MenuType = "send" | "stake" | "unstake" | "transfer" | null;

export function Wallet() {
  const {
    handleGetWallets,
    selectedAccount,
    setSelectedAccount,
    setIsConnected,
    addStake,
    removeStake,
    transfer,
    transferStake,
    stakeOut,
    balance,
    accounts,
    handleWalletModal,
    openWalletModal,
  } = useCommune();

  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [validator, setValidator] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const [isWalletSelectionView, setIsWalletSelectionView] = useState(
    Boolean(!selectedAccount?.address),
  );

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const [inputError, setInputError] = useState<{
    validator: string | null;
    value: string | null;
  }>({ validator: null, value: null });

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
  };

  const handleMenuClick = (type: MenuType) => {
    setValidator("");
    setAmount("");
    setActiveMenu(type);
  };

  const handleCheckInput = () => {
    setInputError({ validator: null, value: null });
    if (!validator)
      setInputError((prev) => ({
        ...prev,
        validator: "Validator Address cannot be empty",
      }));
    if (!amount)
      setInputError((prev) => ({ ...prev, value: "Value cannot be empty" }));
    return Boolean(amount && validator);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAccount) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Select your wallet",
      });
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    const isValidInput = handleCheckInput();

    if (!isValidInput) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Input error...",
      });
      return;
    }

    if (activeMenu === "stake") {
      addStake({
        validator,
        amount,

        callback: handleCallback,
      });
    }
    if (activeMenu === "unstake") {
      removeStake({
        validator,
        amount,

        callback: handleCallback,
      });
    }
    if (activeMenu === "transfer") {
      transferStake({
        fromValidator: selectedAccount.address,
        toValidator: validator,
        amount,

        callback: handleCallback,
      });
    }
    if (activeMenu === "send") {
      transfer({
        to: validator,
        amount,
        callback: handleCallback,
      });
    }
  };

  const walletActions = [
    {
      icon: "send-icon.svg",
      name: "Send",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-red-500",
      bgColor: "tw-bg-red-500/15",
    },
    {
      icon: "stake-icon.svg",
      name: "Stake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-yellow-500",
      bgColor: "tw-bg-yellow-500/15",
    },
    {
      icon: "unstake-icon.svg",
      name: "Unstake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-purple-500",
      bgColor: "tw-bg-purple-500/15",
    },
    // {
    //   icon: "transfer-icon.svg",
    //   name: "Transfer",
    //   handleMenuClick: (menuType: MenuType) => {
    //     handleMenuClick(menuType);
    //   },
    //   textColor: "tw-text-green-500",
    //   bgColor: "tw-bg-green-500/15",
    // },
  ];

  let userStakeWeight: bigint | null = null;
  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr.get(selectedAccount.address);
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const freeBalancePercentage =
    100 - (Number(userStakeWeight) / Number(balance)) * 100;

  function handleWalletSelection(wallet: InjectedAccountWithMeta): void {
    localStorage.setItem("favoriteWalletAddress", wallet.address);
    setSelectedAccount(wallet);
    setIsConnected(true);
    setIsWalletSelectionView(false);
  }

  const handleOpenSelectWallet = () => {
    handleGetWallets();
    setIsWalletSelectionView(true);
  };

  useEffect(() => {
    setIsWalletSelectionView(Boolean(!selectedAccount));
  }, [selectedAccount]);

  const SelectWalletModal = () => {
    if (!accounts?.length && isWalletSelectionView)
      return <NoWalletExtensionDisplay />;

    if (isWalletSelectionView) {
      return (
        <div className="tw-flex tw-flex-col tw-gap-y-4 tw-overflow-y-auto tw-p-4">
          {accounts?.map((item) => (
            <button
              className={`tw-text-md tw-flex tw-cursor-pointer tw-items-center tw-gap-x-3 tw-overflow-auto tw-border tw-px-4 tw-py-2 ${
                selectedAccount?.address === item.address
                  ? "tw-border-green-500"
                  : "tw-border-gray-500"
              }`}
              key={item.address}
              onClick={() => handleWalletSelection(item)}
              type="button"
            >
              <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
                <span className="tw-font-semibold tw-text-white">
                  {item.meta.name}
                </span>
                <p className="tw-text-sm tw-font-thin tw-text-gray-300">
                  {smallAddress(item.address, 17)}
                </p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={openWalletModal ? "" : "tw-hidden"}>
      <div
        className="tw-w-full tw-h-screen tw-absolute tw-z-[100]"
        onClick={() => {
          handleWalletModal(false);
          setIsWalletSelectionView(false);
        }}
      />
      <div className="tw-max-w-screen-2xl tw-relative tw-mx-auto">
        <div className="tw-fixed tw-top-16 tw-right-0 tw-w-auto !tw-z-[150] tw-m-3 tw-flex-col tw-border tw-border-gray-500 tw-bg-black">
          <SelectWalletModal />

          {!isWalletSelectionView && (
            <>
              <div className="tw-flex tw-gap-2 tw-border-b tw-border-gray-500 tw-p-4">
                <WalletButton customHandler={handleOpenSelectWallet} />
                <CopyButton code={selectedAccount?.address || ""} />
              </div>
              <div className="tw-flex tw-flex-col tw-gap-4 tw-border-b tw-border-gray-500 tw-p-4 tw-text-white">
                <div className="tw-border tw-border-gray-500 tw-p-4">
                  <div className="tw-flex tw-w-full tw-justify-between">
                    <div>
                      <p className="tw-text-xl tw-text-green-500">
                        {formatToken(balance || 0)}
                        <span className="tw-ml-1 tw-text-sm tw-font-light tw-text-gray-400">
                          COMAI
                        </span>
                      </p>
                      <p className="tw-text-xs tw-text-gray-500">
                        Free Balance
                      </p>
                    </div>
                    <div className="tw-text-right">
                      <p className="tw-text-xl tw-text-red-500">
                        {formatToken(userStakeWeight || 0)}
                        <span className="tw-ml-1 tw-text-sm tw-font-light tw-text-gray-400">
                          COMAI
                        </span>
                      </p>
                      <p className="tw-text-xs tw-text-gray-500">
                        Staked Balance
                      </p>
                    </div>
                  </div>
                  <div className="tw-relative tw-flex tw-h-2 tw-w-full tw-pt-1">
                    <span
                      className="tw-absolute tw-h-2 tw-bg-green-500"
                      style={{ width: `${freeBalancePercentage.toFixed(2)}%` }}
                    />
                    <span className="tw-h-2 tw-w-full tw-bg-red-500" />
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-p-4">
                <div className="tw-flex tw-border tw-border-gray-500 tw-w-full">
                  {walletActions.map((action) => {
                    return (
                      <button
                        className={`tw-flex tw-w-full tw-flex-col tw-items-center tw-border-gray-500 tw-px-3.5 tw-py-3 tw-text-gray-400 tw-transition tw-duration-200 hover:tw-bg-white/5 ${
                          activeMenu == action.name.toLocaleLowerCase()
                            ? action.bgColor
                            : ""
                        }`}
                        key={action.name}
                        onClick={() => {
                          action.handleMenuClick(
                            action.name.toLowerCase() as MenuType,
                          );
                        }}
                        type="button"
                      >
                        <Image
                          height={24}
                          width={24}
                          alt={`${action.name} Icon`}
                          className="tw-h-6 tw-w-6"
                          src={action.icon}
                        />
                        <span className={`${action.textColor} tw-text-sm`}>
                          {action.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className={`tw-flex tw-flex-col tw-gap-4 tw-border-t tw-border-gray-500 tw-p-4 tw-text-white ${
                  activeMenu ? "tw-flex" : "tw-hidden"
                }`}
              >
                <form
                  className="tw-flex tw-w-full tw-flex-col tw-gap-4"
                  onSubmit={handleSubmit}
                >
                  <div className="tw-w-full">
                    <span className="tw-text-base">
                      {activeMenu === "stake" ||
                      activeMenu === "transfer" ||
                      activeMenu === "unstake" ? (
                        <div className="tw-flex tw-flex-col tw-items-end tw-gap-3 md:tw-flex-row">
                          <p>Validator Address</p>
                          <a
                            className="tw-text-sm tw-text-blue-500 hover:tw-underline ml-auto"
                            href="https://www.comstats.org/"
                            target="_blank"
                          >
                            View validators list
                          </a>
                        </div>
                      ) : (
                        "To Address"
                      )}
                    </span>
                    <input
                      className="tw-w-full tw-border tw-border-gray-500 tw-bg-black tw-p-2 tw-text-gray-400"
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => {
                        setValidator(e.target.value);
                      }}
                      placeholder={
                        activeMenu === "stake" ||
                        activeMenu === "transfer" ||
                        activeMenu === "unstake"
                          ? "The full address of the validator"
                          : "The full address of the recipient"
                      }
                      type="text"
                      value={validator}
                    />
                  </div>
                  {inputError.validator ? (
                    <p className="--tw-mt-2 tw-mb-1 tw-flex tw-text-left tw-text-base tw-text-red-400">
                      {inputError.validator}
                    </p>
                  ) : null}
                  <div className="tw-w-full">
                    <p className="tw-text-base">Value</p>
                    <input
                      className="tw-w-full tw-border tw-border-gray-500 tw-bg-black tw-p-2 tw-text-gray-400"
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => {
                        setAmount(e.target.value);
                      }}
                      placeholder="The amount of COMAI to use in the transaction"
                      type="text"
                      value={amount}
                    />
                  </div>
                  {inputError.value ? (
                    <p className="--tw-mt-2 tw-mb-1 tw-flex tw-text-left tw-text-base tw-text-red-400">
                      {inputError.value}
                    </p>
                  ) : null}
                  <button
                    className="tw-w-full tw-border tw-border-green-500 tw-py-2 tw-text-green-500"
                    disabled={transactionStatus.status === "PENDING"}
                    type="submit"
                  >
                    Submit
                  </button>
                </form>
                {transactionStatus.status ? (
                  <p
                    className={`tw-items-center tw-gap-3 tw-pt-6 ${
                      transactionStatus.status === "PENDING" &&
                      "tw-text-yellow-400"
                    } ${
                      transactionStatus.status === "ERROR" && "tw-text-red-400"
                    } ${
                      transactionStatus.status === "SUCCESS" &&
                      "tw-text-green-400"
                    } tw-flex tw-text-left tw-text-base`}
                  >
                    {transactionStatus.status === "PENDING" && <Loading />}
                    {transactionStatus.message}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
