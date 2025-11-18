// src/components/company/AddCompanyForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyFormValues } from "@/lib/validation/company.schema";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addCompanyAction, updateCompanyAction } from "@/lib/actions/company.actions";
import { useState, useEffect } from "react";
import type { Company } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";

interface AddCompanyFormProps {
  company?: Company;
  onSuccess: () => void;
}

export function AddCompanyForm({ company, onSuccess }: AddCompanyFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!company;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      registrationNumber: "",
      taxNumber: "",
      logoUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && company) {
      form.reset({
        name: company.name,
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        registrationNumber: company.registrationNumber ?? "",
        taxNumber: company.taxNumber ?? "",
        logoUrl: company.logoUrl ?? "",
        isActive: company.isActive,
      });
    }
  }, [company, form, isEditMode]);

  async function onSubmit(data: CompanyFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateCompanyAction(company.id, data)
      : addCompanyAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Company ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Company "${data.name}" has been successfully saved.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} company`,
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g., My Awesome Inc." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 0112345678" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g., contact@awesome.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Main St, Colombo" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="registrationNumber" render={({ field }) => (
          <FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., PV00123456" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="taxNumber" render={({ field }) => (
          <FormItem><FormLabel>Tax Number (VAT/TIN)</FormLabel><FormControl><Input placeholder="e.g., 123456789-7000" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>Company Active</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
        )} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Company" : "Save Company")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
