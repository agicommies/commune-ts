"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { useCommune } from "@commune-ts/providers/use-commune";
import { formatToken, smallAddress } from "@commune-ts/utils";

import { useDelegateStore } from "~/stores/delegateStore";
import { api } from "~/trpc/react";

export function DelegatedModulesList() {
  const {
    delegatedModules,
    updatePercentage,
    removeModule,
    getTotalPercentage,
    setDelegatedModulesFromDB,
    updateOriginalModules,
    hasUnsavedChanges,
  } = useDelegateStore();
  const totalPercentage = getTotalPercentage();
  const { selectedAccount, userTotalStaked } = useCommune();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data: userModuleData, error } = api.module.byUserModuleData.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  const validatorAddresses = [
    "5DUWKpGBneBbna6PFHZk18Gp9wyvLUFPiWy5maAARjRjayPp",
    "5HEUfzHf8uRUq1AfX2Wgga9xC2u12wfyF4FTKUMaYvDFH7dw",
  ];

  function userWeightPower(
    userStakes: { address: string; stake: string }[] | undefined,
    validatorAddresses: string[],
  ) {
    if (!userStakes) {
      return BigInt(0);
    }
    const data = userStakes
      .filter((stake) => validatorAddresses.includes(stake.address))
      .reduce((sum, stake) => sum + BigInt(stake.stake), BigInt(0));

    return formatToken(Number(data));
  }

  const userStakeWeight = userWeightPower(userTotalStaked, validatorAddresses);

  useEffect(() => {
    if (error) {
      console.error("Error fetching user module data:", error);
    }
    if (userModuleData) {
      const formattedModules = userModuleData.map((module) => ({
        id: module.module_data.id,
        address: module.module_data.moduleKey,
        title: module.module_data.name ?? "",
        name: module.module_data.name ?? "",
        percentage: module.user_module_data.weight,
      }));
      setDelegatedModulesFromDB(formattedModules);
    }
  }, [userModuleData, error, setDelegatedModulesFromDB, selectedAccount]);

  const handlePercentageChange = (id: number, percentage: number) => {
    if (percentage >= 0 && percentage <= 100) {
      updatePercentage(id, percentage);
    }
  };

  const createUserModuleData = api.module.createUserModuleData.useMutation({
    onSuccess: () => {
      router.refresh();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error submitting data:", error);
      setIsSubmitting(false);
    },
  });

  const deleteUserModuleData = api.module.deleteUserModuleData.useMutation({
    onSuccess: () => {
      console.log("User module data deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting user module data:", error);
    },
  });

  const handleSubmit = async () => {
    if (!selectedAccount?.address || totalPercentage !== 100) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Delete existing user module data
      await deleteUserModuleData.mutateAsync();

      // Submit new user module data
      for (const delegatedModule of delegatedModules) {
        await createUserModuleData.mutateAsync({
          moduleId: delegatedModule.id,
          weight: delegatedModule.percentage,
        });
      }

      updateOriginalModules();

      // Fetch updated data from the database
      const { data: userModuleData } = api.module.byUserModuleData.useQuery(
        { userKey: selectedAccount.address },
        { enabled: !!selectedAccount.address },
      );

      // Update the store with the new data
      const formattedModules = userModuleData?.map((module) => ({
        id: module.module_data.id,
        address: module.module_data.moduleKey,
        title: module.module_data.name ?? "",
        name: module.module_data.name ?? "",
        percentage: module.user_module_data.weight,
      }));
      setDelegatedModulesFromDB(formattedModules ?? []);

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  return (
    <>
      {selectedAccount?.address && (
        <div className="fixed bottom-0 right-0 z-50 mt-8 flex w-full flex-col-reverse text-sm md:bottom-4 md:mr-4 md:w-fit">
          <div className="flex animate-fade-up items-center justify-between divide-white/20 rounded-full border border-white/20 bg-[#898989]/5 font-semibold text-white backdrop-blur-md">
            <span className="flex">
              <p className="border-r border-white/20 px-3 pl-5">
                <b className="text-green-500">{delegatedModules.length}</b>{" "}
                Modules
              </p>
              <span className="border-r border-white/20 px-3">
                <b
                  className={`${totalPercentage !== 100 ? "text-amber-500" : "text-green-500"}`}
                >
                  {totalPercentage}%
                </b>{" "}
                Weighted{" "}
                {totalPercentage !== 100 && (
                  <span className="text-amber-500">
                    ({totalPercentage > 100 ? "Exceeds" : "Does not equal"}{" "}
                    100%)
                  </span>
                )}
              </span>
              <span className="border-r border-white/20 px-3">
                <div className="flex gap-1 text-white">
                  <b className="text-amber-500">{userStakeWeight}</b> COMAI{" "}
                  <p className="text-sm">(Weight Power)</p>
                </div>
              </span>
              <span className="px-3">
                {hasUnsavedChanges() ? (
                  <span className="font-semibold text-red-500">
                    Careful! You have unsaved changes
                  </span>
                ) : (
                  <span className="font-semibold text-green-500">
                    All changes saved!
                  </span>
                )}
              </span>
            </span>
            <span>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex w-fit items-center gap-1 text-nowrap rounded-full border border-green-500 bg-green-600/15 px-5 py-3 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
              >
                <span>{isOpen ? "COLLAPSE VIEW" : "EXPAND VIEW"}</span>
                <span>
                  <ChevronUpIcon
                    className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                </span>
              </button>
            </span>
          </div>
          {isOpen && (
            <div className="mb-2 flex animate-fade-up flex-col divide-white/20 rounded-3xl border border-white/20 bg-[#898989]/5 p-4 font-semibold text-white backdrop-blur-md">
              <div className="mb-2 grid grid-cols-3 gap-6 border-b border-white/20 pb-2 text-sm font-semibold text-gray-400 md:grid-cols-4">
                <div>Module</div>
                <div className="hidden md:block">Name</div>
                <div>Address</div>
                <div>Percentage</div>
              </div>
              {delegatedModules.map((module) => (
                <div
                  key={module.id}
                  className="mb-2 grid animate-fade-up grid-cols-3 items-center gap-6 border-b border-white/20 pb-2 text-sm animate-delay-100 md:grid-cols-4"
                >
                  <div className="text-white">{module.title}</div>
                  <div className="hidden text-white md:block">
                    {module.name}
                  </div>
                  <div className="text-gray-400">
                    {smallAddress(module.address)}
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={module.percentage}
                      onChange={(e) =>
                        handlePercentageChange(
                          module.id,
                          Number(e.target.value),
                        )
                      }
                      className="mr-1 w-12 bg-[#898989]/10 p-1 text-white"
                      min="0"
                      max="100"
                    />
                    <span className="mr-2 text-white">%</span>
                    <button
                      onClick={() => removeModule(module.id)}
                      className="ml-2 flex items-center rounded-full bg-red-500/10 p-1 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  className={`mt-4 w-full animate-fade rounded-full border border-white/20 bg-[#898989]/5 p-2 text-white backdrop-blur-md transition duration-200 animate-delay-300 ${isSubmitting ||
                    totalPercentage !== 100 ||
                    (!selectedAccount.address &&
                      `hover:border-green-500 hover:bg-green-500/10`)
                    } disabled:opacity-50`}
                  disabled={
                    isSubmitting ||
                    totalPercentage !== 100 ||
                    !selectedAccount.address
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
