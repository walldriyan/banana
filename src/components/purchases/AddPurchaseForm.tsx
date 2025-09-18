// src/components/purchases/AddPurchaseForm.tsx
"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { useState, useEffect } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
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
import SearchableProductInput from "../POSUI/SearchableProductInput";
import type { GrnWithRelations } from "@/app/dashboard/purchases/PurchasesClientPage";
import type { Supplier } from "@prisma/client";

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
  const isEditMode = !!grn;

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, [toast]);


  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues: isEditMode && grn ? {
      ...grn,
      grnDate: new Date(grn.grnDate),
      items: grn.items.map(item => ({
        ...item,
        // The product details are needed for the form, but not part of the schema
        productName: products.find(p => p.id === item.productId)?.name || 'Unknown Product'
      }))
    } : {
      grnNumber: `GRN-${Date.now()}`,
      grnDate: new Date(),
      supplierId: '',
      invoiceNumber: '',
      items: [],
      notes: '',
      totalAmount: 0,
      paidAmount: 0,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
    },
  });

  // If in edit mode, reset the form once products and suppliers have loaded
  useEffect(() => {
      if (isEditMode && grn && products.length > 0 && suppliers.length > 0) {
          form.reset({
              ...grn,
              grnDate: new Date(grn.grnDate),
              items: grn.items.map(item => ({
                  ...item,
                  productName: products.find(p => p.id === item.productId)?.name || 'Unknown'
              }))
          });
      }
  }, [isEditMode, grn, products, suppliers, form.reset]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  useEffect(() => {
    const total = watchedItems.reduce((sum, item) => sum + item.total, 0);
    form.setValue('totalAmount', total);
    // Update payment status based on total and paid amount
    const paid = form.getValues('paidAmount');
    if (paid >= total && total > 0) {
        form.setValue('paymentStatus', 'paid');
    } else if (paid > 0) {
        form.setValue('paymentStatus', 'partial');
    } else {
        form.setValue('paymentStatus', 'pending');
    }
  }, [watchedItems, form]);

  const handleProductSelect = (product: Product) => {
    const existingItemIndex = fields.findIndex(field => field.productId === product.id);
    if(existingItemIndex !== -1) {
        const existingItem = fields[existingItemIndex];
        const newQty = existingItem.quantity + 1;
        const newTotal = (newQty * existingItem.costPrice) - existingItem.discount; // Recalculate total
        update(existingItemIndex, { ...existingItem, quantity: newQty, total: newTotal });
        toast({ title: "Quantity Updated", description: `${product.name} quantity increased to ${newQty}.`});
    } else {
        append({
            productId: product.id,
            productName: product.name,
            batchNumber: product.batchNumber,
            quantity: 1,
            costPrice: product.costPrice ?? 0,
            discount: 0,
            tax: 0,
            total: product.costPrice ?? 0
        });
    }
  };

  const handleItemChange = (index: number, field: 'quantity' | 'costPrice' | 'discount' | 'tax', value: number) => {
      const item = form.getValues(`items.${index}`);
      if(!item) return;

      const updatedItem = { ...item, [field]: value };
      const { quantity, costPrice, discount, tax } = updatedItem;
      const subTotal = quantity * costPrice;
      const totalDiscount = discount;
      const totalTax = (subTotal - totalDiscount) * (tax / 100);
      const newTotal = subTotal - totalDiscount + totalTax;

      update(index, { ...updatedItem, total: newTotal });
  }

  async function onSubmit(data: GrnFormValues) {
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
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} GRN`,
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GRN Header</CardTitle>
            <CardDescription>Details about the supplier and invoice.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <FormField
                control={form.control}
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
              control={form.control}
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
              control={form.control}
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
                control={form.control}
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
                <CardTitle>Add Products</CardTitle>
                <CardDescription>Search for products to add them to this GRN.</CardDescription>
            </CardHeader>
            <CardContent>
                <SearchableProductInput
                    products={products}
                    onProductSelect={handleProductSelect}
                    placeholder="Search by product name or barcode to add..."
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>GRN Items</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Product</TableHead>
                            <TableHead>Batch No.</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Tax (%)</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.length > 0 ? fields.map((item, index) => (
                             <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-muted-foreground">{item.batchNumber}</TableCell>
                                <TableCell>
                                    <Input type="number" defaultValue={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-20" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" defaultValue={item.costPrice} onChange={e => handleItemChange(index, 'costPrice', Number(e.target.value))} className="w-24" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" defaultValue={item.discount} onChange={e => handleItemChange(index, 'discount', Number(e.target.value))} className="w-24" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" defaultValue={item.tax} onChange={e => handleItemChange(index, 'tax', Number(e.target.value))} className="w-20" />
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {item.total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">No products added yet.</TableCell>
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
                        control={form.control}
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
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="paidAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Amount Paid</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="space-y-2 text-right font-semibold">
                        <div className="flex justify-between"><span>Total:</span> <span>Rs. {form.getValues('totalAmount').toFixed(2)}</span></div>
                        <div className="flex justify-between text-green-600"><span>Paid:</span> <span>Rs. {form.getValues('paidAmount').toFixed(2)}</span></div>
                        <div className="flex justify-between border-t pt-2 text-red-600 text-lg"><span>Balance:</span> <span>Rs. {(form.getValues('totalAmount') - form.getValues('paidAmount')).toFixed(2)}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || fields.length === 0}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update GRN" : "Save GRN")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
