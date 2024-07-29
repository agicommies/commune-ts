"use client";

import type { SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  type InjectedAccountWithMeta,
  type InjectedExtension,
} from "@polkadot/extension-inject/types";
import { toast } from "react-toastify";

import { Wallet } from "@commune-ts/ui/components";

import type {
  AddCustomProposal,
  AddDaoApplication,
  BaseDao,
  BaseProposal,
  DaoState,
  LastBlock,
  ProposalState,
  SS58Address,
  Stake,
  StakeOutData,
  TransactionResult,
  Transfer,
  TransferStake,
  UpdateDelegatingVotingPower,
  Vote,
} from "../types";
import {
  useAllStakeOut,
  useBalance,
  useCustomMetadata,
  useDaos,
  useDaoTreasury,
  useLastBlock,
  useNotDelegatingVoting,
  useProposals,
} from "../hooks";
import { calculateAmount, formatToken } from "../utils";

interface CommuneApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

interface CommuneContextType {
  api: ApiPromise | null;
  isConnected: boolean;
  isInitialized: boolean;

  handleConnect: () => void;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;

  addStake: (stake: Stake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;
  voteProposal: (vote: Vote) => Promise<void>;

  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  addDaoApplication: (application: AddDaoApplication) => Promise<void>;

  updateDelegatingVotingPower: (
    updateDelegating: UpdateDelegatingVotingPower,
  ) => Promise<void>;

  lastBlock: LastBlock | undefined;
  isLastBlockLoading: boolean;

  balance: bigint | undefined;
  isBalanceLoading: boolean;

  daoTreasury: SS58Address | undefined;
  isDaoTreasuryLoading: boolean;

  notDelegatingVoting: string[] | undefined;
  isNotDelegatingVotingLoading: boolean;

  stakeOut: StakeOutData | undefined;
  isStakeOutLoading: boolean;

  proposalsWithMeta: ProposalState[] | undefined;
  isProposalsLoading: boolean;

  daosWithMeta: DaoState[] | undefined;
  isDaosLoading: boolean;
}

const CommuneContext = createContext<CommuneContextType | null>(null);

interface CommuneProviderProps {
  children: React.ReactNode;
  wsEndpoint: string;
}

export function CommuneProvider({
  children,
  wsEndpoint,
}: CommuneProviderProps): JSX.Element {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [communeApi, setCommuneApi] = useState<CommuneApiState>({
    web3Enable: null,
    web3Accounts: null,
    web3FromAddress: null,
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);

  // == Initialize Polkadot ==

  async function loadCommuneApi(): Promise<void> {
    const { web3Accounts, web3Enable, web3FromAddress } = await import(
      "@polkadot/extension-dapp"
    );
    setCommuneApi({
      web3Enable,
      web3Accounts,
      web3FromAddress,
    });
    const provider = new WsProvider(wsEndpoint);
    const newApi = await ApiPromise.create({ provider });
    setApi(newApi);
    setIsInitialized(true);
  }

  useEffect(() => {
    void loadCommuneApi();

    return () => {
      void api?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsEndpoint]);

  async function fetchWallets(favoriteWalletAddress: string): Promise<void> {
    const walletList = await getWallets();
    const accountExist = walletList?.find(
      (wallet) => wallet.address === favoriteWalletAddress,
    );
    if (accountExist) {
      setSelectedAccount(accountExist);
      setIsConnected(true);
    }
  }

  useEffect(() => {
    const favoriteWalletAddress = localStorage.getItem("favoriteWalletAddress");
    if (favoriteWalletAddress) {
      void fetchWallets(favoriteWalletAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  async function getWallets(): Promise<InjectedAccountWithMeta[] | undefined> {
    if (!communeApi.web3Enable || !communeApi.web3Accounts) return;
    await communeApi.web3Enable("Commune AI");
    try {
      const response = await communeApi.web3Accounts();
      return response;
    } catch (error) {
      return undefined;
    }
  }

  async function handleConnect(): Promise<void> {
    try {
      const allAccounts = await getWallets();
      if (allAccounts) {
        setAccounts(allAccounts);
      }
      setOpenWalletModal(true);
    } catch (error) {
      return undefined;
    }
  }

  function handleWalletModal(state?: boolean): void {
    setOpenWalletModal(state || !openWalletModal);
  }

  function handleConnectWrapper(): void {
    handleConnect();
  }

  function handleWalletSelections(wallet: InjectedAccountWithMeta): void {
    localStorage.setItem("favoriteWalletAddress", wallet.address);
    setSelectedAccount(wallet);
    setIsConnected(true);
  }

  // == Transaction Handler ==

  async function sendTransaction(
    transactionType: string,
    transaction: SubmittableExtrinsic<"promise">,
    callback?: (result: TransactionResult) => void,
  ): Promise<void> {
    if (!api || !selectedAccount || !communeApi.web3FromAddress) return;
    try {
      const injector = await communeApi.web3FromAddress(
        selectedAccount.address,
      );
      await transaction.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        (result: SubmittableResult) => {
          if (result.status.isInBlock) {
            callback?.({
              finalized: false,
              status: "PENDING",
              message: `${transactionType} in progress`,
            });
          }
          if (result.status.isFinalized) {
            const success = result.findRecord("system", "ExtrinsicSuccess");
            const failed = result.findRecord("system", "ExtrinsicFailed");

            if (success) {
              toast.success(`${transactionType} successful`);
              callback?.({
                finalized: true,
                status: "SUCCESS",
                message: `${transactionType} successful`,
              });
            } else if (failed) {
              const [dispatchError] = failed.event.data as unknown as [
                DispatchError,
              ];
              let msg = `${transactionType} failed: ${dispatchError.toString()}`;

              if (dispatchError.isModule) {
                const mod = dispatchError.asModule;
                const error = api.registry.findMetaError(mod);

                if (error.section && error.name) {
                  msg = `${transactionType} failed: ${error.name}`;
                }
              }

              toast.error(msg);
              callback?.({ finalized: true, status: "ERROR", message: msg });
            }
          }
        },
      );
    } catch (err) {
      toast.error(err as string);
    }
  }

  // == Transactions ==

  async function addStake({
    validator,
    amount,
    callback,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.addStake) return;

    const transaction = api.tx.subspaceModule.addStake(
      validator,
      calculateAmount(amount),
    );
    await sendTransaction("Staking", transaction, callback);
  }

  async function removeStake({
    validator,
    amount,
    callback,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.removeStake) return;

    const transaction = api.tx.subspaceModule.removeStake(
      validator,
      calculateAmount(amount),
    );
    await sendTransaction("Unstaking", transaction, callback);
  }

  async function transfer({ to, amount, callback }: Transfer): Promise<void> {
    if (!api?.tx.balances.transfer) return;

    const transaction = api.tx.balances.transfer(to, calculateAmount(amount));
    await sendTransaction("Transfer", transaction, callback);
  }

  async function transferStake({
    fromValidator,
    toValidator,
    amount,

    callback,
  }: TransferStake): Promise<void> {
    if (!api?.tx.subspaceModule?.transferStake) return;

    const transaction = api.tx.subspaceModule.transferStake(
      fromValidator,
      toValidator,
      calculateAmount(amount),
    );
    await sendTransaction("Transfer Stake", transaction, callback);
  }

  // == Governance ==

  async function voteProposal({
    proposalId,
    vote,
    callback,
  }: Vote): Promise<void> {
    if (!api?.tx.governanceModule?.voteProposal) return;

    const transaction = api.tx.governanceModule.voteProposal(proposalId, vote);
    await sendTransaction("Vote", transaction, callback);
  }

  async function addCustomProposal({
    IpfsHash,
    callback,
  }: AddCustomProposal): Promise<void> {
    if (!api?.tx.governanceModule?.addGlobalCustomProposal) return;

    const transaction =
      api.tx.governanceModule.addGlobalCustomProposal(IpfsHash);
    await sendTransaction("Create Custom Proposal", transaction, callback);
  }

  async function addDaoApplication({
    IpfsHash,
    applicationKey,
    callback,
  }: AddDaoApplication): Promise<void> {
    if (!api?.tx.governanceModule?.addDaoApplication) return;

    const transaction = api.tx.governanceModule.addDaoApplication(
      applicationKey,
      IpfsHash,
    );
    await sendTransaction("Create S2 Application", transaction, callback);
  }

  async function updateDelegatingVotingPower({
    isDelegating,
    callback,
  }: UpdateDelegatingVotingPower): Promise<void> {
    if (
      !api?.tx.governanceModule?.enableVotePowerDelegation ||
      !api?.tx.governanceModule.disableVotePowerDelegation
    )
      return;

    const transaction = isDelegating
      ? api.tx.governanceModule.enableVotePowerDelegation()
      : api.tx.governanceModule.disableVotePowerDelegation();

    await sendTransaction("Create Custom Proposal", transaction, callback);
  }

  // Hooks

  // Last block with API
  const { data: lastBlock, isLoading: isLastBlockLoading } = useLastBlock(api);

  // Balance

  const { data: balance, isLoading: isBalanceLoading } = useBalance(
    lastBlock?.apiAtBlock,
    selectedAccount?.address,
  );

  // Dao Treasury
  const { data: daoTreasury, isLoading: isDaoTreasuryLoading } = useDaoTreasury(
    lastBlock?.apiAtBlock,
  );

  // Not Delegating Voting Power Set
  const { data: notDelegatingVoting, isLoading: isNotDelegatingVotingLoading } =
    useNotDelegatingVoting(lastBlock?.apiAtBlock);

  // Stake Out
  const { data: stakeOut, isLoading: isStakeOutLoading } = useAllStakeOut(
    lastBlock?.apiAtBlock,
  );

  // Proposals
  const { data: proposalQuery, isLoading: isProposalsLoading } = useProposals(
    lastBlock?.apiAtBlock,
  );

  // Custom Metadata for Proposals
  const customProposalMetadataQueryMap = useCustomMetadata<BaseProposal>(
    "proposal",
    lastBlock,
    proposalQuery,
  );
  for (const entry of customProposalMetadataQueryMap.entries()) {
    const [id, query] = entry;
    const { data } = query;
    if (data == null) {
      // eslint-disable-next-line no-console
      console.info(`Missing custom proposal metadata for proposal ${id}`);
    }
  }

  const proposalsWithMeta = proposalQuery?.map((proposal) => {
    const id = proposal.id;
    const metadataQuery = customProposalMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return proposal;
    }
    const [, customData] = data;
    return { ...proposal, customData };
  });

  // Daos

  const { data: daosQuery, isLoading: isDaosLoading } = useDaos(
    lastBlock?.apiAtBlock,
  );
  const customDaoMetadataQueryMap = useCustomMetadata<BaseDao>(
    "dao",
    lastBlock,
    daosQuery,
  );
  for (const entry of customDaoMetadataQueryMap.entries()) {
    const [id, query] = entry;
    const { data } = query;
    if (data == null) {
      // eslint-disable-next-line no-console
      console.info(`Missing custom dao metadata for dao ${id}`);
    }
  }

  const daosWithMeta = daosQuery?.map((dao) => {
    const id = dao.id;
    const metadataQuery = customDaoMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return dao;
    }
    const [, customData] = data;
    return { ...dao, customData };
  });

  return (
    <CommuneContext.Provider
      value={{
        api,
        isConnected,
        isInitialized,

        accounts,
        selectedAccount,
        handleConnect: handleConnectWrapper,

        balance,
        isBalanceLoading,

        addStake,
        removeStake,
        transfer,
        transferStake,

        voteProposal,
        addCustomProposal,
        addDaoApplication,

        updateDelegatingVotingPower,

        lastBlock,
        isLastBlockLoading,

        daoTreasury,
        isDaoTreasuryLoading,

        notDelegatingVoting,
        isNotDelegatingVotingLoading,

        stakeOut,
        isStakeOutLoading,

        proposalsWithMeta,
        isProposalsLoading,

        daosWithMeta,
        isDaosLoading,
      }}
    >
      <Wallet
        addStake={addStake}
        balance={formatToken(balance || 0n)}
        handleConnect={handleConnect}
        handleWalletModal={handleWalletModal}
        setSelectedAccount={setSelectedAccount}
        handleWalletSelections={handleWalletSelections}
        isInitialized={isInitialized}
        openWalletModal={openWalletModal}
        removeStake={removeStake}
        selectedAccount={selectedAccount}
        stakeOut={stakeOut}
        transfer={transfer}
        transferStake={transferStake}
        wallets={accounts}
      />
      {children}
    </CommuneContext.Provider>
  );
}

export const useCommune = (): CommuneContextType => {
  const context = useContext(CommuneContext);
  if (context === null) {
    throw new Error("useCommune must be used within a CommuneProvider");
  }
  return context;
};
