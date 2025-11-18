// src/discount-engine/rules/interface.ts
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';

// /**
//  * Defines the contract for all discount rules.
//  * Each rule must implement the `apply` method.
//  */
// export interface IDiscountRule {
//   /**
//    * A flag to indicate if this type of rule can be applied multiple times in a transaction.
//    * The DiscountEngine will use this to enforce one-time-deal logic.
//    * Example: A Buy-Get-Free rule might be repeatable, but a simple 10% off is not.
//    */
//   readonly isPotentiallyRepeatable: boolean;

//   /**
//    * Returns a unique, stable identifier for this specific rule instance.
//    * This is crucial for the engine to track which rules have already been applied.
//    * For item-specific rules, it might need the item context.
//    */
//   getId(item?: LineItemData): string;

//   /**
//    * Evaluates the rule against the current sale context and applies
//    * discounts to the result object if conditions are met.
//    * @param context The current state of the sale (items, customer, etc.).
//    * @param result The object to which applied discounts should be added.
//    */
//   apply(context: DiscountContext, result: DiscountResult): void;
// }
export interface IDiscountRule {
  readonly isPotentiallyRepeatable: boolean;
  getId(item?: LineItemData): string;
  apply(context: DiscountContext, result: DiscountResult): void;
}