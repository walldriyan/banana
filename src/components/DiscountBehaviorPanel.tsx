import React from 'react';
// import { DiscountResult } from '@/discount-engine/core/result';
import type { DiscountSet } from '@/types';

interface DiscountBehaviorPanelProps {
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  activeCampaign: DiscountSet;
  transactionId: string;
}

export default function DiscountBehaviorPanel({ 
  discountResult, 
  activeCampaign, 
  transactionId 
}: DiscountBehaviorPanelProps) {
  const appliedRules = (discountResult && typeof discountResult.getAppliedRulesSummary === 'function') 
    ? discountResult.getAppliedRulesSummary() 
    : [];
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <h4 className="font-bold text-blue-900 mb-3 flex items-center">
        <span className="mr-2">🔍</span>
        Discount Behavior Analysis
      </h4>
      
      {/* Campaign Info */}
      <div className="mb-4 p-3 bg-white rounded-md shadow-sm">
        <div className="text-sm">
          <div className="font-semibold text-gray-800">Active Campaign: {activeCampaign.name}</div>
          <div className="text-gray-600 text-xs mt-1">{activeCampaign.description}</div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${
              activeCampaign.isOneTimePerTransaction 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {activeCampaign.isOneTimePerTransaction ? 'One-Time Rules' : 'Repeatable Rules'}
            </span>
            <span className="text-gray-500">Transaction: {transactionId.slice(-8)}...</span>
          </div>
        </div>
      </div>

      {/* Applied Rules Breakdown */}
      {appliedRules.length > 0 ? (
        <div className="space-y-2">
          <div className="font-semibold text-gray-800 text-sm">Applied Rules:</div>
          {appliedRules.map((rule, index) => (
            <div key={index} className="p-2 bg-white rounded border-l-4 border-blue-400">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{rule.sourceRuleName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Type: {rule.ruleType.replace(/_/g, ' ')}
                    {rule.productIdAffected && ` | Product: ${rule.productIdAffected}`}
                    {rule.appliedOnce && <span className="ml-2 text-orange-600">(One-time)</span>}
                  </div>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  -Rs.{rule.totalCalculatedDiscount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">No discount rules applied</div>
      )}

      {/* Calculation Summary */}
      <div className="mt-4 p-3 bg-gray-100 rounded-md">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Original Subtotal:</div>
            <div className="font-semibold">Rs.{(discountResult?.originalSubtotal || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Discount:</div>
            <div className="font-semibold text-green-600">-Rs.{(discountResult?.totalDiscount || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-600">Item Discounts:</div>
            <div className="font-medium">-Rs.{(discountResult?.totalItemDiscount || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-600">Cart Discounts:</div>
            <div className="font-medium">-Rs.{(discountResult?.totalCartDiscount || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Behavior Explanation */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="text-sm text-yellow-800">
          <div className="font-semibold mb-2">💡 Understanding Discount Behavior:</div>
          <div className="space-y-1 text-xs">
            <div><strong>applyFixedOnce: true</strong> = Fixed amount applied once per line item (quantity නොබලා)</div>
            <div><strong>applyFixedOnce: false</strong> = Fixed amount × quantity (quantity වැඩි වෙනකොට discount එකත් වැඩි)</div>
            <div><strong>Percentage rules</strong> = Always calculated on total line value (quantity ගැන automatic)</div>
            <div><strong>Rule Priority</strong> = Custom &gt; Batch &gt; Product &gt; Default &gt; Cart</div>
          </div>
        </div>
      </div>
    </div>
  );
}
