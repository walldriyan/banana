// src/components/inventory/AddLostDamageForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lostAndDamageSchema, type LostAndDamageFormValues } from "@/lib/validation/inventory.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { addLostAndDamageAction } from "@/lib/actions/inventory.actions";
import { getProductBatchesAction } from "@/lib/actions/product.actions";
import { useState, useEffect, useMemo } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, Wallet } from "lucide-react";
import type { ProductBatch } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";


export function AddLostDamageForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchBatches() {
      const result = await getProductBatchesAction();
      if (result.success && result.data) {
        setBatches(result.data.filter(b => parseFloat(b.stock) > 0)); // Only show batches with stock
      }
    }
    fetchBatches();
  }, []);

  const form = useForm<LostAndDamageFormValues>({
    resolver: zodResolver(lostAndDamageSchema),
    defaultValues: {
      date: new Date(),
      productBatchId: "",
      quantity: 1,
      reason: "DAMAGED",
      notes: "",
    },
  });

  const selectedBatchId = form.watch("productBatchId");
  const quantity = form.watch("quantity");
  
  const { selectedBatch, maxQuantity, totalValue } = useMemo(() => {
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) {
      return { selectedBatch: null, maxQuantity: 0, totalValue: 0 };
    }
    const stock = parseFloat(batch.stock);
    const cost = batch.costPrice ?? 0;
    const value = (quantity || 0) * cost;
    return { selectedBatch: batch, maxQuantity: stock, totalValue: value };
  }, [selectedBatchId, quantity, batches]);


  async function onSubmit(data: LostAndDamageFormValues) {
    setIsSubmitting(true);
    const result = await addLostAndDamageAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Record Added!",
        description: `Stock for the selected batch has been adjusted.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error adding record",
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="productBatchId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Product Batch</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectedBatch
                        ? selectedBatch.product.name + ` (Batch: ${selectedBatch.batchNumber})`
                        : "Select product batch"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search batch..." />
                    <CommandList>
                        <CommandEmpty>No batch found.</CommandEmpty>
                        <CommandGroup>
                        {batches.map((batch) => (
                            <CommandItem
                            value={`${batch.product.name} ${batch.batchNumber}`}
                            key={batch.id}
                            onSelect={() => {
                                form.setValue("productBatchId", batch.id)
                                setOpen(false)
                            }}
                            >
                            {batch.product.name} (Batch: {batch.batchNumber}) - Stock: {batch.stock}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
           <div className="space-y-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quantity Lost/Damaged</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0" {...field} max={maxQuantity} />
                        </FormControl>
                        <FormMessage />
                        {selectedBatchId && <p className="text-xs text-muted-foreground">Max available: {maxQuantity}</p>}
                    </FormItem>
                )} />

                <Card className="bg-destructive/10 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                            <Wallet className="h-5 w-5" />
                            Total Value Write-Off
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-destructive">
                           Rs. {totalValue.toFixed(2)}
                        </p>
                         {selectedBatch && (
                            <p className="text-xs text-destructive/80 mt-1">
                                ({quantity} units &times; Rs. {selectedBatch.costPrice?.toFixed(2)} cost)
                            </p>
                        )}
                    </CardContent>
                </Card>
           </div>
           <div className="space-y-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem><FormLabel>Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                                <SelectItem value="LOST">Lost / Theft</SelectItem>
                                <SelectItem value="EXPIRED">Expired</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
           </div>
        </div>

        
        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any relevant notes about the incident..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
