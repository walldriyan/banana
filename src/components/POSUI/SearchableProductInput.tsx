
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
import { type Product, type ProductBatch } from "@/types"

// Flatten products and batches into a single list for the dropdown
type SearchableItem = {
  value: string;
  label: string;
  product: Product;
  batch?: ProductBatch;
  stock: number;
  price: number;
};

interface SearchableProductInputProps {
  products: Product[];
  onProductSelect: (product: Product, batch?: ProductBatch) => void;
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
  placeholder = "Select product or batch...",
  searchPlaceholder = "Search by name or barcode...",
  emptyText = "No product found."
}, ref) => {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Expose a function to focus the input to the parent component
  useImperativeHandle(ref, () => ({
    focusSearchInput: () => {
      // console.log('// 8. Focus කිරීමට Command ලැබුනා, Input එක:', inputRef.current);
      inputRef.current?.focus();
    }
  }));

  const searchableItems = React.useMemo(() => {
    const items: SearchableItem[] = [];
    products.forEach(p => {
      if (p.batches && p.batches.length > 0) {
        p.batches.forEach(b => {
          items.push({
            value: b.id.toLowerCase(), // Use batch ID as unique value
            label: `${p.name} (Batch: ${b.batchNumber})`,
            product: p,
            batch: b,
            stock: b.quantity,
            price: b.sellingPrice,
          });
        });
      } else {
        items.push({
          value: p.id.toLowerCase(), // Use product ID as unique value
          label: p.name,
          product: p,
          stock: p.stock,
          price: p.sellingPrice,
        });
      }
    });
    return items;
  }, [products]);


  const handleSelect = (currentValue: string) => {
    const selectedItem = searchableItems.find(item => item.value === currentValue);
    if (selectedItem) {
        onProductSelect(selectedItem.product, selectedItem.batch);
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
                         .filter(item => item.label.toLowerCase().includes(inputValue.toLowerCase()))
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
                                    <span className="text-xs text-gray-500">Stock: {item.stock} units</span>
                                    </div>
                                    <span className="font-semibold">Rs. {item.price.toFixed(2)}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </div>
        )}
    </Command>
  )
});

SearchableProductInput.displayName = "SearchableProductInput";

export default SearchableProductInput;
