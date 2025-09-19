// ===== FILE 2: src/discount-engine/rules/default-item-rule.ts =====
import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet, SpecificDiscountRuleConfig } from '@/types';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';

export class DefaultItemRule implements IDiscountRule {
  private campaign: DiscountSet;
  
  readonly isPotentiallyRepeatable: boolean = true;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  getId(item?: LineItemData): string {
    return `default-${this.campaign.id}${item ? `-${item.lineId}` : ''}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    const isProductDefaultMode = this.campaign.id === 'promo-product-defaults';

    context.items.forEach((item) => {
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult) {
        console.log(`No line result found for ${item.lineId}`);
        return;
      }
      
      // If a higher-priority discount (e.g., custom, batch, product-specific) has already been applied, skip default rules for this item.
      if (item.customDiscountValue != null && item.customDiscountValue > 0) {
        console.log(`Custom discount value is set for ${item.lineId}, skipping default rule.`);
        return;
      }
      
      if (lineResult.totalDiscount > 0) {
        console.log(`Higher priority discount already applied to ${item.lineId}, skipping default rule`);
        return;
      }

      // --- NEW LOGIC FOR PRODUCT DEFAULTS CAMPAIGN ---
      if (isProductDefaultMode) {
        const product = item.product; // The master product is nested in the SaleItem (which extends ProductBatch)
        if (product.defaultDiscount && product.defaultDiscount > 0) {
          const productRuleConfig: SpecificDiscountRuleConfig = {
            isEnabled: true,
            name: `Product Default: ${product.name}`,
            type: product.defaultDiscountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
            value: product.defaultDiscount,
            applyFixedOnce: false, // Product defaults are typically per-unit
            description: `Default discount stored on the product.`
          };
          
          const lineTotal = item.price * item.quantity;
          const discountAmount = evaluateRule(productRuleConfig, item.price, item.quantity, lineTotal, lineTotal);
          
          if (discountAmount > 0) {
            const ruleId = generateRuleId('product-default', product.id, productRuleConfig.type, product.id);
            lineResult.addDiscount({
              ruleId,
              discountAmount,
              description: productRuleConfig.description || 'Product default discount',
              isOneTime: false,
              appliedRuleInfo: {
                discountCampaignName: this.campaign.name,
                sourceRuleName: productRuleConfig.name,
                totalCalculatedDiscount: discountAmount,
                ruleType: 'product_default_discount',
                productIdAffected: product.id,
                appliedOnce: false,
              }
            });
          }
        }
        // Once product-default logic is handled, we stop for this item.
        return; 
      }
      // --- END OF NEW LOGIC ---


      // --- EXISTING LOGIC FOR OTHER CAMPAIGNS ---
      console.log(`Processing default rule for item ${item.lineId}, product ${item.productId}`);
      const lineTotal = item.price * item.quantity;
      
      const rules = [
        { 
          config: this.campaign.defaultLineItemValueRuleJson, 
          valueToTest: lineTotal, 
          type: 'campaign_default_line_item_value' as const,
          description: 'Default line value rule'
        },
        { 
          config: this.campaign.defaultLineItemQuantityRuleJson, 
          valueToTest: item.quantity, 
          type: 'campaign_default_line_item_quantity' as const,
          description: 'Default quantity rule'
        },
        { 
          config: this.campaign.defaultSpecificQtyThresholdRuleJson, 
          valueToTest: item.quantity, 
          type: 'campaign_default_specific_qty_threshold' as const,
          description: 'Default quantity threshold rule'
        },
        { 
          config: this.campaign.defaultSpecificUnitPriceThresholdRuleJson, 
          valueToTest: item.price, 
          type: 'campaign_default_specific_unit_price' as const,
          description: 'Default unit price threshold rule'
        },
      ];
      
      for (const rule of rules) {
        if (!rule.config?.isEnabled) {
          continue;
        }

        const validation = validateRuleConfig(rule.config);
        if (!validation.isValid) {
          console.warn(`Invalid default rule configuration for ${rule.type}:`, validation.errors);
          continue;
        }

        const discountAmount = evaluateRule(
          rule.config, 
          item.price, 
          item.quantity, 
          lineTotal, 
          rule.valueToTest
        );
        
        if (discountAmount > 0) {
          const ruleId = generateRuleId('default', this.campaign.id, rule.type, item.productId);
          const isOneTime = isOneTimeRule(rule.config, this.campaign.isOneTimePerTransaction);

          lineResult.addDiscount({
              ruleId,
              discountAmount,
              description: `${rule.description}: '${rule.config.name}' applied.`,
              isOneTime,
              appliedRuleInfo: {
                  discountCampaignName: this.campaign.name,
                  sourceRuleName: rule.config.name,
                  totalCalculatedDiscount: discountAmount,
                  ruleType: rule.type,
                  productIdAffected: item.productId,
                  appliedOnce: isOneTime
              }
          });
          break;
        }
      }
    });
  }
}
