// src/components/history/TransactionSearchBar.tsx
'use client';
import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { format } from 'date-fns';
import { ReceiptText } from 'lucide-react';

interface TransactionSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allTransactions: DatabaseReadyTransaction[];
}

export function TransactionSearchBar({ searchQuery, setSearchQuery, allTransactions }: TransactionSearchBarProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSelect = (transactionId: string) => {
        setSearchQuery(transactionId);
        setInputValue(''); // Reset the visual input to clear the dropdown
    };

    // Filter transactions for suggestions only when input value is present
    const suggestedTransactions = inputValue.length > 1 
        ? allTransactions.filter(tx => {
            const query = inputValue.toLowerCase();
            const txIdMatch = tx.transactionHeader.transactionId.toLowerCase().includes(query);
            const customerNameMatch = tx.customerDetails.name.toLowerCase().includes(query);
            return txIdMatch || customerNameMatch;
          }).slice(0, 10) // Limit suggestions to the top 10
        : [];

    return (
        <Command shouldFilter={false} className="overflow-visible bg-transparent">
            <div className="relative">
                <CommandInput
                    id="transaction-search-input"
                    placeholder="Search by ID or Name..."
                    value={inputValue}
                    onValueChange={setInputValue}
                    onBlur={() => {
                        // When blurring, if there's text, set it as the final search query
                        if (inputValue) {
                            setSearchQuery(inputValue);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setSearchQuery(inputValue);
                        }
                    }}
                    className="w-full h-11"
                />
            </div>

            {suggestedTransactions.length > 0 && (
                <div className="relative mt-1">
                    <CommandList className="absolute w-full z-20 top-0 rounded-lg border bg-white shadow-lg">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {suggestedTransactions.map(tx => (
                                <CommandItem
                                    key={tx.transactionHeader.transactionId}
                                    value={tx.transactionHeader.transactionId}
                                    onSelect={() => handleSelect(tx.transactionHeader.transactionId)}
                                    className="cursor-pointer flex justify-between w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <ReceiptText className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="font-medium">{tx.customerDetails.name}</p>
                                            <p className="text-xs text-gray-500">{tx.transactionHeader.transactionId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">Rs. {tx.transactionHeader.finalTotal.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(tx.transactionHeader.transactionDate), 'PP')}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </div>
            )}
        </Command>
    );
}