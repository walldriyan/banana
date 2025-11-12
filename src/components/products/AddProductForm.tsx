// src/components/products/AddProductForm.tsx
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch, useFormContext } from "react-hook-form";
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
import type { ProductBatch } from "@/types";
import { PlusCircle, Trash2, ArrowLeft, ArrowRight, Sparkles, AlertTriangle, Package, Archive, Tag, Coins, Boxes, Info, CheckCircle, Wallet, Landmark, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { useDrawer } from "@/hooks/use-drawer";
import { cn } from "@/lib/utils";
import { getSuppliersAction } from '@/lib/actions/supplier.actions';
import { updateBrandsAction, updateCategoriesAction } from '@/lib/actions/data.actions';
import type { Supplier } from '@prisma/client';
import { CreatableCombobox, type ComboboxOption } from './CreatableCombobox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

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


const ConversionFactorDisplay = ({ itemIndex, baseUnit, userInput }: { itemIndex: number, baseUnit: string, userInput: number }) => {
    const { control } = useFormContext<ProductFormValues>();
    const item = useWatch({ control, name: `units.derivedUnits.${itemIndex}` });
    const derivedUnitName = item?.name || 'New Unit';
    
    if (userInput <= 0) return null;

    return (
        <Alert className="mt-2 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 !text-emerald-700 dark:!text-emerald-300" />
            <AlertDescription className="text-emerald-900 dark:text-emerald-200">
                {userInput} {derivedUnitName} = <strong>1</strong> {baseUnit}
            </AlertDescription>
        </Alert>
    );
};


const DerivedUnitCalculator = ({ itemIndex, baseUnit, userInput }: { itemIndex: number, baseUnit: string, userInput: number }) => {
    const { control } = useFormContext<ProductFormValues>();
    const item = useWatch({ control, name: `units.derivedUnits.${itemIndex}` });
    const sellingPrice = Number(useWatch({ control, name: `sellingPrice` }) || 0);

    const derivedUnitName = item?.name || 'New Unit';
    
    const calculatedPrice = useMemo(() => {
        if (userInput <= 0 || sellingPrice <= 0) return 0;
        return sellingPrice / userInput;
    }, [userInput, sellingPrice]);

    if (!item) return null;

    return (
        <Card className="mt-2 bg-muted/30 dark:bg-muted/10 border-dashed">
            <CardContent className="p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Price for 1 <span className='text-primary font-bold'>{derivedUnitName}</span></p>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Price per <span className='font-semibold'>{baseUnit}</span>:</span>
                    <span className="font-medium">Rs. {sellingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-center items-center my-1 text-muted-foreground text-xs">
                   ( Rs. {sellingPrice.toFixed(2)} / {userInput} {derivedUnitName} )
                </div>
                <Separator className="my-1"/>
                <div className="flex justify-between items-baseline font-bold">
                    <span>Total Price:</span>
                    <span className="text-lg text-primary">Rs. {calculatedPrice.toFixed(4)}</span>
                </div>
            </CardContent>
        </Card>
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
  
  // Use a separate state to hold the user-friendly input values for derived units
  const [userInputs, setUserInputs] = useState<Record<number, number>>({});

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units.derivedUnits",
  });

  const handleUserInput = (index: number, value: number) => {
    setUserInputs(prev => ({...prev, [index]: value}));
    // Calculate the real conversion factor and set it in the form
    const factor = value > 0 ? 1 / value : 0;
    form.setValue(`units.derivedUnits.${index}.conversionFactor`, factor, { shouldValidate: true, shouldDirty: true });
  }

  // Effect to populate userInputs when in edit mode
  useEffect(() => {
    if(isEditMode && productBatch) {
        const initialUserInputs: Record<number, number> = {};
        const units = typeof productBatch.product.units === 'string' ? JSON.parse(productBatch.product.units) : productBatch.product.units;
        if(units.derivedUnits) {
            units.derivedUnits.forEach((unit: any, index: number) => {
                if(unit.conversionFactor > 0) {
                    initialUserInputs[index] = 1 / unit.conversionFactor;
                }
            });
        }
        setUserInputs(initialUserInputs);
    }
  }, [productBatch, isEditMode]);
  
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
        quantity: Number(productBatch.stock), // In edit mode, quantity represents current stock
        
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
                    <CardContent>
                       <div className="divide-y dark:divide-slate-800">
                        {isEditMode && (
                            <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 mb-6">
                                 <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <AlertTitle className='text-blue-800 dark:text-blue-300'>Edit Mode</AlertTitle>
                                <AlertDescription className='text-blue-700 dark:text-blue-400'>
                                    You are editing an existing product batch. Some master product fields like Product ID are locked.
                                </AlertDescription>
                            </Alert>
                        )}
                       
                        <div className="flex items-start gap-6 py-4">
                            <div className="w-1/3 pt-1">
                                <FormLabel>Product Name</FormLabel>
                            </div>
                            <div className="w-2/3">
                                <FormField name="name" control={form.control} render={({ field }) => ( <FormItem className="m-0 p-0 space-y-0"><FormControl><Input placeholder="e.g., Dell Inspiron 15" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>

                         <div className="flex items-start gap-6 py-4">
                            <div className="w-1/3 pt-1">
                                <FormLabel>Product ID</FormLabel>
                                <FormDescription>General ID for this product line.</FormDescription>
                            </div>
                            <div className="w-2/3">
                                <FormField control={form.control} name="productId" render={({ field }) => (
                                    <FormItem className="m-0 p-0 space-y-0">
                                        <FormControl><Input placeholder="e.g., dell-inspiron-15" {...field} disabled={isEditMode} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-6 py-4">
                            <div className="w-1/3 pt-1">
                                <FormLabel>Batch Number & Barcode</FormLabel>
                                <FormDescription>Unique identifiers for this specific stock.</FormDescription>
                            </div>
                            <div className="w-2/3 grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="batchNumber" render={({ field }) => (
                                    <FormItem className="m-0 p-0 space-y-0">
                                        <div className="flex gap-2">
                                            <FormControl><Input placeholder="e.g., B-1726..." {...field} /></FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(`B-${Date.now()}`)}><Sparkles className="h-4 w-4" /></Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="barcode" render={({ field }) => (
                                    <FormItem className="m-0 p-0 space-y-0">
                                        <div className="flex gap-2">
                                            <FormControl><Input placeholder="e.g., 890..." {...field} /></FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(Math.random().toString().slice(2, 15))}><Sparkles className="h-4 w-4" /></Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                         <div className="flex items-start gap-6 pt-4">
                            <div className="w-1/3 pt-1">
                                <FormLabel>Organization</FormLabel>
                                <FormDescription>Categorize the product and link to a supplier.</FormDescription>
                            </div>
                            <div className="w-2/3 grid sm:grid-cols-3 gap-4">
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
                    <CardContent className="divide-y dark:divide-slate-800">
                        <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Pricing (per Base Unit)</FormLabel>
                               <FormDescription>Define the cost and selling price for a single base unit.</FormDescription>
                           </div>
                           <div className="w-2/3 grid grid-cols-2 gap-4">
                                <FormField name="costPrice" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Cost Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField name="sellingPrice" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Selling Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>{isEditMode ? 'Current Stock' : 'Initial Stock'}</FormLabel>
                               <FormDescription>The quantity of this product batch in its base unit.</FormDescription>
                           </div>
                           <div className="w-2/3">
                                <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem className="m-0 p-0 space-y-0">
                                <FormControl><Input type="number" {...field} disabled={isEditMode} /></FormControl>
                                {isEditMode && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Stock Update Notice</AlertTitle><AlertDescription>Stock can only be adjusted via the <strong>'Purchases (GRN)'</strong> or <strong>'Lost & Damage'</strong> sections.</AlertDescription></Alert>}
                                <FormMessage />
                                </FormItem> )} />
                           </div>
                        </div>
                        <Separator />
                         <div className="flex items-start gap-6 pt-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Units of Measurement</FormLabel>
                               <FormDescription>Define how this product is measured and sold.</FormDescription>
                           </div>
                           <div className="w-2/3 space-y-4">
                                <FormField name="units.baseUnit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Base Unit</FormLabel><FormControl><Input placeholder="e.g., pcs, kg, ltr" {...field} /></FormControl><FormDescription>The smallest unit the product is tracked in.</FormDescription><FormMessage /></FormItem> )} />
                                <div>
                                    <FormLabel>Derived Units (Optional)</FormLabel>
                                     <Alert className="mt-2 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700/50 text-sky-800 dark:text-sky-300">
                                        <Info className="h-4 w-4 !text-sky-700 dark:!text-sky-300" />
                                        <AlertTitle className="font-semibold text-sky-900 dark:text-sky-200">මේක වැඩ කරන හැටි</AlertTitle>
                                        <AlertDescription className="text-xs space-y-2 text-sky-800/90 dark:text-sky-400">
                                            <p>
                                                පරිශීලකයාට, ඉතා, සරලව, ඒකක, අතර, සම්බන්ධය, ඇතුළත්, කිරීමට, මෙතැනදී, අවස්ථාව, ලැබේ. උදාහරණයක්, ලෙස, <strong className="text-sky-900 dark:text-sky-200">Base Unit</strong> එක, 'KG' නම්, සහ, ඔබ, 'g' (ග්‍රෑම්), යන, නව, ඒකකය, හදන්නේ, නම්, පහත, input, එකට, 1000, ලෙස, ඇතුළත්, කරන්න.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-3 border rounded-md bg-muted/30 dark:bg-muted/10">
                                            <div className="flex items-center gap-2">
                                                <FormField control={form.control} name={`units.derivedUnits.${index}.name`} render={({ field }) => ( <FormItem className="flex-1"><Input {...field} placeholder="Unit Name (e.g., box)" /></FormItem> )} />
                                                <div className="flex-1">
                                                    <Label>How many '{field.name || 'New Unit'}' make 1 {watchedBaseUnit}?</Label>
                                                    <Input type="number" value={userInputs[index] || ''} onChange={e => handleUserInput(index, Number(e.target.value))} placeholder={`e.g., 1000`} />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                            <ConversionFactorDisplay itemIndex={index} baseUnit={watchedBaseUnit} userInput={userInputs[index] || 0} />
                                            <DerivedUnitCalculator itemIndex={index} baseUnit={watchedBaseUnit} userInput={userInputs[index] || 0} />
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
                    <CardContent className="divide-y dark:divide-slate-800">
                       <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Batch Discount</FormLabel>
                               <FormDescription>Default discount for this specific batch. This is used by the 'Product Defaults' campaign.</FormDescription>
                           </div>
                           <div className="w-2/3 flex gap-4">
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
                        <div className="flex items-start gap-6 pt-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Batch Tax Rate</FormLabel>
                               <FormDescription>Tax rate applied to this specific batch (in percentage).</FormDescription>
                           </div>
                           <div className="w-2/3">
                                <FormField control={form.control} name="tax" render={({ field }) => (
                                    <FormItem className="m-0 p-0 space-y-0">
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
                    <CardContent className="divide-y dark:divide-slate-800">
                        <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Location</FormLabel>
                               <FormDescription>Where this batch is stored.</FormDescription>
                           </div>
                           <div className="w-2/3">
                                <FormField name="location" control={form.control} render={({ field }) => ( <FormItem className="m-0 p-0 space-y-0"><FormControl><Input placeholder="e.g., Warehouse A, Shelf 3" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Notes</FormLabel>
                               <FormDescription>Any additional notes about this batch.</FormDescription>
                           </div>
                           <div className="w-2/3">
                                <FormField name="notes" control={form.control} render={({ field }) => ( <FormItem className="m-0 p-0 space-y-0"><FormControl><Textarea placeholder="e.g., Handle with care." {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="flex items-start gap-6 py-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Manufacture & Expiry</FormLabel>
                               <FormDescription>Dates relevant to this batch.</FormDescription>
                           </div>
                           <div className="w-2/3 grid sm:grid-cols-2 gap-4">
                                <FormField name="manufactureDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Manufacture Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField name="expiryDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           </div>
                        </div>
                         <div className="flex items-start gap-6 pt-4">
                           <div className="w-1/3 pt-1">
                               <FormLabel>Product Status</FormLabel>
                               <FormDescription>Control the visibility and usability of the product.</FormDescription>
                           </div>
                           <div className="w-2/3 space-y-4">
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
