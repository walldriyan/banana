import React from 'react';
// import { DiscountResult } from '@/discount-engine/core/result';
import type { DiscountSet } from '@/types';
import { Skeleton } from './ui/skeleton';

interface DiscountBehaviorPanelProps {
  isCalculating: boolean;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  activeCampaign: DiscountSet;
  transactionId: string;
}

export default function DiscountBehaviorPanel({ 
  isCalculating,
  discountResult, 
  activeCampaign, 
  transactionId 
}: DiscountBehaviorPanelProps) {

  if (isCalculating) {
      return (
          <div className="mt-4 p-4 bg-muted/50 border rounded-lg space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="p-3 bg-background/80 rounded-md shadow-sm space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
              </div>
              <div className="p-3 bg-muted rounded-md">
                   <Skeleton className="h-16 w-full" />
              </div>
          </div>
      )
  }


  const appliedRules = (discountResult && typeof discountResult.getAppliedRulesSummary === 'function') 
    ? discountResult.getAppliedRulesSummary() 
    : [];
  
  return (
    <div className="mt-4 p-4 bg-muted/50 border rounded-lg">
      <h4 className="font-bold text-foreground mb-3 flex items-center">
        <span className="mr-2">🔍</span>
        Discount Behavior Analysis
      </h4>
      
      {/* Campaign Info */}
      <div className="mb-4 p-3 bg-background rounded-md shadow-sm">
        <div className="text-sm">
          <div className="font-semibold text-foreground">Active Campaign: {activeCampaign.name}</div>
          <div className="text-muted-foreground text-xs mt-1">{activeCampaign.description}</div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${
              activeCampaign.isOneTimePerTransaction 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
            }`}>
              {activeCampaign.isOneTimePerTransaction ? 'One-Time Rules' : 'Repeatable Rules'}
            </span>
            <span className="text-muted-foreground">Transaction: {transactionId.slice(-8)}...</span>
          </div>
        </div>
      </div>

      {/* Applied Rules Breakdown */}
      {appliedRules.length > 0 ? (
        <div className="space-y-2">
          <div className="font-semibold text-foreground text-sm">Applied Rules:</div>
          {appliedRules.map((rule, index) => (
            <div key={index} className="p-2 bg-background/80 rounded border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{rule.sourceRuleName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
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
        <div className="text-sm text-muted-foreground italic">No discount rules applied</div>
      )}

      {/* Calculation Summary */}
      <div className="mt-4 p-3 bg-muted/80 rounded-md">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Original Subtotal:</div>
            <div className="font-semibold">Rs.{(discountResult?.originalSubtotal || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Discount:</div>
            <div className="font-semibold text-green-600">-Rs.{(discountResult?.totalDiscount || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Item Discounts:</div>
            <div className="font-medium">-Rs.{(discountResult?.totalItemDiscount || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Cart Discounts:</div>
            <div className="font-medium">-Rs.{(discountResult?.totalCartDiscount || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Behavior Explanation */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-md">
        <div className="text-sm text-amber-800 dark:text-amber-300">
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
