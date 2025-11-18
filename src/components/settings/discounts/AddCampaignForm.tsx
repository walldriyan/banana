// src/components/settings/discounts/AddCampaignForm.tsx
"use client";

import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discountSetSchema, type DiscountSetFormValues, specificDiscountRuleSchema } from "@/lib/validation/discount.schema";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Percent, ShoppingCart, Archive } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const RuleEditor = ({ control, name, title, description }: { control: any, name: string, title: string, description: string }) => {
  const isEnabled = useFormContext().watch(`${name}.isEnabled`);

  return (
    <Card className={!isEnabled ? "opacity-60 bg-muted/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
         <FormField
          control={control}
          name={`${name}.isEnabled`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </CardHeader>
      {isEnabled && (
          <CardContent className="space-y-4 border-t pt-6">
             <FormField control={control} name={`${name}.name`} render={({ field }) => ( <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name={`${name}.conditionMin`} render={({ field }) => ( <FormItem><FormLabel>Minimum Condition</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Minimum value/qty to activate.</FormDescription><FormMessage /></FormItem> )} />
                <FormField control={control} name={`${name}.conditionMax`} render={({ field }) => ( <FormItem><FormLabel>Maximum Condition</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Maximum value/qty to activate.</FormDescription><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name={`${name}.type`} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="percentage"><Percent className="inline-block mr-2 h-4 w-4" />Percentage</SelectItem>
                                <SelectItem value="fixed"><DollarSign className="inline-block mr-2 h-4 w-4" />Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={control} name={`${name}.value`} render={({ field }) => ( <FormItem><FormLabel>Discount Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={control} name={`${name}.applyFixedOnce`} render={({ field }) => ( <FormItem className="flex items-center justify-between"><FormLabel>Apply Fixed Amount Per-Unit</FormLabel><FormControl><Switch checked={!field.value} onCheckedChange={(checked) => field.onChange(!checked)} /></FormControl><FormDescription className="text-xs">ON = (Qty * Value), OFF = (Value)</FormDescription></FormItem> )} />
             <FormField control={control} name={`${name}.description`} render={({ field }) => ( <FormItem><FormLabel>Rule Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
      )}
    </Card>
  );
};


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
      // Initialize rule objects to avoid uncontrolled component errors
      globalCartPriceRuleJson: { isEnabled: false, name: '', type: 'fixed', value: 0 },
      globalCartQuantityRuleJson: { isEnabled: false, name: '', type: 'fixed', value: 0 },
      defaultLineItemValueRuleJson: { isEnabled: false, name: '', type: 'percentage', value: 0 },
      defaultLineItemQuantityRuleJson: { isEnabled: false, name: '', type: 'fixed', value: 0 },
      defaultSpecificQtyThresholdRuleJson: { isEnabled: false, name: '', type: 'fixed', value: 0 },
      defaultSpecificUnitPriceThresholdRuleJson: { isEnabled: false, name: '', type: 'fixed', value: 0 },
    },
  });

  useEffect(() => {
    if (isEditMode && campaign) {
      const getRuleOrDefault = (rule: any) => rule || { isEnabled: false, name: '', type: 'fixed', value: 0 };
      form.reset({
        name: campaign.name,
        description: campaign.description ?? "",
        isActive: campaign.isActive,
        isDefault: campaign.isDefault,
        isOneTimePerTransaction: campaign.isOneTimePerTransaction,
        globalCartPriceRuleJson: getRuleOrDefault(campaign.globalCartPriceRuleJson),
        globalCartQuantityRuleJson: getRuleOrDefault(campaign.globalCartQuantityRuleJson),
        defaultLineItemValueRuleJson: getRuleOrDefault(campaign.defaultLineItemValueRuleJson),
        defaultLineItemQuantityRuleJson: getRuleOrDefault(campaign.defaultLineItemQuantityRuleJson),
        defaultSpecificQtyThresholdRuleJson: getRuleOrDefault(campaign.defaultSpecificQtyThresholdRuleJson),
        defaultSpecificUnitPriceThresholdRuleJson: getRuleOrDefault(campaign.defaultSpecificUnitPriceThresholdRuleJson),
      });
    }
  }, [campaign, form, isEditMode]);

  async function onSubmit(data: DiscountSetFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateDiscountSetAction(campaign!.id, data)
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
         <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="e.g., Sinhala New Year Sale" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief summary of what this campaign does." {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>Behavior Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Campaign Active</FormLabel><FormDescription>If disabled, this campaign cannot be selected in the POS.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
              <FormField control={form.control} name="isOneTimePerTransaction" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>One-Time Rules</FormLabel><FormDescription>If enabled, rules in this campaign apply only once per transaction.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
              <FormField control={form.control} name="isDefault" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Default Campaign</FormLabel><FormDescription>Make this the default selected campaign in the POS.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
          </CardContent>
        </Card>
        

        <Accordion type="multiple" className="w-full space-y-4">
            <AccordionItem value="cart-rules" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold px-4 py-3 bg-muted rounded-md hover:no-underline">
                   <div className="flex items-center gap-3"><ShoppingCart /> Global Cart Rules</div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <RuleEditor control={form.control} name="globalCartPriceRuleJson" title="Cart Price Rule" description="Discount based on the total value of the cart." />
                    <RuleEditor control={form.control} name="globalCartQuantityRuleJson" title="Cart Quantity Rule" description="Discount based on the total number of items in the cart." />
                </AccordionContent>
            </AccordionItem>
            
             <AccordionItem value="default-rules" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold px-4 py-3 bg-muted rounded-md hover:no-underline">
                   <div className="flex items-center gap-3"><Archive /> Default Item Rules</div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                   <RuleEditor control={form.control} name="defaultLineItemValueRuleJson" title="Default Line Value Rule" description="Applies when a line's total value meets criteria." />
                   <RuleEditor control={form.control} name="defaultLineItemQuantityRuleJson" title="Default Line Quantity Rule" description="Applies when a line's quantity meets criteria." />
                   <RuleEditor control={form.control} name="defaultSpecificQtyThresholdRuleJson" title="Default Specific Qty Rule" description="Another quantity-based default rule." />
                   <RuleEditor control={form.control} name="defaultSpecificUnitPriceThresholdRuleJson" title="Default Unit Price Rule" description="Applies based on an item's single unit price." />
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-4 pt-4 border-t">
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
