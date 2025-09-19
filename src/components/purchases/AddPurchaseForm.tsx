// src/components/purchases/AddPurchaseForm.tsx
"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { grnSchema, type GrnFormValues, grnItemSchema, type GrnItemFormValues } from "@/lib/validation/grn.schema";
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
import { CalendarIcon, PlusCircle, Trash2, AlertTriangle, Sparkles, PackagePlus, Landmark, Wallet, Banknote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getSuppliersAction } from "@/lib/actions/supplier.actions";
import { getProductsAction } from "@/lib/actions/product.actions";
import type { Product } from "@/types";
import { GrnProductSearch } from "./GrnProductSearch";
import type { GrnWithRelations } from "@/app/dashboard/purchases/PurchasesClientPage";
import type { Supplier } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AddProductForm } from "../products/AddProductForm";
import { Separator } from "../ui/separator";

interface AddPurchaseFormProps {
  grn?: GrnWithRelations;
  onSuccess: () => void;
}

const initialItemState: Partial<GrnItemFormValues> = {
    productId: '',
    name: '',
    batchNumber: '',
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
    discount: 0,
    tax: 0,
    total: 0,
};

const SummaryRow = ({ icon: Icon, label, value, description, valueClassName }: { icon: React.ElementType, label: string, value: string | number, description?: string, valueClassName?: string }) => (
    <div className="flex items-start gap-4 py-3">
        <div className="bg-muted p-2 rounded-lg">
            <Icon className="h-5 w-5 text-foreground/80" />
        </div>
        <div className="flex-1">
            <p className="font-medium text-foreground">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <p className={`text-xl font-bold text-right ${valueClassName}`}>{value}</p>
    </div>
);


export function AddPurchaseForm({ grn, onSuccess }: AddPurchaseFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isEditMode = !!grn;

  // State for the temporary item entry form
  const [currentItem, setCurrentItem] = useState<Partial<GrnItemFormValues>>(initialItemState);
  const [itemError, setItemError] = useState<string | null>(null);

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
    const currentTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotalAmount(currentTotal);
    setValue('totalAmount', currentTotal, { shouldValidate: true, shouldDirty: true });
  }, [getValues, setValue]);


  const watchedItems = watch('items');
  useEffect(() => {
      calculateTotal();
  }, [watchedItems, calculateTotal]);


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


  const handleProductSelect = (product: Product) => {
    setItemError(null);
    const unitsObject = typeof product.units === 'string' 
      ? JSON.parse(product.units) 
      : product.units;

    setCurrentItem({
      productId: product.id,
      name: product.name,
      units: unitsObject,
      batchNumber: `B-${Date.now()}`,
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
      discount: 0,
      tax: 0,
    });
  };

  const handleAddItemToTable = () => {
    setItemError(null);
    const itemTotal = ((currentItem.quantity || 0) * (currentItem.costPrice || 0)) - (currentItem.discount || 0) + ( ( ((currentItem.quantity || 0) * (currentItem.costPrice || 0)) - (currentItem.discount || 0) ) * ((currentItem.tax || 0) / 100) );
    
    const itemToValidate = {
        ...currentItem,
        total: itemTotal,
    };
    
    const validationResult = grnItemSchema.safeParse(itemToValidate);
    
    if (!validationResult.success) {
        const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join(' ');
        setItemError(errorMessages || "Please fill all required item fields correctly.");
        return;
    }
    
    append(validationResult.data);
    setCurrentItem(initialItemState); // Reset the form
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
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
                                <CardTitle>Add New Batch</CardTitle>
                                <CardDescription>Search for a master product, then fill the details below to add a new batch.</CardDescription>
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
                            placeholder="Search for a master product..."
                        />
                    </CardContent>
                    {currentItem.productId && (
                        <CardContent className="border-t pt-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold">Details for: {currentItem.name}</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentItem(initialItemState)}>Clear</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <FormItem>
                                    <FormLabel>Batch No.</FormLabel>
                                    <div className="flex items-center gap-1">
                                        <Input value={currentItem.batchNumber} onChange={e => setCurrentItem(prev => ({...prev, batchNumber: e.target.value}))} placeholder="e.g. B-123" />
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentItem(prev => ({...prev, batchNumber: `B-${Date.now()}`}))}><Sparkles className="h-4 w-4" /></Button>
                                    </div>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <Input type="number" value={currentItem.quantity} onChange={e => setCurrentItem(prev => ({...prev, quantity: Number(e.target.value)}))} placeholder="e.g. 100" />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Cost Price</FormLabel>
                                    <Input type="number" value={currentItem.costPrice} onChange={e => setCurrentItem(prev => ({...prev, costPrice: Number(e.target.value)}))} placeholder="e.g. 550.00" />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Selling Price</FormLabel>
                                    <Input type="number" value={currentItem.sellingPrice} onChange={e => setCurrentItem(prev => ({...prev, sellingPrice: Number(e.target.value)}))} placeholder="e.g. 750.00" />
                                </FormItem>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <FormItem>
                                    <FormLabel>Discount (Fixed)</FormLabel>
                                    <Input type="number" value={currentItem.discount} onChange={e => setCurrentItem(prev => ({...prev, discount: Number(e.target.value)}))} placeholder="e.g. 50" />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Tax (%)</FormLabel>
                                    <Input type="number" value={currentItem.tax} onChange={e => setCurrentItem(prev => ({...prev, tax: Number(e.target.value)}))} placeholder="e.g. 15" />
                                </FormItem>
                                <div className="lg:col-span-2 flex justify-end">
                                    <Button type="button" onClick={handleAddItemToTable} disabled={isEditMode}>
                                    <PackagePlus className="mr-2 h-4 w-4"/>
                                    Add Item to GRN
                                    </Button>
                                </div>
                            </div>
                            {itemError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Validation Error</AlertTitle>
                                    <AlertDescription>{itemError}</AlertDescription>
                                </Alert>
                            )}
                            {isEditMode && <p className="text-sm text-destructive text-right">Cannot add new items in Edit Mode.</p>}
                        </CardContent>
                    )}
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
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Tax (%)</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.length > 0 ? fields.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.batchNumber}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.costPrice.toFixed(2)}</TableCell>
                                        <TableCell>{item.discount.toFixed(2)}</TableCell>
                                        <TableCell>{item.tax.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {item.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={isEditMode}>
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
                        {isEditMode && <p className="text-sm text-destructive text-center mt-4">Cannot modify items in Edit Mode. Please delete and recreate the GRN to change items.</p>}
                    </CardContent>
                </Card>

            </div>

            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                <Card>
                    <CardHeader><CardTitle>Payment & Summary</CardTitle></CardHeader>
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
                                    <FormLabel>Amount Paid Now</FormLabel>
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
                        <Separator className="my-4"/>
                        <div className="divide-y">
                            <SummaryRow 
                                icon={Landmark} 
                                label="Total GRN Value" 
                                value={`Rs. ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            />
                            <SummaryRow 
                                icon={Wallet} 
                                label="Paid Amount" 
                                value={`Rs. ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                valueClassName="text-green-600"
                            />
                            <SummaryRow 
                                icon={Banknote} 
                                label="Balance Due (Credit)" 
                                value={`Rs. ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                valueClassName="text-red-600"
                            />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                    <CardContent>
                        <FormField
                            control={control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea placeholder="Any notes about this purchase..." {...field} rows={4} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
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
          <Button type="submit" disabled={isSubmitting || fields.length === 0}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update GRN" : "Save GRN")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
