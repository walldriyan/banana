
import React from 'react';
import type { DiscountSet, AppliedRuleInfo, SerializedDiscountResult } from '@/types';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { ArrowRight, Gift, ShoppingCart, Tag } from 'lucide-react';


interface DiscountBehaviorPanelProps {
    isCalculating: boolean;
    discountResult: SerializedDiscountResult; // Using SerializedDiscountResult for type safety
    activeCampaign: DiscountSet;
    transactionId: string;
}

const getRuleTypeFriendlyName = (ruleType: string) => {
    const names: Record<string, string> = {
        'custom_item_discount': 'Manual Discount',
        'batch_config_line_item_value': 'Batch Price Rule',
        'batch_config_line_item_quantity': 'Batch Quantity Rule',
        'product_config_line_item_value': 'Product Price Rule',
        'product_config_line_item_quantity': 'Product Quantity Rule',
        'buy_get_rule': 'BOGO Rule',
        'campaign_default_line_item_value': 'Default Item Rule',
        'campaign_global_cart_price': 'Cart Total Rule',
        'campaign_global_cart_quantity': 'Cart Quantity Rule',
    };
    return names[ruleType] || ruleType.replace(/_/g, ' ');
}

// --- Friendly Sinhala Explanation Component ---
const DiscountExplanation = ({ result }: { result: SerializedDiscountResult }) => {
    let runningTotal = result.originalSubtotal;

    const allItemRules = result.lineItems.flatMap((li) =>
        li.appliedRules.map((rule) => ({
            ...rule.appliedRuleInfo,
            lineItemName: result.lineItems.find((l) => l.lineId === li.lineId)?.productId || 'Unknown Item'
        }))
    );

    const allCartRules = result.appliedCartRules.map((rule) => rule.appliedRuleInfo);

    if (allItemRules.length === 0 && allCartRules.length === 0) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <p className="font-semibold text-green-800 dark:text-green-300">
                    මේ transaction එකට කිසිම වට්ටමක් (discount) ලැබිලා නැහැ.
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    බිලේ මුළු එකතුව (Final Total) එක original subtotal එකට සමානයි.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 text-sm font-sans">
            {/* Step 1: Original Total */}
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">1</div>
                <div>
                    <p className="text-muted-foreground">මුලින්ම, ඔයාගේ බිලේ මුල් එකතුව (Original Total) ගමු.</p>
                    <p className="font-bold text-lg text-foreground">Rs. {result.originalSubtotal.toFixed(2)}</p>
                </div>
            </div>

            {/* Step 2: Item Discounts */}
            {allItemRules.map((rule: AppliedRuleInfo & { lineItemName: string }, index: number) => {
                const previousTotal = runningTotal;
                runningTotal -= rule.totalCalculatedDiscount;
                return (
                    <div key={`item-rule-${index}`} className="pl-6 border-l-2 border-dashed border-primary ml-4 py-2">
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-primary">Item Discount එකක් ලැබුණා!</p>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            ඔයාගේ '<span className="font-medium text-foreground">{rule.lineItemName}</span>' කියන item එකට '<span className="font-medium text-foreground">{rule.sourceRuleName}</span>' rule එක නිසා <span className="font-bold text-green-600">Rs. {rule.totalCalculatedDiscount.toFixed(2)}</span> ක වට්ටමක් ලැබුණා.
                        </p>
                        <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                            <span className="line-through text-muted-foreground">Rs. {previousTotal.toFixed(2)}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-bold text-foreground text-sm">Rs. {runningTotal.toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}

            {/* Step 3: Cart Discounts */}
            {allCartRules.map((rule: AppliedRuleInfo, index: number) => {
                const previousTotal = runningTotal;
                runningTotal -= rule.totalCalculatedDiscount;
                return (
                    <div key={`cart-rule-${index}`} className="pl-6 border-l-2 border-dashed border-purple-500 ml-4 py-2">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-purple-500" />
                            <p className="font-semibold text-purple-600 dark:text-purple-400">මුළු Bill එකටම Discount එකක්!</p>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            දැන් මුළු bill එකටම අදාළ වෙන '<span className="font-medium text-foreground">{rule.sourceRuleName}</span>' rule එක නිසා තවත් <span className="font-bold text-green-600">Rs. {rule.totalCalculatedDiscount.toFixed(2)}</span> ක වට්ටමක් ලැබුණා.
                        </p>
                        <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                            <span className="line-through text-muted-foreground">Rs. {previousTotal.toFixed(2)}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-bold text-foreground text-sm">Rs. {runningTotal.toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}

            {/* Step 4: Final Total */}
            <div className="flex items-center gap-3 pt-4 border-t mt-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold text-white">
                    <Gift className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-muted-foreground">මේ எல்லா discounts එක්ක, ඔයාගේ අන්තිම බිල (Final Total) තමයි මේ.</p>
                    <p className="font-bold text-2xl text-green-700 dark:text-green-400">Rs. {result.finalTotal.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};


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
                <div className="space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        )
    }

    // Check if discountResult and its properties are available
    if (!discountResult || !discountResult.lineItems) {
        return (
            <div className="mt-4 p-4 bg-muted/50 border rounded-lg">
                <p className="text-muted-foreground text-center">No discount information to display.</p>
            </div>
        )
    }

    return (
        <div className="mt-4 p-4 bg-muted/50 border rounded-lg space-y-6">
            <div>
                <h4 className="font-bold text-foreground mb-1 flex items-center">
                    <span className="mr-2">💡</span>
                    Discount එක හදාගත්ත හැටි
                </h4>
                <p className="text-xs text-muted-foreground">
                    '{activeCampaign.name}' campaign එකට අනුව ඔයාගේ bill එකට discount ලැබුණු විදිහ පහලින් තියෙනවා.
                </p>
            </div>

            <DiscountExplanation result={discountResult} />

        </div>
    );
}
