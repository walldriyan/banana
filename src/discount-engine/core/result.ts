// src/discount-engine/core/result.ts
import { DiscountContext, LineItemData } from './context';
import type { AppliedRuleInfo } from '@/types';

/**
 * Represents the discount applied to a single line item.
 */
export interface DiscountApplication {
  ruleId: string; // A unique identifier for the rule that was applied
  discountAmount: number; // The amount of discount applied by this rule
  description: string; // A description of why the discount was applied
  appliedRuleInfo: AppliedRuleInfo;
  isOneTime?: boolean; // Track if this is a one-time application
}

/**
 * Holds the results of discount calculations for a single line item.
 */
export class LineItemResult {
  lineId: string;
  productId: string;
  batchId?: string | null;
  originalPrice: number;
  quantity: number;
  totalDiscount: number = 0;
  appliedRules: DiscountApplication[] = [];
  private oneTimeRulesApplied: Set<string> = new Set();

  constructor(lineItem: LineItemData) {
    this.lineId = lineItem.lineId;
    this.productId = lineItem.productId;
    this.batchId = lineItem.id; // The unique product ID is the batch ID
    this.originalPrice = lineItem.price;
    this.quantity = lineItem.quantity;
  }

  /**
   * Check if a one-time rule has been applied to this line item
   */
  private hasOneTimeRuleBeenApplied(ruleId: string): boolean {
    return this.oneTimeRulesApplied.has(ruleId);
  }

  /**
   * Mark a one-time rule as applied to this line item
   */
  private markOneTimeRuleAsApplied(ruleId: string): void {
    this.oneTimeRulesApplied.add(ruleId);
  }

  addDiscount(application: DiscountApplication): void {
    // DEBUG: Log the discount application being added
    console.log(`[LineItemResult] addDiscount called for line ${this.lineId}:`, application);
    
    // Check one-time rule logic
    if (application.isOneTime && this.hasOneTimeRuleBeenApplied(application.ruleId)) {
      console.log(`[LineItemResult] One-time rule ${application.ruleId} already applied to line ${this.lineId}, skipping.`);
      return;
    }

    const originalLineTotal = this.originalPrice * this.quantity;
    // Ensure the discount doesn't exceed the remaining value of the line item
    const applicableDiscount = Math.min(application.discountAmount,originalLineTotal - this.totalDiscount );

    if (applicableDiscount > 0) {
      this.totalDiscount += applicableDiscount;
      this.appliedRules.push({ ...application, discountAmount: applicableDiscount });
      console.log(`[LineItemResult] Discount of ${applicableDiscount} applied. New total discount for line ${this.lineId}: ${this.totalDiscount}`);
      
      // Mark one-time rule as applied if applicable
      if (application.isOneTime) {
        this.markOneTimeRuleAsApplied(application.ruleId);
        console.log(`[LineItemResult] Marked rule ${application.ruleId} as one-time applied.`);
      }
    } else {
        console.log(`[LineItemResult] Applicable discount for rule ${application.ruleId} is 0 or less. No discount added.`);
    }
    
  }

  get netPrice(): number {
    return this.originalPrice * this.quantity - this.totalDiscount;
  }

  /**
   * Reset one-time rule tracking for this line item
   */
  resetOneTimeRules(): void {
    this.oneTimeRulesApplied.clear();
  }
}

/**
 * Aggregates all discount results for an entire sale.
 */
export class DiscountResult {
  lineItems: LineItemResult[];
  totalItemDiscount: number = 0;
  totalCartDiscount: number = 0;
  appliedCartRules: DiscountApplication[] = [];
  private oneTimeCartRulesApplied: Set<string> = new Set();

  constructor(context: DiscountContext) {
    this.lineItems = context.items.map((item) => new LineItemResult(item));
  }

  getLineItem(lineId: string): LineItemResult | undefined {
    return this.lineItems.find((li) => li.lineId === lineId);
  }

  /**
   * Check if a one-time cart rule has been applied
   */
  private hasOneTimeCartRuleBeenApplied(ruleId: string): boolean {
    return this.oneTimeCartRulesApplied.has(ruleId);
  }

  /**
   * Mark a one-time cart rule as applied
   */
  private markOneTimeCartRuleAsApplied(ruleId: string): void {
    this.oneTimeCartRulesApplied.add(ruleId);
  }

  addCartDiscount(application: DiscountApplication): void {
    // Check one-time rule logic for cart-level discounts
    if (application.isOneTime && this.hasOneTimeCartRuleBeenApplied(application.ruleId)) {
      console.log(`One-time cart rule ${application.ruleId} already applied, skipping.`);
      return;
    }

    // Ensure cart discount doesn't exceed remaining subtotal
    const subtotalAfterItemDiscounts = this.lineItems.reduce((sum, li) => sum + li.netPrice, 0);
    const applicableDiscount = Math.min(application.discountAmount, subtotalAfterItemDiscounts - this.totalCartDiscount);

    if (applicableDiscount > 0) {
      this.totalCartDiscount += applicableDiscount;
      this.appliedCartRules.push({ ...application, discountAmount: applicableDiscount });
      
      // Mark one-time rule as applied if applicable
      if (application.isOneTime) {
        this.markOneTimeCartRuleAsApplied(application.ruleId);
      }
    }
  }

  /**
   * Finalizes the totals after all rules have been applied.
   */
  finalize(): void {
    this.totalItemDiscount = this.lineItems.reduce(
      (sum, item) => sum + item.totalDiscount,
      0
    );
    // Cart discount is already calculated via addCartDiscount
  }

  /**
   * Generates a flat list of all applied rules for summary purposes.
   */
  getAppliedRulesSummary(): AppliedRuleInfo[] {
    const summary: AppliedRuleInfo[] = [];

    this.lineItems.forEach((line) => {
      line.appliedRules.forEach((app) => {
        summary.push(app.appliedRuleInfo);
      });
    });

    this.appliedCartRules.forEach((app) => {
      summary.push(app.appliedRuleInfo);
    });

    return summary;
  }

  /**
   * Reset all one-time rule tracking
   */
  resetOneTimeRules(): void {
    this.oneTimeCartRulesApplied.clear();
    this.lineItems.forEach(item => item.resetOneTimeRules());
  }

  /**
   * Get total discount amount (item + cart discounts)
   */
  get totalDiscount(): number {
    return this.totalItemDiscount + this.totalCartDiscount;
  }

  /**
   * Get subtotal before any discounts
   */
  get originalSubtotal(): number {
    return this.lineItems.reduce((sum, li) => sum + (li.originalPrice * li.quantity), 0);
  }

  /**
   * Get final total after all discounts
   */
  get finalTotal(): number {
    return this.originalSubtotal - this.totalDiscount;
  }
}
