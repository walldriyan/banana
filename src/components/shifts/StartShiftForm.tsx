// src/components/shifts/StartShiftForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { startShiftAction } from "@/lib/actions/shift.actions";
import { useState } from "react";

const startShiftFormSchema = z.object({
  openingBalance: z.coerce.number().min(0, "Opening balance must be non-negative."),
});

interface StartShiftFormProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function StartShiftForm({ userId, userName, onSuccess }: StartShiftFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof startShiftFormSchema>>({
    resolver: zodResolver(startShiftFormSchema),
    defaultValues: {
      openingBalance: 0,
    },
  });

  async function onSubmit(data: z.infer<typeof startShiftFormSchema>) {
    setIsSubmitting(true);
    const result = await startShiftAction({ ...data, userId, userName });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Shift Started!",
        description: `Your new shift has been successfully started.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error starting shift",
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance (Cash in Drawer)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Confirm & Start Shift"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
