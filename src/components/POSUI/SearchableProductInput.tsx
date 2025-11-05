// src/components/POSUI/SearchableProductInput.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Package, PackageSearch } from "lucide-react"
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

type GroupedProducts = {
  [productName: string]: ProductBatch[];
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

  useImperativeHandle(ref, () => ({
    focusSearchInput: () => {
      inputRef.current?.focus();
    }
  }));

  const groupedProducts = React.useMemo(() => {
    const filteredAndSorted = products
      .filter(p => p.stock > 0) // Ignore zero stock items
      .sort((a, b) => a.product.name.localeCompare(b.product.name));

    return filteredAndSorted.reduce((acc, batch) => {
      const productName = batch.product.name;
      if (!acc[productName]) {
        acc[productName] = [];
      }
      acc[productName].push(batch);
      return acc;
    }, {} as GroupedProducts);
  }, [products]);

  const handleSelect = (batchId: string) => {
    const selectedBatch = products.find(p => p.id === batchId);
    if (selectedBatch) {
      onProductSelect(selectedBatch);
    }
    setInputValue(""); // Reset input after selection
    inputRef.current?.blur(); // Unfocus after selection
  }
  
  const filteredGroups = React.useMemo(() => {
    if (!inputValue) return groupedProducts;

    const lowercasedQuery = inputValue.toLowerCase();
    const filtered: GroupedProducts = {};

    for (const productName in groupedProducts) {
      const batches = groupedProducts[productName];
      const matchingBatches = batches.filter(
        batch =>
          batch.product.name.toLowerCase().includes(lowercasedQuery) ||
          batch.batchNumber.toLowerCase().includes(lowercasedQuery) ||
          batch.barcode?.toLowerCase().includes(lowercasedQuery)
      );
      if (matchingBatches.length > 0) {
        filtered[productName] = matchingBatches;
      }
    }
    return filtered;
  }, [inputValue, groupedProducts]);

  return (
     <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <div className="relative">
            <CommandInput
                ref={inputRef}
                id="global-product-search-input"
                value={inputValue}
                onValueChange={setInputValue}
                placeholder={searchPlaceholder}
                className="h-12 text-base pl-10"
            />
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        
        {inputValue.length > 0 && (
            <div className="relative mt-1">
                <CommandList className="absolute w-full z-50 top-0 rounded-lg border bg-background shadow-lg">
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    {Object.keys(filteredGroups).map(groupName => (
                      <CommandGroup key={groupName} heading={groupName}>
                        {filteredGroups[groupName].map(batch => {
                          const units = typeof batch.product.units === 'string'
                            ? JSON.parse(batch.product.units)
                            : batch.product.units;
                          
                          const stockColor = batch.stock <= 5 ? 'text-red-600' : 'text-green-600';

                          return (
                            <CommandItem
                              key={batch.id}
                              value={batch.id}
                              onSelect={() => handleSelect(batch.id)}
                              className="cursor-pointer group"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">
                                      Batch: <span className="text-primary">{batch.batchNumber}</span>
                                    </p>
                                    <p className={cn("text-sm font-semibold group-aria-selected:text-accent-foreground", stockColor)}>
                                      Stock: {batch.stock} {units.baseUnit}
                                    </p>
                                  </div>
                                </div>
                                <span className={cn("font-bold text-lg group-aria-selected:text-accent-foreground")}>Rs. {batch.sellingPrice.toFixed(2)}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                </CommandList>
            </div>
        )}
    </Command>
  )
});

SearchableProductInput.displayName = "SearchableProductInput";

export default SearchableProductInput;
