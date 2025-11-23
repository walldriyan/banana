// src/components/transaction/CustomerInfoPanel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormItem, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import type { Customer } from '@prisma/client';

interface CustomerInfoPanelProps {
  customers: Customer[];
}

export function CustomerInfoPanel({ customers }: CustomerInfoPanelProps) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const [open, setOpen] = useState(false);
  const customerName = watch('customer.name');

  useEffect(() => {
     // If the name is cleared or doesn't match any customer, reset to walk-in
    if (customerName === '') {
       setValue('customer.name', 'Walk-in Customer');
       setValue('customer.phone', '');
       setValue('customer.address', '');
    }
  }, [customerName, setValue]);


  const handleSelectCustomer = (customer: Customer) => {
    setValue('customer.name', customer.name);
    setValue('customer.phone', customer.phone || '');
    setValue('customer.address', customer.address || '');
    setOpen(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement) {
      if (!e.target.closest('[role="combobox"]')) { // Don't interfere with combobox selection
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        
        const focusable = Array.from(
          form.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled'));

        const index = focusable.indexOf(e.target);

        if (index > -1 && index < focusable.length - 1) {
          focusable[index + 1].focus();
        }
      }
    }
  };

  // Create a unique list of customers by name to prevent duplicates in the dropdown
  const uniqueCustomers = customers.reduce((acc, current) => {
    if (!acc.find(item => item.name === current.name)) {
      acc.push(current);
    }
    return acc;
  }, [] as Customer[]);

  return (
    <Card onKeyDown={handleKeyDown} className="h-full">
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <Label htmlFor="customerName">Customer Name</Label>
           <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{customerName || "Select customer..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                           <CommandItem
                                key="walk-in"
                                value="Walk-in Customer"
                                onSelect={() => {
                                    setValue('customer.name', 'Walk-in Customer');
                                    setValue('customer.phone', '');
                                    setValue('customer.address', '');
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", customerName === 'Walk-in Customer' ? "opacity-100" : "opacity-0")} />
                                Walk-in Customer
                            </CommandItem>
                            {uniqueCustomers
                              .filter(customer => customer.name !== 'Walk-in Customer') // Exclude walk-in from the main list
                              .map((customer) => (
                              <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => handleSelectCustomer(customer)}
                              >
                                  <Check className={cn("mr-2 h-4 w-4", customer.name === customerName ? "opacity-100" : "opacity-0" )} />
                                  {customer.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                  </Command>
              </PopoverContent>
          </Popover>
          <Input
            id="customerName"
            {...register('customer.name')}
            className="hidden" // Hide the original input, we only use it for form state
          />
          {errors.customer?.name && (
            <FormMessage>{errors.customer.name.message?.toString()}</FormMessage>
          )}
        </FormItem>
        <FormItem>
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            {...register('customer.phone')}
            placeholder="e.g., 0771234567"
          />
           {errors.customer?.phone && (
            <FormMessage>{errors.customer.phone.message?.toString()}</FormMessage>
          )}
        </FormItem>
        <FormItem>
          <Label htmlFor="customerAddress">Address</Label>
          <Input
            id="customerAddress"
            {...register('customer.address')}
            placeholder="e.g., 123, Main St, Colombo"
          />
           {errors.customer?.address && (
            <FormMessage>{errors.customer.address.message?.toString()}</FormMessage>
          )}
        </FormItem>
      </CardContent>
    </Card>
  );
}
