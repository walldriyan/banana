// src/components/products/AddProductForm.tsx
"use client";

import React from 'react';
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
import { PlusCircle, Trash2, ArrowLeft, ArrowRight, Sparkles, DollarSign, Tag, Boxes, AlertTriangle, Wallet, TrendingUp, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useDrawer } from "@/hooks/use-drawer";
import { cn } from "@/lib/utils";
import { getSuppliersAction } from '@/lib/actions/supplier.actions';
import type { Supplier } from '@prisma/client';
import categoriesData from '@/lib/data/categories.json';
import brandsData from '@/lib/data/brands.json';
import { CreatableCombobox, type ComboboxOption } from './CreatableCombobox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface AddProductFormProps {
  productBatch?: ProductBatch; // Now receives a ProductBatch
  onSuccess: () => void; // Callback to close drawer and refresh data
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

export function AddProductForm({ productBatch, onSuccess }: AddProductFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [suppliers, setSuppliers] = useState<ComboboxOption[]>([]);
  const [categories, setCategories] = useState<ComboboxOption[]>(
    categoriesData.map(c => ({ value: c.toLowerCase(), label: c }))
  );
  const [brands, setBrands] = useState<ComboboxOption[]>(
     brandsData.map(b => ({ value: b.toLowerCase(), label: b }))
  );

  const isEditMode = !!productBatch;

  useEffect(() => {
    async function fetchSuppliers() {
        const result = await getSuppliersAction();
        if(result.success && result.data) {
            setSuppliers(result.data.map(s => ({ value: s.id, label: s.name })));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load suppliers.' });
        }
    }
    fetchSuppliers();
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
                    <CardContent className="space-y-6">
                        {isEditMode && (
                            <Alert variant="default" className="bg-blue-50 border-blue-200">
                                 <AlertTriangle className="h-4 w-4 text-blue-600" />
                                <AlertTitle className='text-blue-800'>Edit Mode</AlertTitle>
                                <AlertDescription className='text-blue-700'>
                                    You are editing an existing product batch. Some master product fields like Product ID are locked.
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Dell Inspiron 15" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="productId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product ID</FormLabel>
                                    <FormControl><Input placeholder="e.g., dell-inspiron-15" {...field} disabled={isEditMode} /></FormControl>
                                    <FormDescription>General ID for this product line.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="batchNumber" render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Batch Number</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl><Input placeholder="e.g., B-1726..." {...field} /></FormControl>
                                        <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(`B-${Date.now()}`)}><Sparkles className="h-4 w-4" /></Button>
                                    </div>
                                    <FormDescription>Unique ID for this specific batch.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                             )} />
                        </div>

                         <FormField control={form.control} name="barcode" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Barcode (SKU)</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl><Input placeholder="e.g., 890..." {...field} /></FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(Math.random().toString().slice(2, 15))}><Sparkles className="h-4 w-4" /></Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                         )} />
                        
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <CreatableCombobox 
                                        options={categories}
                                        value={field.value}
                                        onChange={(newValue, isNew) => {
                                            field.onChange(newValue);
                                            if (isNew) {
                                                const newOption = { value: newValue.toLowerCase(), label: newValue };
                                                setCategories(prev => [...prev, newOption]);
                                            }
                                        }}
                                        placeholder="Select or create category"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="brand" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <CreatableCombobox 
                                        options={brands}
                                        value={field.value}
                                        onChange={(newValue, isNew) => {
                                            field.onChange(newValue);
                                            if (isNew) {
                                                const newOption = { value: newValue.toLowerCase(), label: newValue };
                                                setBrands(prev => [...prev, newOption]);
                                            }
                                        }}
                                        placeholder="Select or create brand"
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
                                        placeholder="Select a supplier"
                                        creatable={false}
                                    />
                                    <FormMessage />
                                </FormItem>
                             )} />
                        </div>
                    </CardContent>
                 </Card>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pricing &amp; Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField name="costPrice" control={form.control} render={({ field }) => ( <FormItem>
                                <FormLabel>Cost Price</FormLabel>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl><Input type="number" {...field} className="pl-10" /></FormControl>
                                </div>
                                <FormMessage /></FormItem> )} />
                            <FormField name="sellingPrice" control={form.control} render={({ field }) => ( <FormItem>
                                <FormLabel>Selling Price</FormLabel>
                                 <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl><Input type="number" {...field} className="pl-10 text-lg h-12" /></FormControl>
                                </div>
                                <FormMessage /></FormItem> )} />
                            <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem>
                                <FormLabel>{isEditMode ? 'Current Stock' : 'Initial Stock'}</FormLabel>
                                <div className="relative">
                                    <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl><Input type="number" {...field} disabled={isEditMode} className="pl-10 text-lg h-12 font-bold" /></FormControl>
                                </div>
                                <FormMessage /></FormItem> )} />
                            {isEditMode && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Stock Update Notice</AlertTitle>
                                    <AlertDescription>
                                        Stock can only be adjusted via the <strong>'Purchases (GRN)'</strong> section to maintain an accurate audit trail. This field is for display only.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Units of Measurement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField name="units.baseUnit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Base Unit</FormLabel><FormControl><Input placeholder="e.g., pcs, kg, ltr" {...field} /></FormControl><FormDescription>The smallest unit the product is sold in.</FormDescription><FormMessage /></FormItem> )} />
                            <div className="space-y-2">
                                <FormLabel>Derived Units</FormLabel>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                                        <FormField control={form.control} name={`units.derivedUnits.${index}.name`} render={({ field }) => ( <FormItem className="flex-1"><Input {...field} placeholder="Unit Name (e.g., box)" /></FormItem> )} />
                                        <FormField control={form.control} name={`units.derivedUnits.${index}.conversionFactor`} render={({ field }) => ( <FormItem className="flex-1"><Input type="number" {...field} placeholder="Factor (e.g., 12)" /></FormItem> )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', conversionFactor: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Derived Unit</Button>
                            </div>
                        </CardContent>
                     </Card>
                </div>
              )}
              
              {currentStep === 2 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{steps[2].title}</CardTitle>
                        <CardDescription>{steps[2].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Batch Tax Rate (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 15" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Batch Default Discount Value</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 10 or 100" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="discountType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Batch Default Discount Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a discount type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                                            <SelectItem value="FIXED">FIXED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                 </Card>
              )}

              {currentStep === 3 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{steps[3].title}</CardTitle>
                        <CardDescription>{steps[3].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Warehouse A, Shelf 3" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any additional notes about this batch..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="manufactureDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Manufacture Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="expiryDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="flex items-center space-x-4">
                            <FormField name="isActive" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1"><div className="space-y-0.5"><FormLabel>Product Active</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                            <FormField name="isService" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1"><div className="space-y-0.5"><FormLabel>Is a Service</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
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
                    <ArrowRight className="ml-2 h-4 w-4" />
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
