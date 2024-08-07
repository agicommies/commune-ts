"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUpIcon } from "@heroicons/react/24/outline";

import { useCommune } from "@commune-ts/providers/use-commune";
import { smallAddress } from "@commune-ts/providers/utils";

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
  const { selectedAccount } = useCommune();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data: userModuleData, error } = api.module.byUserModuleData.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

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
      await deleteUserModuleData.mutateAsync({
        userKey: selectedAccount.address,
      });

      // Submit new user module data
      for (const delegatedModule of delegatedModules) {
        await createUserModuleData.mutateAsync({
          userKey: selectedAccount.address,
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
        <div className="fixed bottom-0 right-0 mt-8 w-full min-w-96 animate-fade-up border border-white/20 bg-[#898989]/5 backdrop-blur-md md:bottom-14 md:mr-4 md:w-fit">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between p-2 text-xl font-semibold text-white"
          >
            <span>Your Module List</span>
            <span>
              <ChevronUpIcon
                className={`h-6 w-6 transform transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>
          {isOpen && (
            <div className="p-2 pt-2">
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
                      className="mr-2 w-16 bg-[#898989]/10 p-1 text-white"
                      min="0"
                      max="100"
                    />
                    <span className="mr-2 text-white">%</span>
                    <button
                      onClick={() => removeModule(module.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 animate-fade-up text-white animate-delay-200">
                Total Percentage: {totalPercentage}%
                {totalPercentage !== 100 && (
                  <span className="ml-2 text-red-500">
                    {totalPercentage > 100 ? "Exceeds" : "Does not equal"} 100%
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  className={`mt-4 w-full animate-fade border border-white/20 bg-[#898989]/5 p-2 text-white backdrop-blur-md transition duration-200 animate-delay-300 ${
                    isSubmitting ||
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
                {hasUnsavedChanges() && (
                  <div className="mb-4 bg-yellow-500/20 p-2 text-center text-yellow-500">
                    You have unsaved changes. Please submit them before leaving
                    the page.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
