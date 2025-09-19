// src/components/credit/AddPaymentForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentFormValues } from "@/lib/validation/credit.schema";
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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { CreditorGrn } from "@/app/dashboard/credit/CreditClientPage";
import { addPaymentAction } from "@/lib/actions/credit.actions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface AddPaymentFormProps {
  grn: CreditorGrn;
  onSuccess: () => void;
}

export function AddPaymentForm({ grn, onSuccess }: AddPaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const balance = grn.totalAmount - grn.totalPaid;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      grnId: grn.id,
      amount: balance > 0 ? balance : 0,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      notes: '',
    },
  });

  async function onSubmit(data: PaymentFormValues) {
    if (data.amount > balance) {
        form.setError("amount", {
            type: "manual",
            message: "Payment cannot be more than the balance due.",
        });
        return;
    }
    setIsSubmitting(true);
    const result = await addPaymentAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Payment Added!",
        description: `Payment of Rs. ${data.amount.toFixed(2)} has been successfully recorded.`,
      });
      onSuccess(); // This will refresh the lists
    } else {
      toast({
        variant: "destructive",
        title: "Error adding payment",
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Payment Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter amount paid" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
         <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select method"/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online">Online Transfer</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                 <FormControl>
                    <Textarea placeholder="e.g., Cheque number, transaction ID" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
