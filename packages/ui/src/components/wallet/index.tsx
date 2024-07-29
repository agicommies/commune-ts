"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { InjectedAccountWithMeta } from "../..";
import type {
  Stake,
  TransactionResult,
  Transfer,
  TransferStake,
} from "../../../../subspace/types";
import { cn, CopyButton, Loading, WalletButton } from "../..";
import { formatToken, smallAddress } from "../../../../subspace/utils";
import { NoWalletExtension } from "./no-extension";

interface TWallet {
  handleWalletModal: (state?: boolean) => void;
  openWalletModal: boolean;
  stakeOut:
    | {
        total: bigint;
        perAddr: Map<string, bigint>;
        perAddrPerNet: Map<string, Map<string, bigint>>;
      }
    | undefined;
  balance: string;
  handleConnect: () => void;
  isInitialized: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (args: InjectedAccountWithMeta) => void;
  wallets: InjectedAccountWithMeta[];
  handleWalletSelections: (arg: InjectedAccountWithMeta) => void;

  transfer: (args: Transfer) => void;
  transferStake: (args: TransferStake) => void;

  addStake: (args: Stake) => void;
  removeStake: (args: Stake) => void;
}

type MenuType = "send" | "stake" | "unstake" | "transfer" | null;

export function Wallet(props: TWallet): ReactElement {
  const {
    selectedAccount,
    handleConnect,
    isInitialized,
    openWalletModal,
    handleWalletModal,
    stakeOut,
    balance,
    handleWalletSelections,
    wallets,
    addStake,
    removeStake,
    transfer,
    transferStake,
  } = props;

  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [validator, setValidator] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const [isWalletSelectionView, setIsWalletSelectionView] = useState(
    selectedAccount?.address === undefined,
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
      textColor: "text-red-500",
      bgColor: "bg-red-500/15",
    },
    {
      icon: "stake-icon.svg",
      name: "Stake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "text-yellow-500",
      bgColor: "bg-yellow-500/15",
    },
    {
      icon: "unstake-icon.svg",
      name: "Unstake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "text-purple-500",
      bgColor: "bg-purple-500/15",
    },
    {
      icon: "transfer-icon.svg",
      name: "Transfer",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "text-green-500",
      bgColor: "bg-green-500/15",
    },
  ];

  let userStakeWeight: bigint | null = null;
  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr.get(selectedAccount.address);
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const freeBalancePercentage =
    100 - (Number(userStakeWeight) / Number(balance)) * 100;

  const handleSelectWallet = () => {
    setIsWalletSelectionView(true);
    handleConnect();
  };

  const handleWalletSelectionModal = (args: InjectedAccountWithMeta) => {
    handleWalletSelections(args);
    setIsWalletSelectionView(false);
  };

  return (
    <div className={cn(openWalletModal ? "block" : "hidden")}>
      <div
        className={cn("fixed left-0 z-[100] h-[100vh] w-full")}
        onClick={() => {
          handleWalletModal(false);
          setIsWalletSelectionView(false);
        }}
      />
      <div
        className={cn(
          "fixed right-0 top-16 z-[100] m-4 flex-col border border-gray-500 bg-black",
        )}
      >
        {isWalletSelectionView ? (
          <div className={cn("flex flex-col gap-y-4 overflow-y-auto p-4")}>
            {wallets.map((item) => (
              <button
                className={cn(
                  `text-md flex cursor-pointer items-center gap-x-3 overflow-auto border px-4 py-2 ${selectedAccount === item ? "border-green-500" : "border-gray-500"}`,
                )}
                key={item.address}
                onClick={() => handleWalletSelectionModal(item)}
                type="button"
              >
                <div className={cn("flex flex-col items-start gap-1")}>
                  <span className="font-semibold text-white">
                    {item.meta.name}
                  </span>
                  <p className={cn("text-sm font-thin text-gray-300")}>
                    {smallAddress(item.address, 17)}
                  </p>
                </div>
              </button>
            ))}
            {!wallets.length && <NoWalletExtension />}
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex justify-between gap-2 border-b border-gray-500 p-4",
              )}
            >
              <WalletButton
                hook={{
                  handleConnect: handleSelectWallet,
                  selectedAccount,
                  isInitialized,
                }}
              />
              <CopyButton code={selectedAccount?.address || ""} />
            </div>
            <div
              className={cn(
                "flex flex-col gap-4 border-b border-gray-500 p-4 text-white",
              )}
            >
              <div className={cn("border border-gray-500 p-4")}>
                <div className={cn("flex w-full justify-between")}>
                  <div>
                    <p className={cn("text-xl text-green-500")}>
                      {balance}
                      <span
                        className={cn("ml-1 text-sm font-light text-gray-400")}
                      >
                        COMAI
                      </span>
                    </p>
                    <p className={cn("text-xs text-gray-500")}>Free Balance</p>
                  </div>
                  <div className={cn("text-right")}>
                    <p className={cn("text-xl text-red-500")}>
                      {formatToken(userStakeWeight || 0)}
                      <span
                        className={cn("ml-1 text-sm font-light text-gray-400")}
                      >
                        COMAI
                      </span>
                    </p>
                    <p className={cn("text-xs text-gray-500")}>
                      Staked Balance
                    </p>
                  </div>
                </div>
                <div className={cn("relative flex h-2 w-full pt-1")}>
                  <span
                    className={cn("absolute h-2 bg-green-500")}
                    style={{ width: `${freeBalancePercentage.toFixed(2)}%` }}
                  />
                  <span className={cn("h-2 w-full bg-red-500")} />
                </div>
              </div>
            </div>
            <div className={cn("flex p-4")}>
              <div className={cn("flex border border-gray-500")}>
                {walletActions.map((action) => {
                  return (
                    <button
                      className={cn(
                        `flex w-1/4 flex-col items-center border-gray-500 px-3.5 py-3 text-gray-400 transition duration-200 hover:bg-white/5 ${activeMenu == action.name.toLocaleLowerCase() ? action.bgColor : ""}`,
                      )}
                      key={action.name}
                      onClick={() => {
                        action.handleMenuClick(
                          action.name.toLowerCase() as MenuType,
                        );
                      }}
                      type="button"
                    >
                      <Image
                        alt={`${action.name} Icon`}
                        height={20}
                        src={action.icon}
                        width={20}
                      />
                      <span className={cn(`${action.textColor} text-sm`)}>
                        {action.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              className={cn(
                `flex flex-col gap-4 border-t border-gray-500 p-4 text-white ${activeMenu ? "flex" : "hidden"}`,
              )}
            >
              <form
                className={cn("flex w-full flex-col gap-4")}
                onSubmit={handleSubmit}
              >
                <div className={cn("w-full")}>
                  <span className={cn("text-base")}>
                    {activeMenu === "stake" ||
                    activeMenu === "transfer" ||
                    activeMenu === "unstake" ? (
                      <div
                        className={cn(
                          "flex flex-col items-end gap-3 md:flex-row",
                        )}
                      >
                        <p>Validator Address</p>
                        <Link
                          className={cn(
                            "text-sm text-blue-500 hover:underline",
                          )}
                          href="https://www.comstats.org/"
                          target="_blank"
                        >
                          View a list of validators here
                        </Link>
                      </div>
                    ) : (
                      "To Address"
                    )}
                  </span>
                  <input
                    className={cn(
                      "w-full border border-gray-500 bg-black p-2 text-gray-400",
                    )}
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
                  <p
                    className={cn(
                      "--mt-2 mb-1 flex text-left text-base text-red-400",
                    )}
                  >
                    {inputError.validator}
                  </p>
                ) : null}
                <div className={cn("w-full")}>
                  <p className={cn("text-base")}>Value</p>
                  <input
                    className={cn(
                      "w-full border border-gray-500 bg-black p-2 text-gray-400",
                    )}
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
                  <p
                    className={cn(
                      "--mt-2 mb-1 flex text-left text-base text-red-400",
                    )}
                  >
                    {inputError.value}
                  </p>
                ) : null}
                <button
                  className={cn(
                    "w-full border border-green-500 py-2 text-green-500",
                  )}
                  disabled={transactionStatus.status === "PENDING"}
                  type="submit"
                >
                  Submit
                </button>
              </form>
              {transactionStatus.status ? (
                <p
                  className={cn(
                    `items-center gap-3 pt-6 ${transactionStatus.status === "PENDING" && "text-yellow-400"} ${transactionStatus.status === "ERROR" && "text-red-400"} ${transactionStatus.status === "SUCCESS" && "text-green-400"} flex text-left text-base`,
                  )}
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
  );
}
