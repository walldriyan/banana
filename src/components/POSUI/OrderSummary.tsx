// src/components/POSUI/OrderSummary.tsx
import React from 'react';
// import type { DiscountResult } from '@/discount-engine/core/result';

interface OrderSummaryProps {
  originalTotal: number;
  finalTotal: number;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ originalTotal, finalTotal, discountResult }) => {
  const appliedRulesSummary = (discountResult && typeof discountResult.getAppliedRulesSummary === 'function')
    ? discountResult.getAppliedRulesSummary()
    : [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
      <div className="text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Original Total:</span>
          <span className={appliedRulesSummary.length > 0 ? "line-through text-gray-400" : ""}>
            Rs. {originalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {appliedRulesSummary.length > 0 && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-white p-4">
          <h5 className="text-sm font-semibold text-gray-900">Applied Discounts Breakdown:</h5>
          <div className="space-y-1">
            {discountResult.lineItems
              .flatMap((li: any) => li.appliedRules.map((rule: any) => ({ ...rule, lineItem: li })))
              .map((rule: any, i: number) => (
                <div key={`item-disc-${i}`} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-2">(Item) {rule.appliedRuleInfo.sourceRuleName}</span>
                  <span className="font-medium text-green-700">-Rs. {rule.discountAmount.toFixed(2)}</span>
                </div>
              ))}
            {discountResult.appliedCartRules.map((rule: any, i: number) => (
              <div key={`cart-disc-${i}`} className="flex justify-between text-sm">
                <span className="text-gray-600">(Cart) {rule.appliedRuleInfo.sourceRuleName}</span>
                <span className="font-medium text-green-700">-Rs. {rule.discountAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-sm">
            <span className="text-gray-900">Total All Discounts:</span>
            <span className="text-green-700">
              -Rs. {(discountResult.totalItemDiscount + discountResult.totalCartDiscount).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      <div className="mt-4 pt-4 border-t-2 border-gray-300 flex justify-between items-baseline">
        <span className="text-lg font-semibold text-gray-900">Final Total</span>
        <span className="text-3xl font-bold text-blue-700">Rs. {finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
