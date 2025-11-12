// src/components/products/AddProductForm.tsx
"use client";

import React, { useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  type ProductFormValues,
} from "@/lib/validation/product.schema";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addProductAction, updateProductBatchAction } from "@/lib/actions/product.actions";
import { useState, useEffect } from "react";
import type { ProductBatch } from "@/types";
import { PlusCircle, Trash2, ArrowLeft, ArrowRight, Sparkles, AlertTriangle, Package, Archive, Tag, Coins, Boxes, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useDrawer } from "@/hooks/use-drawer";
import { cn } from "@/lib/utils";
import { getSuppliersAction } from '@/lib/actions/supplier.actions';
import { updateBrandsAction, updateCategoriesAction } from '@/lib/actions/data.actions';
import type { Supplier } from '@prisma/client';
import { CreatableCombobox, type ComboboxOption } from './CreatableCombobox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddProductFormProps {
  productBatch?: ProductBatch;
  onSuccess: () => void;
  categories?: string[];
  brands?: string[];
}

type StepFields = (keyof ProductFormValues)[];

const steps: { title: string; description: string; fields: StepFields }[] = [
    {
        title: "Basic Information",
        description: "Enter the primary details of the product.",
        fields: ["name", "productId", "batchNumber", "category", "brand", "supplierId"]
    },
    {
        title: "Pricing & Stock",
        description: "Define the cost, price, and unit details.",
        fields: ["costPrice", "sellingPrice", "quantity", "units"]
    },
    {
        title: "Tax & Discounts",
        description: "Set batch-specific tax and discount values.",
        fields: ["tax", "taxtype", "discount", "discountType"]
    },
    {
        title: "Inventory & Other Details",
        description: "Configure stock levels and other metadata.",
        fields: ["maxStockLevel", "minStockLevel", "manufactureDate", "expiryDate", "location", "isActive", "isService", "notes"]
    }
];

const DerivedUnitCalculator = ({ itemIndex, baseUnit }: { itemIndex: number, baseUnit: string }) => {
    const { control } = useForm<ProductFormValues>();
    const [quantity, setQuantity] = useState(1);
    const item = useWatch({ control, name: `units.derivedUnits.${itemIndex}` });
    const sellingPrice = useWatch({ control, name: `sellingPrice` }) || 0;

    const conversionFactor = item?.conversionFactor || 0;

    const calculatedBaseQty = useMemo(() => quantity * conversionFactor, [quantity, conversionFactor]);
    const calculatedPrice = useMemo(() => calculatedBaseQty * sellingPrice, [calculatedBaseQty, sellingPrice]);

    if (!item) return null;

    return (
        <div className="flex items-end gap-3 p-2 border-t mt-2">
            <div className="flex-1">
                <Label htmlFor={`calc-qty-${itemIndex}`} className="text-xs">Qty in '{item.name}'</Label>
                <Input
                    id={`calc-qty-${itemIndex}`}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    className="h-8"
                />
            </div>
            <div className="text-center text-2xl font-light text-muted-foreground">=</div>
            <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">Equals</p>
                <p><span className="font-bold text-primary">{calculatedBaseQty.toFixed(2)}</span> <span className="text-xs">{baseUnit}</span></p>
                <p className="text-xs font-semibold">Price: Rs. {calculatedPrice.toFixed(2)}</p>
            </div>
        </div>
    );
};


