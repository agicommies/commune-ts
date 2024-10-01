// filters.tsx
"use client"

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLongDownIcon } from "@heroicons/react/16/solid";
import type { Category } from "./categories-selector";
import { CategoriesSelector } from "./categories-selector";

type SortField = "date" | "upvotes"
type SortOrder = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
  date: "Date",
  upvotes: "Upvotes",
};

const orderStyles: Record<SortOrder, string> = {
  asc: "rotate-0",
  desc: "-rotate-180"
};

export const Filters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<SortField>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("sortBy") as SortField) || "date"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("order") as SortOrder) || "desc"
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sortBy", sortField);
    newSearchParams.set("order", sortOrder);
    if (selectedCategory) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newSearchParams.set("category", selectedCategory.category!);
    } else {
      newSearchParams.delete("category");
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [sortField, sortOrder, selectedCategory, router, searchParams]);

  const handleSortChange = useCallback((field: SortField) => {
    setSortField(field);
    setSortOrder(prevOrder => field === sortField ? (prevOrder === "asc" ? "desc" : "asc") : "asc");
  }, [sortField]);

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex gap-4">
      <CategoriesSelector
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      {(Object.entries(sortFieldLabels) as [SortField, string][]).map(([field, label]) => (
        <button
          key={field}
          onClick={() => handleSortChange(field)}
          className={`flex animate-fade justify-center items-center gap-1 px-4 pl-8 py-1.5 text-sm font-semibold border
            ${sortField === field ? 'border-green-500 bg-green-500/10 text-green-500' : 'bg-white/5  border-white/20 hover:border-green-500 hover:text-green-500'}`}
        >
          {label}
          <ArrowLongDownIcon
            height={16}
            className={`transition duration-200 animate-delay-700
              ${sortField === field ? orderStyles[sortOrder] : 'invisible'}`}
          />
        </button>
      ))}
    </div>
  );
}
