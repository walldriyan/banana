// src/components/POSUI/SearchableProductInput.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PackageSearch } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

export default function SearchableProductInput({
  products,
  onProductSelect,
  placeholder = "Select product or batch...",
  searchPlaceholder = "Search by name or barcode...",
  emptyText = "No product found."
}: SearchableProductInputProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

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
    setOpen(false);
    setValue(""); // Reset after selection
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 text-base"
        >
          <div className="flex items-center">
             <PackageSearch className="mr-2 h-5 w-5 shrink-0 opacity-50" />
            {value
              ? searchableItems.find((item) => item.value === value)?.label
              : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            className="h-11 text-base"
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {searchableItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
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
        </Command>
      </PopoverContent>
    </Popover>
  )
}
