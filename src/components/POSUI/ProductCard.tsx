// src/components/POSUI/ProductCard.tsx
import React from 'react';
import type { Product, DiscountSet, SpecificDiscountRuleConfig, ProductBatch } from '@/types';
import DiscountBadge from './DiscountBadge';

// Helper function to format a single rule for display in Sinhala
const formatRule = (rule: SpecificDiscountRuleConfig, prefix = ""): string => {
  if (!rule.isEnabled) return "";
  
  const valueStr = rule.type === 'percentage' ? `${rule.value}% ක` : `රු. ${rule.value.toFixed(2)} ක`;
  const perItemStr = rule.applyFixedOnce ? "මුළු අයිතමයටම" : "එක් අයිතමයකට";

  let conditionStr = "";
  if (rule.conditionMin) {
    conditionStr = `අයිතම ${rule.conditionMin} ක් හෝ ඊට වඩා ගත්විට`;
  }
  
  let baseDescription = `"${rule.name}" දීමනාව:`;

  if (rule.type === 'fixed') {
      baseDescription += ` ${valueStr} වට්ටමක් (${perItemStr})`;
  } else {
      baseDescription += ` ${valueStr} වට්ටමක්`;
  }

  if (conditionStr) {
      baseDescription += `, ${conditionStr}.`;
  } else {
      baseDescription += `.`
  }

  return `${prefix}${baseDescription}`;
};


// Helper function to get all potential discounts for a product/batch
const getAvailableDiscountsInfo = (productId: string, batchId: string | undefined, campaign: DiscountSet, products: Product[]): string[] => {
  const discounts: string[] = [];

  // 1. Batch-specific discounts
  if (batchId && campaign.batchConfigurations) {
    campaign.batchConfigurations
      .filter(conf => conf.productBatchId === batchId && conf.isActiveForBatchInCampaign)
      .forEach(conf => {
        if (conf.lineItemValueRuleJson) discounts.push(formatRule(conf.lineItemValueRuleJson, '(Batch Offer) '));
        if (conf.lineItemQuantityRuleJson) discounts.push(formatRule(conf.lineItemQuantityRuleJson, '(Batch Offer) '));
      });
  }

  // 2. Product-specific discounts
  if (campaign.productConfigurations) {
    campaign.productConfigurations
      .filter(conf => conf.productId === productId && conf.isActiveForProductInCampaign)
      .forEach(conf => {
        if (conf.lineItemValueRuleJson) discounts.push(formatRule(conf.lineItemValueRuleJson));
        if (conf.lineItemQuantityRuleJson) discounts.push(formatRule(conf.lineItemQuantityRuleJson));
        if (conf.specificQtyThresholdRuleJson) discounts.push(formatRule(conf.specificQtyThresholdRuleJson));
        if (conf.specificUnitPriceThresholdRuleJson) discounts.push(formatRule(conf.specificUnitPriceThresholdRuleJson));
      });
  }
  
  // 3. Buy X Get Y rules
  if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson
          .filter(rule => rule.buyProductId === productId)
          .forEach(rule => {
              const otherProduct = products.find(p => p.id === rule.getProductId);
              if (otherProduct) {
                  discounts.push(`"${rule.name}" දීමනාව: මෙම භාණ්ඩයෙන් ${rule.buyQuantity}ක් ගත්විට, ${otherProduct.name} සඳහා විශේෂ වට්ටමක්!`);
              }
          });
  }

  return discounts.filter(d => d);
};

interface ProductCardProps {
  product: Product;
  activeCampaign: DiscountSet;
  onAddToCart: (product: Product, batch?: ProductBatch) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, activeCampaign, onAddToCart }) => {
  const productDiscounts = getAvailableDiscountsInfo(product.id, undefined, activeCampaign, [product]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
        {!product.batches && (
          <span className="text-lg font-bold text-gray-800">Rs. {product.sellingPrice.toFixed(2)}</span>
        )}
      </div>

      {productDiscounts.length > 0 && !product.batches && (
        <DiscountBadge discounts={productDiscounts} />
      )}

      {product.batches ? (
        <div className="mt-3 space-y-3">
          {product.batches.map((b) => {
            const batchDiscounts = getAvailableDiscountsInfo(product.id, b.id, activeCampaign, [product]);
            return (
              <div key={b.id} className="flex flex-col gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-700">
                    <span className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                      Batch
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">{b.batchNumber}</span> • Rs. {b.sellingPrice.toFixed(2)}
                  </p>
                  <button onClick={() => onAddToCart(product, b)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">
                    Add Batch
                  </button>
                </div>
                {batchDiscounts.length > 0 && (
                   <DiscountBadge discounts={batchDiscounts} title="මෙම Batch එක සඳහා දීමනා:" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button onClick={() => onAddToCart(product)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
