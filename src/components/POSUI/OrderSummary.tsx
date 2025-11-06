// src/components/POSUI/OrderSummary.tsx
import React from 'react';
import { Button } from '../ui/button';
import { SlidersHorizontal } from 'lucide-react';

interface OrderSummaryProps {
  originalTotal: number;
  finalTotal: number;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  onOpenAnalysis: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ originalTotal, finalTotal, discountResult, onOpenAnalysis }) => {
  const appliedRulesSummary = (discountResult && typeof discountResult.getAppliedRulesSummary === 'function')
    ? discountResult.getAppliedRulesSummary()
    : [];

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden  ">
      <div className="flex justify-between items-center relative">
        <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenAnalysis}>
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Open Discount Analysis</span>
        </Button>
      </div>
      <div className="text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Original Total:</span>
          <span className={appliedRulesSummary.length > 0 ? "line-through text-muted-foreground" : "text-foreground"}>
            Rs. {originalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {appliedRulesSummary.length > 0 && (
        <div className="space-y-3 rounded-xl border  h-full p-4  relative">
          <h5 className="  w-full text-sm font-semibold text-foreground">Applied Discounts Breakdown:</h5>
          <div className="space-y-1 h-full ">
            {discountResult.lineItems
              .flatMap((li: any) => li.appliedRules.map((rule: any) => ({ ...rule, lineItem: li })))
              .map((rule: any, i: number) => (
                <div key={`item-disc-${i}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate pr-2">(Item) {rule.appliedRuleInfo.sourceRuleName}</span>
                  <span className="font-medium text-green-600">-Rs. {rule.discountAmount.toFixed(2)}</span>
                </div>
              ))}
            {discountResult.appliedCartRules.map((rule: any, i: number) => (
              <div key={`cart-disc-${i}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">(Cart) {rule.appliedRuleInfo.sourceRuleName}</span>
                <span className="font-medium text-green-600">-Rs. {rule.discountAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {/* <div className=" bg-red-400 bottom-0 w-full border-t border-border pt-2 mt-2 flex justify-between font-semibold text-sm">
            <span className="text-foreground">Total All Discounts:</span>
            <span className="text-green-600">
              -Rs. {(discountResult.totalItemDiscount + discountResult.totalCartDiscount).toFixed(2)}
            </span>
          </div> */}
        </div>
      )}
      {/* <div className="mt-auto pt-4 border-t-2 border-border flex justify-between items-baseline">
        <span className="text-lg font-semibold text-foreground">Final Total</span>
        <span className="text-3xl font-bold text-primary">Rs. {finalTotal.toFixed(2)}</span>
      </div> */}
    </div>
  );
};

export default OrderSummary;
