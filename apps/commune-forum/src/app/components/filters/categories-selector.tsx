'use client'

import { useMemo } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

export interface Category {
  category: string | null;
  name: string;
}

const defaultCategory: Category = { category: null, name: 'Select a category' };

const categories: Category[] = [
  { category: "offtopic", name: 'OFFTOPIC' },
  { category: "update", name: 'UPDATE' },
];

interface CategoriesSelectorProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export const CategoriesSelector: React.FC<CategoriesSelectorProps> = ({ selectedCategory, onCategoryChange }) => {
  const buttonClasses = useMemo(() => [
    "relative w-full cursor-default bg-white/5 py-1.5 pl-3 pr-10 text-left",
    "border sm:text-sm sm:leading-6 hover:border-green-500 hover:cursor-pointer hover:text-green-500",
    selectedCategory ? "border-green-500 text-green-500" : "border-white/20"
  ].join(' '), [selectedCategory]);

  const optionsClasses = useMemo(() => [
    "absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-white/5 backdrop-blur-md p-0.5 border border-white/20",
    "text-base shadow-lg",
    "data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in",
    "sm:text-sm"
  ].join(' '), []);

  const optionClasses = useMemo(() => [
    "group relative cursor-default select-none py-2 pl-3 pr-9 text-white hover:cursor-pointer",
    "data-[focus]:bg-white/5 data-[focus]:text-green-500"
  ].join(' '), []);

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCategoryChange(null);
  };

  return (
    <Listbox value={selectedCategory} onChange={onCategoryChange}>
      <div className="relative w-[160px] m-0">
        <ListboxButton className={buttonClasses}>
          <span className="block truncate">{selectedCategory?.name ?? defaultCategory.name}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {selectedCategory ? (
              <XMarkIcon
                className="w-5 h-5 text-gray-400 cursor-pointer pointer-events-auto"
                onClick={handleClearSelection}
              />
            ) : (
              <ChevronUpDownIcon aria-hidden="true" className="w-5 h-5 text-gray-400" />
            )}
          </span>
        </ListboxButton>

        <ListboxOptions transition className={optionsClasses}>
          {[defaultCategory, ...categories].map((category) => (
            <ListboxOption
              key={category.category ?? 'default'}
              value={category.category === null ? null : category}
              className={optionClasses}
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                    {category.name}
                  </span>
                  {selected && category.category !== null && (
                    <span className={`absolute inset-y-0 right-0 flex items-center pr-4 text-green-500`}>
                      <CheckIcon aria-hidden="true" className="w-5 h-5" />
                    </span>
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
