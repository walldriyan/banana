
// src/components/POSUI/SearchableProductInput.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PackageSearch } from "lucide-react"
import { useImperativeHandle } from "react";

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { ProductBatch } from "@/types"

// Flatten products and batches into a single list for the dropdown
type SearchableItem = {
  value: string;
  label: string;
  product: ProductBatch;
  stock: number;
  price: number;
};

interface SearchableProductInputProps {
  products: ProductBatch[];
  onProductSelect: (product: ProductBatch) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export interface SearchableProductInputRef {
  focusSearchInput: () => void;
}

const SearchableProductInput = React.forwardRef<SearchableProductInputRef, SearchableProductInputProps>(({
  products,
  onProductSelect,
  placeholder = "Select product...",
  searchPlaceholder = "Search by name or barcode...",
  emptyText = "No product found."
}, ref) => {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Expose a function to focus the input to the parent component
  useImperativeHandle(ref, () => ({
    focusSearchInput: () => {
      inputRef.current?.focus();
    }
  }));

  const searchableItems = React.useMemo(() => {
    return products.map(p => ({
        value: p.id.toLowerCase(), // Use the unique product-batch ID
        label: `${p.product.name} (${p.batchNumber})`,
        product: p,
        stock: p.stock,
        price: p.sellingPrice,
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
                id="global-product-search-input" // This ID is crucial for the global keydown listener
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
                            item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                            item.product.barcode?.toLowerCase().includes(inputValue.toLowerCase())
                          )
                         .map((item) => {
                             const units = typeof item.product.product.units === 'string'
                                ? JSON.parse(item.product.product.units)
                                : item.product.product.units;

                            return (
                            <CommandItem
                                key={item.value}
                                value={item.value}
                                onSelect={handleSelect}
                                className="cursor-pointer"
                            >
                                <div className="flex justify-between w-full">
                                    <div className="flex flex-col">
                                    <span className="font-medium">{item.label}</span>
                                    <span className="text-xs text-gray-500">Stock: {item.stock} {units.baseUnit}</span>
                                    </div>
                                    <span className="font-semibold">Rs. {item.price.toFixed(2)}</span>
                                </div>
                            </CommandItem>
                        )})}
                    </CommandGroup>
                </CommandList>
            </div>
        )}
    </Command>
  )
});

SearchableProductInput.displayName = "SearchableProductInput";

export default SearchableProductInput;
