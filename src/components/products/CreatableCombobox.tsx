// src/components/products/CreatableCombobox.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
    value: string
    label: string
}

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string, isNew: boolean) => void;
  placeholder?: string;
  creatable?: boolean;
}

export function CreatableCombobox({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option...",
    creatable = true 
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const currentSelection = options.find(
    (option) => option.value.toLowerCase() === value?.toLowerCase()
  )

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(
      (option) => option.value.toLowerCase() === currentValue.toLowerCase()
    );
    if (selectedOption) {
      onChange(selectedOption.value, false);
    }
    setOpen(false);
  }

  const handleCreate = () => {
    if (creatable && inputValue) {
        // Check if a case-insensitive match already exists
        const existingOption = options.find(
            option => option.label.toLowerCase() === inputValue.toLowerCase()
        );
        if (existingOption) {
             onChange(existingOption.value, false);
        } else {
             onChange(inputValue, true); // Pass the label as the new value
        }
    }
    setOpen(false);
  }
  
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {currentSelection ? currentSelection.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search or create..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && inputValue && creatable ? (
                <CommandItem
                    onSelect={handleCreate}
                    className="cursor-pointer"
                >
                    Create "{inputValue}"
                </CommandItem>
            ) : (
                 <CommandEmpty>No results found.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
