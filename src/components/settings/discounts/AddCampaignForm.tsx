// src/components/settings/discounts/AddCampaignForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discountSetSchema, type DiscountSetFormValues } from "@/lib/validation/discount.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addDiscountSetAction, updateDiscountSetAction } from "@/lib/actions/discount.actions";
import { useState, useEffect } from "react";
import type { DiscountSet } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";

interface AddCampaignFormProps {
  campaign?: DiscountSet;
  onSuccess: () => void;
}

export function AddCampaignForm({ campaign, onSuccess }: AddCampaignFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!campaign;

  const form = useForm<DiscountSetFormValues>({
    resolver: zodResolver(discountSetSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isDefault: false,
      isOneTimePerTransaction: false,
    },
  });

  useEffect(() => {
    if (isEditMode && campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description ?? "",
        isActive: campaign.isActive,
        isDefault: campaign.isDefault,
        isOneTimePerTransaction: campaign.isOneTimePerTransaction,
      });
    }
  }, [campaign, form, isEditMode]);

  async function onSubmit(data: DiscountSetFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateDiscountSetAction(campaign.id, data)
      : addDiscountSetAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Campaign ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `Campaign "${data.name}" has been successfully saved.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} campaign`,
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
              <FormLabel>Campaign Name</FormLabel>
              <FormControl><Input placeholder="e.g., Sinhala New Year Sale" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="A brief summary of what this campaign does." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
            <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Campaign Active</FormLabel><FormDescription>If disabled, this campaign cannot be selected in the POS.</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
            <FormField control={form.control} name="isOneTimePerTransaction" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>One-Time Rules</FormLabel><FormDescription>If enabled, rules in this campaign apply only once per transaction.</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
             <FormField control={form.control} name="isDefault" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Default Campaign</FormLabel><FormDescription>Make this the default selected campaign in the POS.</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
        </div>

        {/* TODO: Add UI for managing rules here */}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Campaign" : "Save Campaign")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
