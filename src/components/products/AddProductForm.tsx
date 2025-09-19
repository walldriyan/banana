// src/components/products/AddProductForm.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addProductAction, updateProductAction } from "@/lib/actions/product.actions";
import { useState, useEffect } from "react";
import type { Product } from "@/types";
import { PlusCircle, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useDrawer } from "@/hooks/use-drawer";
import { cn } from "@/lib/utils";

interface AddProductFormProps {
  product?: Product;
  onSuccess: () => void; // Callback to close drawer and refresh data
}

type StepFields = (keyof ProductFormValues)[];

const steps: { title: string; description: string; fields: StepFields }[] = [
    {
        title: "Basic Information",
        description: "Enter the primary details of the product.",
        fields: ["name", "productId", "barcode", "batchNumber", "category", "brand", "supplierId"]
    },
    {
        title: "Pricing & Stock",
        description: "Define the cost, price, and unit details.",
        fields: ["costPrice", "sellingPrice", "quantity", "units"]
    },
    {
        title: "Tax & Discounts",
        description: "Set default tax and discount values.",
        fields: ["tax", "taxtype", "defaultDiscount", "defaultDiscountType"]
    },
    {
        title: "Inventory & Other Details",
        description: "Configure stock levels and other metadata.",
        fields: ["maxStockLevel", "minStockLevel", "manufactureDate", "expiryDate", "location", "isActive", "isService", "notes"]
    }
];

export function AddProductForm({ product, onSuccess }: AddProductFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sellingPrice: 0,
      costPrice: 0,
      quantity: 0,
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
      defaultDiscount: 0,
      defaultDiscountType: "PERCENTAGE",
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
    if (isEditMode && product) {
      console.log('[AddProductForm.tsx] useEffect triggered in Edit Mode. Product prop received:', product);
       // Prepare data for reset, ensuring nulls become undefined
      const formData = {
        ...product,
        costPrice: product.costPrice ?? undefined,
        barcode: product.barcode ?? undefined,
        brand: product.brand ?? undefined,
        category: product.category ?? undefined,
        location: product.location ?? undefined,
        supplierId: product.supplierId ?? undefined,
        minStockLevel: product.minStockLevel ?? undefined,
        maxStockLevel: product.maxStockLevel ?? undefined,
        tax: product.tax ?? undefined,
        taxtype: product.taxtype ?? 'PERCENTAGE',
        defaultDiscount: product.defaultDiscount ?? undefined,
        defaultDiscountType: product.defaultDiscountType ?? 'PERCENTAGE',
        notes: product.notes ?? undefined,
        // Ensure dates are in 'YYYY-MM-DD' format for the input[type=date]
        manufactureDate: product.manufactureDate ? new Date(product.manufactureDate).toISOString().split('T')[0] : undefined,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : undefined,
      };
      form.reset(formData);
      console.log('[AddProductForm.tsx] Form has been reset with product data:', formData);
    }
  }, [product, form, isEditMode]);


  async function onSubmit(data: ProductFormValues) {
    console.log("[AddProductForm.tsx] onSubmit called. isEditMode:", isEditMode, "Data:", data);
    setIsSubmitting(true);
    
    // Use the product prop directly for the ID to ensure it's correct
    const action = isEditMode && product
      ? updateProductAction(product.id, data)
      : addProductAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Product ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Product "${data.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.`,
      });
      onSuccess(); // Close drawer and refresh
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} product`,
        description: result.error,
      });
    }
  }

  const onError = (errors: any) => {
    console.error("[AddProductForm.tsx] Form validation errors:", errors);
    toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors.",
    });
  };

  const handleNextStep = async () => {
        const fieldsToValidate = steps[currentStep].fields;
        const isValid = await form.trigger(fieldsToValidate);

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


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">

        {/* Stepper Indicator */}
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
        
        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
             <Card>
                <CardHeader>
                    <CardTitle>{steps[0].title}</CardTitle>
                    <CardDescription>{steps[0].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Dell Inspiron 15" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="productId" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Product ID</FormLabel><FormControl><Input placeholder="e.g., P001" {...field} /></FormControl><FormDescription>General ID for the product type.</FormDescription><FormMessage /></FormItem> )} />
                        <FormField name="batchNumber" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Batch Number</FormLabel><FormControl><Input placeholder="e.g., CRACKER-0925-A" {...field} /></FormControl><FormDescription>Leave blank if not applicable.</FormDescription><FormMessage /></FormItem> )} />
                    </div>
                    <FormField name="barcode" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Barcode (SKU)</FormLabel><FormControl><Input placeholder="e.g., 1234567890123" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField name="category" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Laptops" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="brand" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g., Dell" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="supplierId" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Supplier ID</FormLabel><FormControl><Input placeholder="e.g., SUP001" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                </CardContent>
             </Card>
          )}

          {/* Step 2: Pricing & Stock */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                     <FormField name="costPrice" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Cost Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField name="sellingPrice" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Selling Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 </div>
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

          {/* Step 3: Tax & Discounts */}
          {currentStep === 2 && (
             <Card>
                <CardHeader>
                    <CardTitle>{steps[2].title}</CardTitle>
                    <CardDescription>{steps[2].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="tax" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Tax</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="taxtype" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Tax Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FIXED">Fixed</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="defaultDiscount" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Default Discount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="defaultDiscountType" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Discount Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FIXED">Fixed</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>
                </CardContent>
             </Card>
          )}

          {/* Step 4: Inventory & Other Details */}
          {currentStep === 3 && (
             <Card>
                <CardHeader>
                    <CardTitle>{steps[3].title}</CardTitle>
                    <CardDescription>{steps[3].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="minStockLevel" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Min Stock Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="maxStockLevel" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Max Stock Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="manufactureDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Manufacture Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="expiryDate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField name="location" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Warehouse A" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField name="notes" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any additional notes about the product..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="flex items-center space-x-4">
                        <FormField name="isActive" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1"><div className="space-y-0.5"><FormLabel>Product Active</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                        <FormField name="isService" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1"><div className="space-y-0.5"><FormLabel>Is a Service</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                    </div>
                </CardContent>
            </Card>
          )}
        </div>


        {/* Navigation Buttons */}
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

             {currentStep < steps.length - 1 && (
                 <Button type="button" onClick={handleNextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
             )}

             {currentStep === steps.length - 1 && (
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
