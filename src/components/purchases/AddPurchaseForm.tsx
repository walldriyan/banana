// src/components/purchases/AddPurchaseForm.tsx
"use client";

import React from 'react';
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
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { CalendarIcon, PlusCircle, Trash2, AlertTriangle, Sparkles, PackagePlus, Landmark, Wallet, Banknote, ArrowLeft, ArrowRight, Package, Archive, Tag, Coins, Boxes } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getSuppliersAction } from "@/lib/actions/supplier.actions";
import { getProductsAction, getProductBatchesAction } from "@/lib/actions/product.actions";
import type { Product, ProductBatch } from "@/types";
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
    discountType: 'FIXED',
    tax: 0,
    taxType: 'PERCENTAGE',
    total: 0,
};


const steps = [
    { title: "GRN & Items", description: "Add items to the Goods Received Note." },
    { title: "Payment & Finish", description: "Finalize payment details and save." }
];

export function AddPurchaseForm({ grn, onSuccess }: AddPurchaseFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allBatches, setAllBatches] = useState<ProductBatch[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const isEditMode = !!grn;

  const [currentItem, setCurrentItem] = useState<Partial<GrnItemFormValues>>(initialItemState);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  const { control, getValues, setValue, watch, trigger } = form;

  const supplierId = watch('supplierId');

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fetchInitialData = useCallback(async () => {
        const [suppliersResult, productsResult, batchesResult] = await Promise.all([
            getSuppliersAction(),
            getProductsAction(),
            getProductBatchesAction(),
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
        if (batchesResult.success && batchesResult.data) {
            setAllBatches(batchesResult.data);
        } else {
             toast({ variant: "destructive", title: "Error", description: "Could not load product batch data." });
        }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


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
                 batchNumber: productBatch.batchNumber,
                 // Ensure discount/tax types are loaded correctly
                 discountType: item.discountType,
                 taxType: item.taxType
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
    setSelectedProduct(product);
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
      discountType: 'FIXED',
      tax: 0,
      taxType: 'PERCENTAGE',
    });
  };

  const handleClearCurrentItem = () => {
      setCurrentItem(initialItemState);
      setSelectedProduct(null);
  }

  const handleAddItemToTable = () => {
    setItemError(null);

    const cost = currentItem.costPrice || 0;
    const qty = currentItem.quantity || 0;
    const discountVal = currentItem.discount || 0;
    const taxVal = currentItem.tax || 0;

    const lineTotal = cost * qty;

    // Calculate Discount Amount
    let discountAmount = 0;
    if (currentItem.discountType === 'PERCENTAGE') {
        discountAmount = lineTotal * (discountVal / 100);
    } else { // FIXED
        discountAmount = discountVal;
    }

    const subtotalAfterDiscount = lineTotal - discountAmount;

    // Calculate Tax Amount
    let taxAmount = 0;
    if (currentItem.taxType === 'PERCENTAGE') {
        taxAmount = subtotalAfterDiscount * (taxVal / 100);
    } else { // FIXED
        taxAmount = taxVal;
    }
    
    const itemFinalTotal = subtotalAfterDiscount + taxAmount;
    
    const itemToValidate: GrnItemFormValues = {
        ...initialItemState, // Provides default values for any potentially missing fields in currentItem
        ...currentItem,
        total: itemFinalTotal,
    } as GrnItemFormValues; // Assert the type after merging
    
    const validationResult = grnItemSchema.safeParse(itemToValidate);
    
    if (!validationResult.success) {
        const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join(' ');
        setItemError(errorMessages || "Please fill all required item fields correctly.");
        return;
    }
    
    append(validationResult.data);
    handleClearCurrentItem();
};

  
  const handleRemoveItem = (index: number) => {
      remove(index);
  }

  const openAddProductDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Master Product',
      description: 'Fill in the details below to add a new master product to the system.',
      content: <AddProductForm onSuccess={() => {
        fetchInitialData(); 
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

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof GrnFormValues)[] = ['grnNumber', 'grnDate', 'supplierId', 'items'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(1);
    } else {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill header details and add at least one item.',
      });
    }
  };

  const paidAmount = watch('paidAmount') || 0;
  const balance = totalAmount - paidAmount;
  
  const selectedProductTotalStock = useMemo(() => {
    if (!selectedProduct) return 0;
    return allBatches
        .filter(batch => batch.productId === selectedProduct.id)
        .reduce((sum, batch) => sum + batch.stock, 0);
  }, [selectedProduct, allBatches]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          {steps.map((step, index) => (
              <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                      <div
                          className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors",
                              currentStep === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                              currentStep > index && "bg-green-600 text-white"
                          )}
                      >
                          {index + 1}
                      </div>
                      <p className={cn("text-xs mt-1 text-center", currentStep === index ? "font-semibold" : "text-muted-foreground")}>{step.title}</p>
                  </div>
                  {index < steps.length - 1 && (
                      <div className="flex-1 h-1 bg-border mx-2"></div>
                  )}
              </React.Fragment>
          ))}
        </div>

        {currentStep === 0 && (
          <div className="space-y-6">
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
            
           {supplierId && (
            <>
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
                   {currentItem.productId && selectedProduct && (
                    <CardContent className="border-t pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-primary">{selectedProduct.name}</h3>
                                <p className="text-sm text-muted-foreground">Enter the details for the new batch of this product.</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearCurrentItem}>Clear</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 p-4 rounded-lg bg-muted/20 space-y-4">
                                <h4 className='text-sm font-semibold text-foreground'>Product Summary</h4>
                                <div className='flex items-center gap-3'>
                                    <Package className='h-5 w-5 text-muted-foreground' />
                                    <div>
                                        <p className='text-xs text-muted-foreground'>Category</p>
                                        <p className='font-medium'>{selectedProduct.category}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <Tag className='h-5 w-5 text-muted-foreground' />
                                    <div>
                                        <p className='text-xs text-muted-foreground'>Brand</p>
                                        <p className='font-medium'>{selectedProduct.brand}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <Archive className='h-5 w-5 text-muted-foreground' />
                                    <div>
                                        <p className='text-xs text-muted-foreground'>Total Current Stock</p>
                                        <p className='font-bold text-lg'>{selectedProductTotalStock.toLocaleString()} {selectedProduct.units.baseUnit}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 space-y-2">
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className='text-base'>Batch & Quantity</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
                                        <FormItem>
                                            <FormLabel>Batch No.</FormLabel>
                                            <div className="flex items-center gap-1">
                                                <FormControl>
                                                <Input className='h-9' value={currentItem.batchNumber} onChange={e => setCurrentItem(prev => ({...prev, batchNumber: e.target.value}))} placeholder="e.g. B-123" />
                                                </FormControl>
                                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentItem(prev => ({...prev, batchNumber: `B-${Date.now()}`}))}><Sparkles className="h-4 w-4" /></Button>
                                            </div>
                                        </FormItem>
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                            <Input className='h-9' type="number" value={currentItem.quantity} onChange={e => setCurrentItem(prev => ({...prev, quantity: Number(e.target.value)}))} placeholder="e.g. 100" />
                                            </FormControl>
                                        </FormItem>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className='text-base'>Pricing</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
                                         <FormItem>
                                            <FormLabel>Cost Price (per unit)</FormLabel>
                                            <FormControl>
                                            <Input className='h-9' type="number" value={currentItem.costPrice} onChange={e => setCurrentItem(prev => ({...prev, costPrice: Number(e.target.value)}))} placeholder="e.g. 550.00" />
                                            </FormControl>
                                        </FormItem>
                                        <FormItem>
                                            <FormLabel>Selling Price (per unit)</FormLabel>
                                            <FormControl>
                                            <Input className='h-9' type="number" value={currentItem.sellingPrice} onChange={e => setCurrentItem(prev => ({...prev, sellingPrice: Number(e.target.value)}))} placeholder="e.g. 750.00" />
                                            </FormControl>
                                        </FormItem>
                                    </CardContent>
                                </Card>
                               <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className='text-base'>Adjustments</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
                                        <FormItem>
                                          <FormLabel>Discount</FormLabel>
                                          <div className="flex gap-2">
                                              <FormControl>
                                                  <Input className='h-9' type="number" value={currentItem.discount} onChange={e => setCurrentItem(prev => ({...prev, discount: Number(e.target.value)}))} placeholder="e.g. 50" />
                                              </FormControl>
                                              <Select value={currentItem.discountType} onValueChange={(val: 'FIXED' | 'PERCENTAGE') => setCurrentItem(prev => ({...prev, discountType: val}))}>
                                                  <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="FIXED">Rs.</SelectItem>
                                                      <SelectItem value="PERCENTAGE">%</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                        </FormItem>
                                        <FormItem>
                                          <FormLabel>Tax</FormLabel>
                                           <div className="flex gap-2">
                                              <FormControl>
                                              <Input className='h-9' type="number" value={currentItem.tax} onChange={e => setCurrentItem(prev => ({...prev, tax: Number(e.target.value)}))} placeholder="e.g. 15" />
                                              </FormControl>
                                               <Select value={currentItem.taxType} onValueChange={(val: 'FIXED' | 'PERCENTAGE') => setCurrentItem(prev => ({...prev, taxType: val}))}>
                                                  <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="PERCENTAGE">%</SelectItem>
                                                      <SelectItem value="FIXED">Rs.</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                        </FormItem>
                                    </CardContent>
                                </Card>

                                {itemError && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Validation Error</AlertTitle>
                                        <AlertDescription>{itemError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className='flex justify-end pt-2'>
                                    <Button type="button" onClick={handleAddItemToTable} disabled={isEditMode}>
                                        <PackagePlus className="mr-2 h-4 w-4"/>
                                        Add Item to GRN
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                                  <TableHead>Tax</TableHead>
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
                                      <TableCell>{item.discount.toFixed(2)} ({item.discountType})</TableCell>
                                      <TableCell>{item.tax.toFixed(2)} ({item.taxType})</TableCell>
                                      <TableCell className="text-right font-semibold">
                                          {(item.total ?? 0).toFixed(2)}
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
            </>
           )}
          </div>
        )}

        {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    } else {
                                        setValue('paidAmount', totalAmount);
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
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-3">
                                    <Landmark className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Total GRN Value</span>
                                </div>
                                <span className="text-lg font-bold">Rs. {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-3">
                                    <Wallet className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Paid Amount</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">Rs. {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-3">
                                    <Banknote className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Balance Due (Credit)</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">Rs. {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
        
        {submissionError && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription className="break-all font-mono text-xs">
                    {submissionError}
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-between items-center pt-4 mt-6 border-t">
           <div>
            <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
                Cancel
            </Button>
          </div>
          <div className="flex gap-4">
             {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
             )}

             {currentStep < steps.length - 1 && (
                 <Button type="button" onClick={handleNextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
             )}

             {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                    {isSubmitting ? "Saving..." : (isEditMode ? "Update GRN" : "Save GRN")}
                </Button>
             )}
          </div>
        </div>
      </form>
    </Form>
  );
}