export function AddProductForm({ productBatch, onSuccess, categories: initialCategories = [], brands: initialBrands = [] }: AddProductFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [suppliers, setSuppliers] = useState<ComboboxOption[]>([]);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [brands, setBrands] = useState<string[]>(initialBrands);

  const isEditMode = !!productBatch;

   useEffect(() => {
    async function fetchInitialData() {
        const suppliersRes = await getSuppliersAction();
        if(suppliersRes.success && suppliersRes.data) {
            setSuppliers(suppliersRes.data.map(s => ({ value: s.id, label: s.name })));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load suppliers.' });
        }
    }
    fetchInitialData();
  }, [toast]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sellingPrice: 0,
      costPrice: 0,
      quantity: 0, // Stock for new product
      barcode: "",
      productId: "",
      batchNumber: "",
      brand: "",
      category: "",
      location: "",
      notes: "",
      supplierId: "",
      minStockLevel: 0,
      maxStockLevel: 0,
      tax: 0,
      taxtype: "PERCENTAGE",
      discount: 0,
      discountType: "PERCENTAGE",
      defaultQuantity: 1,
      isActive: true,
      isService: false,
      units: {
        baseUnit: 'pcs',
        derivedUnits: []
      }
    },
     mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units.derivedUnits",
  });
  
  const watchedBaseUnit = useWatch({ control: form.control, name: 'units.baseUnit' });


  useEffect(() => {
    if (isEditMode && productBatch) {
      console.log('[AddProductForm.tsx] useEffect triggered in Edit Mode. Product prop received:', productBatch);
      const formData = {
        name: productBatch.product.name,
        productId: productBatch.product.id, // Set the product ID for the master product
        description: productBatch.product.description || "",
        category: productBatch.product.category,
        brand: productBatch.product.brand,
        units: typeof productBatch.product.units === 'string' ? JSON.parse(productBatch.product.units) : productBatch.product.units,
        isService: productBatch.product.isService,
        isActive: productBatch.product.isActive,
        
        batchNumber: productBatch.batchNumber ?? '',
        sellingPrice: productBatch.sellingPrice,
        costPrice: productBatch.costPrice ?? 0,
        quantity: productBatch.stock, // In edit mode, quantity represents current stock
        
        tax: productBatch.tax ?? 0,
        taxtype: productBatch.taxtype ?? 'PERCENTAGE',
        discount: productBatch.discount ?? 0,
        discountType: productBatch.discountType ?? 'PERCENTAGE',

        barcode: productBatch.barcode ?? "",
        supplierId: productBatch.supplierId ?? "",
        manufactureDate: productBatch.manufactureDate ? new Date(productBatch.manufactureDate).toISOString().split('T')[0] : undefined,
        expiryDate: productBatch.expiryDate ? new Date(productBatch.expiryDate).toISOString().split('T')[0] : undefined,
        location: productBatch.location ?? "",
        notes: productBatch.notes ?? "",
      };
      form.reset(formData);
    } else {
        // Set a default batch number for new products
        form.setValue('batchNumber', `B-${Date.now()}`);
    }
  }, [productBatch, form, isEditMode]);


  async function onSubmit(data: ProductFormValues) {
    console.log("[AddProductForm.tsx] onSubmit called. isEditMode:", isEditMode, "Data:", data);
    setSubmissionError(null);
    setIsSubmitting(true);
    
    // Save new categories/brands before submitting the product
    await updateCategoriesAction(categories);
    await updateBrandsAction(brands);

    const action = isEditMode && productBatch
      ? updateProductBatchAction(productBatch.id, data)
      : addProductAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Product ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Product "${data.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.`,
      });
      onSuccess(); 
    } else {
       setSubmissionError(result.error);
       toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} product`,
        description: "Submission failed. Please see the error message on the form.",
      });
    }
  }

  const onError = (errors: any) => {
    console.error("[AddProductForm.tsx] Form validation errors:", errors);
    const errorString = JSON.stringify(errors, null, 2);
    setSubmissionError(`Client-side validation failed. Please check the form for errors. Details: ${errorString}`);
    toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors.",
    });
  };

  const handleNextStep = async () => {
        const fieldsToValidate = steps[currentStep].fields;
        const isValid = await form.trigger(fieldsToValidate as any);

        if (isValid) {
            setCurrentStep(prev => prev + 1);
        } else {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields for this step correctly.",
            });
        }
    };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  

  const productName = form.watch('name');
  useEffect(() => {
    if (!isEditMode) {
        form.setValue('productId', productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [productName, form, isEditMode]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="grid grid-cols-1 items-start">
          <div className="space-y-6">
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
            
            <div className="min-h-[400px]">
              {currentStep === 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{steps[0].title}</CardTitle>
                        <CardDescription>{steps[0].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {isEditMode && (
                            <Alert variant="default" className="bg-blue-50 border-blue-200 mb-6">
                                 <AlertTriangle className="h-4 w-4 text-blue-600" />
                                <AlertTitle className='text-blue-800'>Edit Mode</AlertTitle>
                                <AlertDescription className='text-blue-700'>
                                    You are editing an existing product batch. Some master product fields like Product ID are locked.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="py-4 grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FormLabel>Product Name</FormLabel>
                            </div>
                            <div className="col-span-2">
                                <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormControl><Input placeholder="e.g., Dell Inspiron 15" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>

                         <div className="py-4 grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FormLabel>Product ID</FormLabel>
                                <FormDescription>General ID for this product line.</FormDescription>
                            </div>
                            <div className="col-span-2">
                                <FormField control={form.control} name="productId" render={({ field }) => (
                                    <FormItem>
                                        <FormControl><Input placeholder="e.g., dell-inspiron-15" {...field} disabled={isEditMode} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                        
                        <div className="py-4 grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FormLabel>Batch Number</FormLabel>
                                <FormDescription>Unique identifiers for this specific stock.</FormDescription>
                            </div>
                            <div className="col-span-2">
                                <FormField control={form.control} name="batchNumber" render={({ field }) => (
                                    <FormItem>
                                        <div className="flex gap-2">
                                            <FormControl><Input placeholder="e.g., B-1726..." {...field} /></FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(`B-${Date.now()}`)}><Sparkles className="h-4 w-4" /></Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="py-4 grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FormLabel>Barcode (SKU)</FormLabel>
                            </div>
                            <div className="col-span-2">
                                <FormField control={form.control} name="barcode" render={({ field }) => (
                                    <FormItem>
                                        <div className="flex gap-2">
                                            <FormControl><Input placeholder="e.g., 890..." {...field} /></FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(Math.random().toString().slice(2, 15))}><Sparkles className="h-4 w-4" /></Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                         <div className="py-4 grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FormLabel>Organization</FormLabel>
                                <FormDescription>Categorize the product and link to a supplier.</FormDescription>
                            </div>
                            <div className="col-span-2 grid sm:grid-cols-3 gap-4">
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <CreatableCombobox 
                                            options={categories.map(c => ({ value: c, label: c }))}
                                            value={field.value}
                                            onChange={(newValue, isNew) => {
                                                field.onChange(newValue);
                                                if (isNew && !categories.includes(newValue)) {
                                                    setCategories(prev => [...prev, newValue]);
                                                }
                                            }}
                                            placeholder="Select category"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="brand" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <CreatableCombobox 
                                            options={brands.map(b => ({ value: b, label: b }))}
                                            value={field.value}
                                            onChange={(newValue, isNew) => {
                                                field.onChange(newValue);
                                                if (isNew && !brands.includes(newValue)) {
                                                    setBrands(prev => [...prev, newValue]);
                                                }
                                            }}
                                            placeholder="Select brand"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="supplierId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <CreatableCombobox 
                                            options={suppliers}
                                            value={field.value}
                                            onChange={(newValue, isNew) => field.onChange(newValue)}
                                            placeholder="Select supplier"
                                            creatable={false}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </CardContent>
                 </Card>
              )}
             
              {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{steps[1].title}</CardTitle>
                        <CardDescription>{steps[1].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Cost Price</FormLabel>
                               <FormDescription>The price you paid for the product per base unit.</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField name="costPrice" control={form.control} render={({ field }) => ( <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                        <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Selling Price</FormLabel>
                               <FormDescription>The price you will sell the product for per base unit.</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField name="sellingPrice" control={form.control} render={({ field }) => ( <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>{isEditMode ? 'Current Stock' : 'Initial Stock'}</FormLabel>
                               <FormDescription>The quantity of this product batch in its base unit.</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem>
                                <FormControl><Input type="number" {...field} disabled={isEditMode} /></FormControl>
                                {isEditMode && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Stock Update Notice</AlertTitle><AlertDescription>Stock can only be adjusted via the <strong>'Purchases (GRN)'</strong> or <strong>'Lost & Damage'</strong> sections.</AlertDescription></Alert>}
                                <FormMessage />
                                </FormItem> )} />
                           </div>
                        </div>

                        <Separator className="!my-6" />

                         <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Units of Measurement</FormLabel>
                               <FormDescription>Define how this product is measured and sold.</FormDescription>
                           </div>
                           <div className="col-span-2 space-y-4">
                                <FormField name="units.baseUnit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Base Unit</FormLabel><FormControl><Input placeholder="e.g., pcs, kg, ltr" {...field} /></FormControl><FormDescription>The smallest unit the product is tracked in.</FormDescription><FormMessage /></FormItem> )} />
                                <div>
                                    <FormLabel>Derived Units (Optional)</FormLabel>
                                    <Alert className="bg-sky-50 border-sky-200 text-sky-800 mt-2">
                                        <Info className="h-4 w-4 !text-sky-700" />
                                        <AlertTitle className="font-semibold">මේක වැඩ කරන හැටි</AlertTitle>
                                        <AlertDescription className="text-xs space-y-2">
                                            <p>
                                                <strong className="text-sky-900">මූලික ඒකකය (Base Unit)</strong> කියන්නේ ඔයා බඩු ගබඩා කරන, ගණන් බලන පොඩිම ඒකකය (උදා: තනි tablet එක, 1kg, 1ml).
                                            </p>
                                            <p>
                                                <strong className="text-sky-900">ව්‍යුත්පන්න ඒකක (Derived Units)</strong> කියන්නේ, ඔයා බඩු විකුණන ලොකු ඇසුරුම් (උදා: පෙත්ත, කාඩ් එක, පෙට්ටිය). "Conversion Factor" එකෙන් කියවෙන්නේ ඒ ලොකු ඇසුරුමක, පොඩි ඒකක කීයක් තියෙනවද කියන එකයි.
                                            </p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li><strong className="text-sky-900">උදා 1 (Panadol):</strong> Base Unit: 'tablet', Derived Unit 1: 'card' (Factor: 10), Derived Unit 2: 'box' (Factor: 100).</li>
                                                <li><strong className="text-sky-900">උදා 2 (Rice):</strong> Base Unit: 'kg', Derived Unit: 'bag' (Factor: 25).</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-3 border rounded-md bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <FormField control={form.control} name={`units.derivedUnits.${index}.name`} render={({ field }) => ( <FormItem className="flex-1"><Input {...field} placeholder="Unit Name (e.g., box)" /></FormItem> )} />
                                                <FormField control={form.control} name={`units.derivedUnits.${index}.conversionFactor`} render={({ field }) => ( <FormItem className="flex-1"><Input type="number" {...field} placeholder={`x Base Units (e.g., 12)`} /></FormItem> )} />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                            <DerivedUnitCalculator itemIndex={index} baseUnit={watchedBaseUnit} />
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', conversionFactor: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Derived Unit</Button>
                                </div>
                           </div>
                        </div>

                    </CardContent>
                </Card>
              )}
              
              {currentStep === 2 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{steps[2].title}</CardTitle>
                        <CardDescription>{steps[2].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                       <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Batch Discount</FormLabel>
                               <FormDescription>Default discount for this specific batch. This is used by the 'Product Defaults' campaign.</FormDescription>
                           </div>
                           <div className="col-span-2 flex gap-4">
                               <FormField control={form.control} name="discount" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Value</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 10 or 100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="discountType" render={({ field }) => (
                                    <FormItem className="w-[150px]">
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                <SelectItem value="FIXED">Fixed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                           </div>
                        </div>
                        <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Batch Tax Rate</FormLabel>
                               <FormDescription>Tax rate applied to this specific batch (in percentage).</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField control={form.control} name="tax" render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 15" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                           </div>
                        </div>
                    </CardContent>
                 </Card>
              )}

              {currentStep === 3 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{steps[3].title}</CardTitle>
                        <CardDescription>{steps[3].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Location</FormLabel>
                               <FormDescription>Where this batch is stored.</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField name="location" control={form.control} render={({ field }) => ( <FormItem><FormControl><Input placeholder="e.g., Warehouse A, Shelf 3" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Notes</FormLabel>
                               <FormDescription>Any additional notes about this batch.</FormDescription>
                           </div>
                           <div className="col-span-2">
                                <FormField name="notes" control={form.control} render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="e.g., Handle with care." {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Manufacture & Expiry</FormLabel>
                               <FormDescription>Dates relevant to this batch.</FormDescription>
                           </div>
                           <div className="col-span-2 grid sm:grid-cols-2 gap-4">
                                <FormField name="manufactureDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Manufacture Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField name="expiryDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="py-4 grid grid-cols-3 gap-6">
                           <div className="col-span-1">
                               <FormLabel>Product Status</FormLabel>
                               <FormDescription>Control the visibility and usability of the product.</FormDescription>
                           </div>
                           <div className="col-span-2 space-y-4">
                                <FormField name="isActive" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Product Active</FormLabel><FormDescription>If inactive, it won't appear in POS searches.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                                <FormField name="isService" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Is a Service</FormLabel><FormDescription>Service products don't have stock tracking.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                           </div>
                        </div>
                    </CardContent>
                </Card>
              )}
            </div>
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

        <div className="flex justify-between items-center pt-4 mt-6 border-t">
          <div>
            <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
                Cancel
            </Button>
          </div>
          <div className="flex gap-4">
             {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
             )}

             {currentStep < 3 && (
                 <Button type="button" onClick={handleNextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4" />
                 </Button>
             )}

             {currentStep === 3 && (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : (isEditMode ? "Update Product" : "Save Product")}
                </Button>
             )}
          </div>
        </div>
      </form>
    </Form>
  );
}
