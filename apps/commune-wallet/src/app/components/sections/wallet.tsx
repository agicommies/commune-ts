"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

import type {
  Stake,
  TransactionResult,
  Transfer,
  TransferStake,
} from "@commune-ts/subspace/types";
import type { InjectedAccountWithMeta } from "@commune-ts/ui";
import { toast } from "@commune-ts/providers/use-toast";
import {
  SendIcon,
  StakeIcon,
  TransferIcon,
  UnstakeIcon,
  WalletIcon,
} from "@commune-ts/public";
import {
  copyToClipboard,
  formatToken,
  fromNano,
  smallAddress,
} from "@commune-ts/subspace/utils";
import { TransactionStatus } from "@commune-ts/ui";

import type { ColorType, MenuType } from "~/utils/types";
import { IconButton } from "../icon-button";
import { ImageIcon } from "../image-icon";
import { ValidatorsList } from "../validators-list";

interface WalletProps {
  root: {
    children: React.ReactNode;
  };
  header: {
    onSwitchWallet: () => void;
    selectedAccount: InjectedAccountWithMeta;
  };
  actions: {
    balance: bigint | undefined;
    selectedAccount: InjectedAccountWithMeta;
    addStake: (stake: Stake) => Promise<void>;
    removeStake: (stake: Stake) => Promise<void>;
    transfer: (transfer: Transfer) => Promise<void>;
    transferStake: (transfer: TransferStake) => Promise<void>;
  };
  balance: {
    balance: bigint | undefined;
    userStakeWeight: bigint | null;
    selectedAccount: InjectedAccountWithMeta;
  };
}

function WalletRoot(props: WalletProps["root"]) {
  return (
    <>
      <div className="flex w-full max-w-4xl animate-fade-up flex-col items-center justify-center divide-y divide-white/20 border border-white/20 bg-[#898989]/5 p-6 backdrop-blur-md">
        {props.children}
      </div>
    </>
  );
}

function WalletHeader(props: WalletProps["header"]) {
  function handleCopy() {
    copyToClipboard(props.selectedAccount.address);
    toast.success("Address copied to clipboard");
  }

  return (
    <div className="flex w-full animate-fade-up flex-col items-center justify-center text-lg text-gray-300 animate-delay-100">
      <div className="flex w-full flex-col gap-4 pb-4 md:flex-row">
        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
        >
          <ImageIcon
            src={WalletIcon as string}
            className="h-6 w-6"
            alt="Wallet icon"
          />
          <span className="flex gap-1">
            <p className="text-green-500">
              {props.selectedAccount.meta.name?.toUpperCase()}
            </p>
            <p>
              /{" "}
              {props.selectedAccount.meta.name &&
              props.selectedAccount.meta.name.length > 10
                ? smallAddress(props.selectedAccount.address)
                : props.selectedAccount.address}
            </p>
          </span>
        </button>
        <button
          onClick={props.onSwitchWallet}
          className="flex w-fit items-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
        >
          <ChevronLeftIcon className="h-6 w-6" /> Switch Wallet
        </button>
      </div>
    </div>
  );
}

