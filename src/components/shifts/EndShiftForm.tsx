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
import { endShiftAction, type ShiftWithCalculations } from "@/lib/actions/shift.actions";
import { useState, useMemo, useEffect } from "react";
import type { Shift } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";

const endShiftFormSchema = z.object({
  closingBalance: z.coerce.number().min(0, "Closing balance must be non-negative."),
  notes: z.string().optional(),
});

interface EndShiftFormProps {
  shift: ShiftWithCalculations;
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
  
  const closingBalance = form.watch('closingBalance');
  
  const calculatedTotal = useMemo(() => {
      return (shift.openingBalance || 0) + (shift.calculatedSales || 0);
  }, [shift.openingBalance, shift.calculatedSales]);
  
  const difference = useMemo(() => {
      return closingBalance - calculatedTotal;
  }, [closingBalance, calculatedTotal]);

  async function onSubmit(data: z.infer<typeof endShiftFormSchema>) {
    setIsSubmitting(true);
    const result = await endShiftAction({
      ...data,
      shiftId: shift.id,
      calculatedSales: shift.calculatedSales || 0
    });
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
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-semibold">{shift.userName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="font-semibold">{format(new Date(shift.startTime), "PPp")}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Opening Balance:</span>
                    <span className="font-semibold">Rs. {shift.openingBalance.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculated Sales:</span>
                    <span className="font-semibold text-blue-600">Rs. {(shift.calculatedSales || 0).toFixed(2)}</span>
                </div>
                 <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Expected in Drawer:</span>
                    <span>Rs. {calculatedTotal.toFixed(2)}</span>
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
        
        <div className={`p-3 rounded-md text-center font-bold text-lg ${
            difference === 0 ? 'bg-muted' : difference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
            Difference: Rs. {difference.toFixed(2)}
        </div>

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
