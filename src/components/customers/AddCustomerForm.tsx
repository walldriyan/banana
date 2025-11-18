// src/components/customers/AddCustomerForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormValues } from "@/lib/validation/customer.schema";
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
import { useToast } from "@/hooks/use-toast";
import { addCustomerAction, updateCustomerAction } from "@/lib/actions/customer.actions";
import { useState, useEffect } from "react";
import type { Customer } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";

interface AddCustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export function AddCustomerForm({ customer, onSuccess }: AddCustomerFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (isEditMode && customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
      });
    }
  }, [customer, form, isEditMode]);

  async function onSubmit(data: CustomerFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateCustomerAction(customer.id, data)
      : addCustomerAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Customer ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Customer "${data.name}" has been successfully saved.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} customer`,
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
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
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
                <Input placeholder="e.g., 0771234567" {...field} />
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
                <Input placeholder="e.g., john.doe@example.com" {...field} />
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
                <Input placeholder="e.g., 123 Main St, Colombo" {...field} />
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
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Customer" : "Save Customer")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
