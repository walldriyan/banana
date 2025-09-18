// src/components/purchases/AddPurchaseForm.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { grnSchema, type GrnFormValues } from "@/lib/validation/grn.schema";
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
// import { addGrnAction, updateGrnAction } from "@/lib/actions/purchase.actions";
import { useState, useEffect } from "react";
import type { GoodsReceivedNote } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AddPurchaseFormProps {
  grn?: GoodsReceivedNote;
  onSuccess: () => void;
}

// Dummy placeholder for now
const grnSchema = {} as any;
type GrnFormValues = any;

export function AddPurchaseForm({ grn, onSuccess }: AddPurchaseFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!grn;

  const form = useForm<GrnFormValues>({
    // resolver: zodResolver(grnSchema),
    // defaultValues: {},
  });

  useEffect(() => {
    if (isEditMode && grn) {
      // form.reset(grn);
    }
  }, [grn, form, isEditMode]);

  async function onSubmit(data: GrnFormValues) {
    setIsSubmitting(true);
    // const action = isEditMode
    //   ? updateGrnAction(grn.id, data)
    //   : addGrnAction(data);

    // const result = await action;
    const result = { success: false, error: "Submit not implemented yet." }; // Placeholder
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `GRN ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `The purchase record has been successfully saved.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'adding'} GRN`,
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>GRN Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p>GRN form will be built here in the next step.</p>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update GRN" : "Save GRN")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