function WalletBalance(props: WalletProps["balance"]) {
  const [freeBalancePercentage, setFreeBalancePercentage] = useState(0);
  useEffect(() => {
    const freeBalance = fromNano(props.balance ?? 0);
    const stakedBalance = fromNano(props.userStakeWeight ?? 0);
    const availablePercentage =
      (freeBalance * 100) / (stakedBalance + freeBalance);

    if (isNaN(availablePercentage) || !availablePercentage) {
      setFreeBalancePercentage(0);
      return;
    }
    setFreeBalancePercentage(availablePercentage);
  }, [props.balance, props.userStakeWeight]);

  return (
    <div className="flex w-full animate-fade-up flex-col gap-4 border-white/20 py-4 text-white animate-delay-200">
      <div className="border border-white/20 p-4">
        <div className="flex w-full justify-between gap-6">
          <div>
            {props.balance === undefined ? (
              <p className="animate-pulse text-xl text-green-700">
                ---
                <span className="ml-1 text-sm font-light text-gray-400">
                  COMAI
                </span>
              </p>
            ) : (
              <p className="text-xl text-green-500">
                {formatToken(props.balance)}
                <span className="ml-1 text-sm font-light text-gray-400">
                  COMAI
                </span>
              </p>
            )}

            <p className="text-xs text-gray-500">Free Balance</p>
          </div>
          <div className="text-right">
            <p className="text-xl text-red-500">
              {props.userStakeWeight !== null
                ? formatToken(props.userStakeWeight)
                : "---"}
              <span className="ml-1 text-sm font-light text-gray-400">
                COMAI
              </span>
            </p>
            <p className="text-xs text-gray-500">Staked Balance</p>
          </div>
        </div>
        {props.userStakeWeight !== null ? (
          <div className="relative flex h-2 w-full pt-1">
            <span
              className="absolute h-2 bg-green-500"
              style={{
                width: `${freeBalancePercentage.toFixed(2)}%`,
              }}
            />
            <span className="h-2 w-full bg-red-500" />
          </div>
        ) : (
          <div className="relative flex h-2 w-full animate-pulse pt-1">
            <span
              className="absolute h-2 bg-green-500/20"
              style={{
                width: `50%`,
              }}
            />
            <span className="h-2 w-full bg-red-500/20" />
          </div>
        )}
      </div>
    </div>
  );
}

