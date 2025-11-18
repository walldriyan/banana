// src/app/dashboard/finance/AddTransactionForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { financialTransactionSchema, type FinancialTransactionFormValues } from "@/lib/validation/finance.schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addTransactionAction, updateTransactionAction } from "@/lib/actions/finance.actions";
import { useState, useEffect } from "react";
import type { FinancialTransaction, Company, Customer, Supplier } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


interface AddTransactionFormProps {
  transaction?: FinancialTransaction;
  onSuccess: () => void;
  companies: Company[];
  customers: Customer[];
  suppliers: Supplier[];
}

export function AddTransactionForm({ transaction, onSuccess, companies, customers, suppliers }: AddTransactionFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isLinkingCardOpen, setIsLinkingCardOpen] = useState(false);
  const isEditMode = !!transaction;

  const form = useForm<FinancialTransactionFormValues>({
    resolver: zodResolver(financialTransactionSchema),
    defaultValues: {
      date: new Date(),
      type: 'EXPENSE',
      amount: 0,
      description: '',
      category: '',
      companyId: companies[0]?.id || '', // Automatically select the first company
    },
  });
  
  const transactionType = form.watch("type");

  useEffect(() => {
    if (isEditMode && transaction) {
      const hasLinks = !!transaction.customerId || !!transaction.supplierId;
      setIsLinkingCardOpen(hasLinks);
      form.reset({
        ...transaction,
        date: new Date(transaction.date),
        companyId: transaction.companyId ?? companies[0]?.id, // Ensure companyId has a value
        customerId: transaction.customerId ?? undefined,
        supplierId: transaction.supplierId ?? undefined,
      });
    }
  }, [transaction, isEditMode, form, companies]);

  async function onSubmit(data: FinancialTransactionFormValues) {
    setIsSubmitting(true);
    setSubmissionError(null);
    console.log("[AddTransactionForm] Submitting data:", data);
    
    const action = isEditMode
      ? updateTransactionAction(transaction!.id, data)
      : addTransactionAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: `Transaction ${isEditMode ? 'Updated' : 'Added'}!` });
      onSuccess();
    } else {
      console.error("Financial transaction submission failed:", result.error);
      setSubmissionError(result.error);
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not save the transaction. See error below." });
    }
  }

  const onError = (errors: any) => {
    console.error("[AddTransactionForm] Form validation errors:", errors);
    const errorString = JSON.stringify(errors, null, 2);
    setSubmissionError(`Client-side validation failed. Please check the form for errors. Details: ${errorString}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Main Details</CardTitle>
                <CardDescription>Enter the primary details for this transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="INCOME">Income</SelectItem>
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {transactionType === 'INCOME' ? (
                                        <>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="services">Services</SelectItem>
                                            <SelectItem value="other_income">Other Income</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="rent">Rent</SelectItem>
                                            <SelectItem value="salaries">Salaries</SelectItem>
                                            <SelectItem value="utilities">Utilities</SelectItem>
                                            <SelectItem value="supplies">Supplies</SelectItem>
                                            <SelectItem value="other_expense">Other Expense</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
                <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormControl><Textarea {...field} placeholder="e.g., Monthly electricity bill" /></FormControl><FormMessage /></FormItem>
                )} />
            </CardContent>
        </Card>
       
        <Collapsible open={isLinkingCardOpen} onOpenChange={setIsLinkingCardOpen}>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Link to (Optional)</CardTitle>
                      <CardDescription>Optionally link this transaction to a customer or supplier.</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                      </Button>
                  </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerId" render={({ field }) => (
                        <FormItem><FormLabel>Customer</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a customer"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supplierId" render={({ field }) => (
                        <FormItem><FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a supplier"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
              </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {submissionError && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription className="break-all font-mono text-xs">
                    {submissionError}
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update" : "Save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
