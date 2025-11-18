// src/components/purchases/GrnProductSearch.tsx
"use client"

import * as React from "react"
import { ChevronsUpDown, PackageSearch } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Product } from "@/types"

// This component will now search MASTER products, not batches.
type SearchableItem = {
  value: string; // Master product ID
  label: string; // Master product name
  product: Product;
};

interface GrnProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function GrnProductSearch({
  products,
  onProductSelect,
  placeholder = "Select product...",
  searchPlaceholder = "Search by name or barcode...",
  emptyText = "No product found."
}: GrnProductSearchProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const searchableItems = React.useMemo(() => {
    return products.map(p => ({
        value: p.id.toLowerCase(),
        label: p.name,
        product: p,
    }));
  }, [products]);


  const handleSelect = (currentValue: string) => {
    const selectedItem = searchableItems.find(item => item.value === currentValue);
    if (selectedItem) {
        onProductSelect(selectedItem.product);
    }
    setInputValue(""); // Reset input after selection
    inputRef.current?.blur(); // Unfocus after selection
  }

  return (
     <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <div className="relative">
            <CommandInput
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                placeholder={searchPlaceholder}
                className="h-12 text-base pl-10"
            />
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        
        {inputValue.length > 0 && (
            <div className="relative mt-1">
                <CommandList className="absolute w-full z-10 top-0 rounded-lg border bg-white shadow-lg">
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                        {searchableItems
                         .filter(item => 
                            item.label.toLowerCase().includes(inputValue.toLowerCase())
                          )
                         .map((item) => (
                            <CommandItem
                                key={item.value}
                                value={item.value}
                                onSelect={handleSelect}
                                className="cursor-pointer"
                            >
                                <div className="flex justify-between w-full">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.label}</span>
                                      <span className="text-xs text-gray-500">Category: {item.product.category}</span>
                                    </div>
                                    <span className="font-semibold text-gray-600">{item.product.brand}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </div>
        )}
    </Command>
  )
}
