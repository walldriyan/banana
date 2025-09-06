// src/components/history/TransactionSearchBar.tsx
'use client';
import React from 'react';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

interface TransactionSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function TransactionSearchBar({ searchQuery, setSearchQuery }: TransactionSearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder="Search by Transaction ID or Name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 h-11"
        // For barcode scanners that might need focus
        id="transaction-search-input" 
      />
    </div>
  );
}
