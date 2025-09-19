// src/components/purchases/AddPurchaseForm.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { grnSchema, type GrnFormValues } from "@/lib/validation/grn.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addGrnAction, updateGrnAction } from "@/lib/actions/purchase.actions";
import { useState, useEffect, useCallback } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { CalendarIcon, PlusCircle, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { getSuppliersAction } from "@/lib/actions/supplier.actions";
import { getProductsAction } from "@/lib/actions/product.actions";
import type { Product } from "@/types";
import { GrnProductSearch } from "./GrnProductSearch";
import type { GrnWithRelations } from "@/app/dashboard/purchases/PurchasesClientPage";
import type { Supplier } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AddProductForm } from "../products/AddProductForm";


interface AddPurchaseFormProps {
  grn?: GrnWithRelations;
  onSuccess: () => void;
}

export function AddPurchaseForm({ grn, onSuccess }: AddPurchaseFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isEditMode = !!grn;

  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      grnNumber: `GRN-${Date.now()}`,
      grnDate: new Date(),
      supplierId: '',
      invoiceNumber: '',
      items: [],
      notes: '',
      paidAmount: 0,
      paymentMethod: 'credit',
      totalAmount: 0,
    },
    mode: 'onBlur',
  });

  const { control, getValues, setValue, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fetchProductsAndSuppliers = useCallback(async () => {
        const [suppliersResult, productsResult] = await Promise.all([
            getSuppliersAction(),
            getProductsAction()
        ]);

        if (suppliersResult.success && suppliersResult.data) {
            setSuppliers(suppliersResult.data);
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not load suppliers." });
        }

        if (productsResult.success && productsResult.data) {
            setProducts(productsResult.data);
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not load products." });
        }
  }, [toast]);

  useEffect(() => {
    fetchProductsAndSuppliers();
  }, [fetchProductsAndSuppliers]);


  const calculateTotal = useCallback(() => {
    const items = getValues('items');
    const currentTotal = items.reduce((sum, item, index) => {
        const itemTotal = (item.quantity * item.costPrice) - item.discount + ( ( (item.quantity * item.costPrice) - item.discount ) * (item.tax / 100) );
        // Update the individual item total in the form state without re-triggering validation
        setValue(`items.${index}.total`, itemTotal, { shouldValidate: false, shouldDirty: true });
        return sum + itemTotal;
    }, 0);
    setTotalAmount(currentTotal);
    // Also update the main total amount in the form
    setValue('totalAmount', currentTotal, { shouldValidate: true });
  }, [getValues, setValue]);


  useEffect(() => {
      if (isEditMode && grn && products.length > 0 && suppliers.length > 0) {
          const loadedItems = grn.items.map(item => {
             const productBatch = item.productBatch;
             return {
                 ...item,
                 productId: productBatch.productId,
                 name: productBatch.product.name,
                 category: productBatch.product.category,
                 brand: productBatch.product.brand,
                 units: productBatch.product.units,
                 sellingPrice: productBatch.sellingPrice,
                 batchNumber: productBatch.batchNumber
             };
          });
          
          form.reset({
              ...grn,
              grnDate: new Date(grn.grnDate),
              items: loadedItems as any,
          });
          setTotalAmount(grn.totalAmount);
          setValue('totalAmount', grn.totalAmount);
      }
  }, [isEditMode, grn, products, suppliers, form, setValue]);

  const watchedItems = watch('items');
  useEffect(() => {
      calculateTotal();
  }, [watchedItems, calculateTotal]);


  const handleProductSelect = (product: Product) => {
    const unitsObject = typeof product.units === 'string' 
      ? JSON.parse(product.units) 
      : product.units;

    append({
        productId: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        units: unitsObject,
        sellingPrice: 0,
        batchNumber: `B-${Date.now()}`,
        quantity: 1,
        costPrice: 0,
        discount: 0,
        tax: 0,
        total: 0
    });
  };
  
  const handleRemoveItem = (index: number) => {
      remove(index);
  }

  const openAddProductDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Master Product',
      description: 'Fill in the details below to add a new master product to the system.',
      content: <AddProductForm onSuccess={() => {
        fetchProductsAndSuppliers(); 
        drawer.closeDrawer();
        toast({ title: 'Success', description: 'New master product added. You can now search for it.'});
      }} />,
      drawerClassName: 'sm:max-w-4xl'
    });
  }

  async function onSubmit(data: GrnFormValues) {
    setSubmissionError(null);
    setIsSubmitting(true);
    
    const action = isEditMode && grn
      ? updateGrnAction(grn.id, data)
      : addGrnAction(data);
    
    const result = await action;
    
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `GRN ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `The purchase record has been successfully saved and stock updated.`,
      });
      onSuccess();
    } else {
      setSubmissionError(result.error);
    }
  }
  
  const onError = (errors: any) => {
    console.error("Form validation failed:", errors);
    const errorString = JSON.stringify(errors, null, 2);
    setSubmissionError(`Client-side validation failed. Please check the form for errors. Details: ${errorString}`);
  };

  const paidAmount = watch('paidAmount') || 0;
  const balance = totalAmount - paidAmount;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GRN Header</CardTitle>
            <CardDescription>Details about the supplier and invoice.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <FormField
                control={control}
                name="grnNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>GRN Number</FormLabel>
                    <FormControl>
                        <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={control}
              name="grnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>GRN Date</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={control}
                name="invoiceNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                        <Input placeholder="Supplier's invoice no." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
             />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Add Products</CardTitle>
                        <CardDescription>Search for a master product to add as a new batch.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={openAddProductDrawer}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Master Product
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <GrnProductSearch
                    products={products}
                    onProductSelect={handleProductSelect}
                    placeholder="Search by master product to add a new batch..."
                />
                 <p className="text-xs text-muted-foreground mt-2">
                    Selecting a product here will add a new line item below for the new batch.
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>GRN Items</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Product</TableHead>
                            <TableHead>Batch No.</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Selling Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Tax (%)</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields && fields.length > 0 ? fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={control}
                                        name={`items.${index}.batchNumber`}
                                        render={({ field }) => (
                                            <div className="flex items-center gap-1">
                                                <Input {...field} className="w-32" />
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => field.onChange(`B-${Date.now()}`)}><Sparkles className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField control={control} name={`items.${index}.quantity`} render={({ field }) => ( <Input type="number" {...field} className="w-20" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={control} name={`items.${index}.costPrice`} render={({ field }) => ( <Input type="number" {...field} className="w-24" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={control} name={`items.${index}.sellingPrice`} render={({ field }) => ( <Input type="number" {...field} className="w-24" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={control} name={`items.${index}.discount`} render={({ field }) => ( <Input type="number" {...field} className="w-24" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={control} name={`items.${index}.tax`} render={({ field }) => ( <Input type="number" {...field} className="w-20" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> )} />
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {watch(`items.${index}.total`)?.toFixed(2) ?? '0.00'}
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">No products added yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                     <FormField
                        control={control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <Textarea placeholder="Any notes about this purchase..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                if (value === 'credit') {
                                    setValue('paidAmount', 0);
                                }
                            }} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select method"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={control}
                        name="paidAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount Paid</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number"
                                        {...field}
                                        value={field.value ?? ''}
                                        disabled={getValues('paymentMethod') === 'credit'}
                                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="space-y-2 text-right font-semibold">
                        <div className="flex justify-between"><span>Total:</span> <span>Rs. {totalAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between text-green-600"><span>Paid:</span> <span>Rs. {paidAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between border-t pt-2 text-red-600 text-lg"><span>Balance:</span> <span>Rs. {balance.toFixed(2)}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {submissionError && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription className="break-all font-mono text-xs">
                    {submissionError}
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !fields || fields.length === 0}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update GRN" : "Save GRN")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
