// src/components/shifts/EndShiftForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { endShiftAction } from "@/lib/actions/shift.actions";
import { useState } from "react";
import type { Shift } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";

const endShiftFormSchema = z.object({
  closingBalance: z.coerce.number().min(0, "Closing balance must be non-negative."),
  notes: z.string().optional(),
});

interface EndShiftFormProps {
  shift: Shift;
  onSuccess: () => void;
}

export function EndShiftForm({ shift, onSuccess }: EndShiftFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof endShiftFormSchema>>({
    resolver: zodResolver(endShiftFormSchema),
    defaultValues: {
      closingBalance: 0,
      notes: "",
    },
  });

  async function onSubmit(data: z.infer<typeof endShiftFormSchema>) {
    setIsSubmitting(true);
    const result = await endShiftAction({ ...data, shiftId: shift.id });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Shift Ended!",
        description: `Your shift has been successfully closed.`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error ending shift",
        description: result.error,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Shift Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-semibold">{shift.userName}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="font-semibold">{format(new Date(shift.startTime), "PPp")}</span>
                </div>
                 <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Opening Balance:</span>
                    <span className="font-semibold">Rs. {shift.openingBalance.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="closingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closing Balance (Actual Cash Counted)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any notes about this shift (e.g., discrepancies)..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? "Ending..." : "Confirm & End Shift"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
