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
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useDrawer } from "@/hooks/use-drawer";


interface AddProductFormProps {
  product?: Product;
  onSuccess: () => void; // Callback to close drawer and refresh data
}

export function AddProductForm({ product, onSuccess }: AddProductFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units.derivedUnits",
  });

  useEffect(() => {
    if (product) {
      console.log('[AddProductForm.tsx] useEffect triggered in Edit Mode. Product prop received:', product);
      form.reset({
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
        manufactureDate: product.manufactureDate ? new Date(product.manufactureDate).toISOString().split('T')[0] : undefined,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : undefined,
      });
      console.log('[AddProductForm.tsx] Form has been reset with product data.');
    }
  }, [product, form]);

  async function onSubmit(data: ProductFormValues) {
    console.log("[AddProductForm.tsx] onSubmit called. isEditMode:", isEditMode, "Data:", data);
    setIsSubmitting(true);
    
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
        description: "Please check the form for errors. See console for details.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dell Inspiron 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., P001" {...field} />
                    </FormControl>
                     <FormDescription>General ID for the product type.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., CRACKER-0925-A" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank if not applicable.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Selling Price</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cost Price</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Barcode (SKU)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 1234567890123" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dell" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Laptops" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Warehouse A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SUP001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="manufactureDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Manufacture Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
             />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Min Stock Level</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="maxStockLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Max Stock Level</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
          </div>
        </div>

        {/* Units Section */}
        <Card>
            <CardHeader>
                <CardTitle>Units of Measurement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="units.baseUnit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Base Unit</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., pcs, kg, ltr" {...field} />
                        </FormControl>
                        <FormDescription>The smallest unit the product is sold in.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                <div className="space-y-2">
                    <FormLabel>Derived Units</FormLabel>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                            <FormField
                                control={form.control}
                                name={`units.derivedUnits.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <Input {...field} placeholder="Unit Name (e.g., box)" />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`units.derivedUnits.${index}.conversionFactor`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <Input type="number" {...field} placeholder="Factor (e.g., 12)" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: '', conversionFactor: 0 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Derived Unit
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Other Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tax</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taxtype"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tax Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED">Fixed</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="defaultDiscount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Default Discount</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="defaultDiscountType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED">Fixed</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                 <div className="flex items-center space-x-4">
                    <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5">
                            <FormLabel>Product Active</FormLabel>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="isService"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5">
                            <FormLabel>Is a Service</FormLabel>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
            </div>
            <div className="space-y-6">
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Any additional notes about the product..."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>


        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Product" : "Save Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