function WalletActions(props: WalletProps["actions"]) {
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);

  // Fields
  const [validator, setValidator] = useState<string>("");
  const [fromValidator, setFromValidator] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Field Validation
  const [inputError, setInputError] = useState<{
    validator: string | null;
    value: string | null;
  }>({
    validator: null,
    value: null,
  });

  const buttons = [
    {
      src: SendIcon,
      text: "Send",
      color: "red",
    },
    {
      src: StakeIcon,
      text: "Stake",
      color: "amber",
    },
    {
      src: UnstakeIcon,
      text: "Unstake",
      color: "purple",
    },
    {
      src: TransferIcon,
      text: "Transfer Stake",
      color: "green",
    },
  ];

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const handleCallback = (callbackReturn: TransactionResult) => {
      setTransactionStatus(callbackReturn);
    };

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    const handleCheckInput = () => {
      setInputError({ validator: null, value: null });
      if (!validator)
        setInputError((prev) => ({
          ...prev,
          validator: "Validator Address cannot be empty",
        }));
      if (!amount)
        setInputError((prev) => ({
          ...prev,
          value: "Value cannot be empty",
        }));
      return !!(amount && validator);
    };

    const isValidInput = handleCheckInput();

    if (!isValidInput) return;

    if (activeMenu === "Stake") {
      void props.addStake({
        validator,
        amount,
        callback: handleCallback,
      });
    }
    if (activeMenu === "Unstake") {
      void props.removeStake({
        validator,
        amount,
        callback: handleCallback,
      });
    }
    if (activeMenu === "Transfer Stake") {
      void props.transferStake({
        fromValidator: fromValidator,
        toValidator: validator,
        amount,
        callback: handleCallback,
      });
    }
    if (activeMenu === "Send") {
      void props.transfer({
        to: validator,
        amount,
        callback: handleCallback,
      });
    }
  };

  const [currentView, setCurrentView] = useState<
    "wallet" | "validators" | "stakedValidators"
  >("wallet");

  const handleSelectValidator = (validator: { address: string }) => {
    setValidator(validator.address);
    setCurrentView("wallet");
  };

  const handleMaxClick = () => {
    if (props.balance !== undefined) {
      setAmount(fromNano(props.balance).toFixed(2));
    }
  };

  return (
    <>
      <div className="grid w-full animate-fade-up grid-cols-1 gap-4 pt-4 animate-delay-300 md:grid-cols-4">
        {buttons.map((button) => (
          <IconButton
            key={button.src}
            src={button.src}
            text={button.text}
            color={button.color as ColorType}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        ))}
      </div>
      {activeMenu && (
        <>
          {currentView === "validators" ||
          currentView === "stakedValidators" ? (
            <ValidatorsList
              listType={currentView === "validators" ? "all" : "staked"}
              onSelectValidator={handleSelectValidator}
              onBack={() => setCurrentView("wallet")}
              userAddress={props.selectedAccount.address}
            />
          ) : (
            <div className="mt-4 w-full">
              <form
                onSubmit={handleSubmit}
                className="flex w-full animate-fade-down flex-col gap-4 pt-4"
              >
                {activeMenu === "Transfer Stake" && (
                  <div className="w-full">
                    <p className="text-base">From Validator</p>
                    <input
                      type="text"
                      value={fromValidator}
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => setFromValidator(e.target.value)}
                      placeholder="The full address of the validator"
                      className="w-full border border-white/20 bg-[#898989]/5 p-2"
                    />
                  </div>
                )}
                <div className="w-full">
                  <span className="text-base">
                    {activeMenu === "Stake" ||
                    activeMenu === "Transfer Stake" ||
                    activeMenu === "Unstake" ? (
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <p>
                          {activeMenu === "Transfer Stake"
                            ? "To Validator"
                            : "Validator Address"}
                        </p>
                      </div>
                    ) : (
                      "To Address"
                    )}
                  </span>
                  <div className="flex flex-row gap-3">
                    <input
                      type="text"
                      value={validator}
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => setValidator(e.target.value)}
                      placeholder={
                        activeMenu === "Stake" ||
                        activeMenu === "Transfer Stake" ||
                        activeMenu === "Unstake"
                          ? "The full address of the validator"
                          : "The full address of the recipient"
                      }
                      className="w-full border border-white/20 bg-[#898989]/5 p-2"
                    />
                    {activeMenu !== "Send" && (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentView(
                            activeMenu === "Unstake"
                              ? "stakedValidators"
                              : "validators",
                          )
                        }
                        className="flex w-fit items-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
                      >
                        {activeMenu === "Unstake"
                          ? "List of Staked Validators"
                          : "Validators"}
                      </button>
                    )}
                    {activeMenu === "Transfer Stake" && (
                      <button
                        type="button"
                        onClick={() => setCurrentView("stakedValidators")}
                        className="flex w-fit items-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
                      >
                        List of Staked Validators
                      </button>
                    )}
                  </div>
                </div>
                {inputError.validator && (
                  <p
                    className={`-mt-2 mb-1 flex text-left text-base text-red-400`}
                  >
                    {inputError.validator}
                  </p>
                )}
                <div className="w-full">
                  <p className="text-base">Value</p>
                  <div className="flex w-full gap-1">
                    <input
                      type="number"
                      disabled={transactionStatus.status === "PENDING"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="The amount of COMAI to use in the transaction"
                      className="w-full border border-white/20 bg-[#898989]/5 p-2"
                    />
                    <button
                      type="button"
                      onClick={handleMaxClick}
                      disabled={
                        transactionStatus.status === "PENDING" || !props.balance
                      }
                      className="ml-2 whitespace-nowrap border border-blue-500 bg-blue-600/5 px-4 py-2 font-semibold text-blue-500 transition duration-200 hover:border-blue-400 hover:bg-blue-500/15 disabled:border-gray-500 disabled:bg-[#898989]/5 disabled:text-gray-500"
                    >
                      Max
                    </button>
                  </div>
                </div>
                {inputError.value && (
                  <p
                    className={`-mt-2 mb-1 flex text-left text-base text-red-400`}
                  >
                    {inputError.value}
                  </p>
                )}
                <div className="mt-4 border-t border-white/20 pt-4">
                  <button
                    type="submit"
                    disabled={
                      transactionStatus.status === "PENDING" ||
                      !amount ||
                      !validator ||
                      (activeMenu === "Transfer Stake" && !fromValidator)
                    }
                    className="flex w-full justify-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 disabled:border-gray-500 disabled:bg-[#898989]/5 disabled:text-gray-500"
                  >
                    Start Transaction
                  </button>
                </div>
              </form>
              {transactionStatus.status && (
                <TransactionStatus
                  status={transactionStatus.status}
                  message={transactionStatus.message}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export const Wallet = {
  Root: WalletRoot,
  Header: WalletHeader,
  Balance: WalletBalance,
  Actions: WalletActions,
};
