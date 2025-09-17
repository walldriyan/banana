// src/components/suppliers/AddSupplierForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type SupplierFormValues } from "@/lib/validation/supplier.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addSupplierAction, updateSupplierAction } from "@/lib/actions/supplier.actions";
import { useState, useEffect } from "react";
import type { Supplier } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";

interface AddSupplierFormProps {
  supplier?: Supplier;
  onSuccess: () => void;
}

export function AddSupplierForm({ supplier, onSuccess }: AddSupplierFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!supplier;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isEditMode && supplier) {
      form.reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        notes: supplier.notes ?? "",
      });
    }
  }, [supplier, form, isEditMode]);

  async function onSubmit(data: SupplierFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateSupplierAction(supplier.id, data)
      : addSupplierAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Supplier ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Supplier "${data.name}" has been successfully saved.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} supplier`,
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Global Electronics Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 0112345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., contact@globalelectronics.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 456 Industrial Rd, Colombo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any notes about the supplier..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Supplier" : "Save Supplier")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
