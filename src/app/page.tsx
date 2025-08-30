// ඔබගේ අනෙක් project එකේ src/app/page.tsx ගොනුවට යෙදිය යුතු සම්පූර්ණ code එක
'use client';

import { useState, useMemo } from 'react';

// --- ඔබගේ අලුත් project එකේදී මෙම import paths නිවැරදිව සකස් කරගන්න ---
import type { Product, SaleItem, ProductBatch, DiscountSet, SpecificDiscountRuleConfig, BuyGetRule } from '@/types';
import { DiscountResult } from '@/discount-engine/core/result';
// නිවැරදි කරන ලද import path සහ function නම
import { calculateDiscountsForItems } from '@/lib/discountUtils'; 
// @ts-ignore
// -----------------------------------------------------------------------

import { megaDealFest, buyMoreSaveMore, clearanceSale } from '@/lib/my-campaigns';


// --- උදාහරණයක් සඳහා Products සහ Batches ---
const oldBatch: ProductBatch = { id: 't-shirt-batch-old', batchNumber: 'OLD-2023', sellingPrice: 2000, costPrice: 1500, quantity: 100, productId: 't-shirt-01' };
const newBatch: ProductBatch = { id: 't-shirt-batch-new', batchNumber: 'NEW-2024', sellingPrice: 2500, costPrice: 1800, quantity: 100, productId: 't-shirt-01' };
const sampleProducts: Product[] = [
  { id: 't-shirt-01', name: 'T-Shirt', sellingPrice: 2500, batches: [oldBatch, newBatch], category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 200, defaultQuantity: 1, isActive: true, isService: false },
  { id: 'jeans-01', name: 'Jeans', sellingPrice: 7000, category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 50, defaultQuantity: 1, isActive: true, isService: false },
];
// ---

const allCampaigns = [megaDealFest, buyMoreSaveMore, clearanceSale];

// Helper function to format a single rule for display
const formatRule = (rule: SpecificDiscountRuleConfig, prefix = ""): string => {
  if (!rule.isEnabled) return "";
  let description = `${prefix}*${rule.name}*: `;
  const valueStr = rule.type === 'percentage' ? `${rule.value}%` : `Rs. ${rule.value.toFixed(2)}`;
  
  if (rule.conditionMin) {
    description += `Get ${valueStr} off when ${rule.applyFixedOnce ? 'total is' : ''} over ${rule.conditionMin}.`;
  } else {
    description += `Get ${valueStr} off.`;
  }
  return description;
};

// Helper function to get all potential discounts for a product/batch
const getAvailableDiscountsInfo = (
  productId: string, 
  batchId: string | undefined, 
  campaign: DiscountSet
): string[] => {
  const discounts: string[] = [];

  // 1. Batch-specific discounts (Highest Priority)
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
  
  // 3. Buy X Get Y rules where this product is the 'buy' item
  if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson
          .filter(rule => rule.buyProductId === productId)
          .forEach(rule => {
              const otherProduct = sampleProducts.find(p => p.id === rule.getProductId);
              if (otherProduct) {
                  discounts.push(`*${rule.name}*: Buy ${rule.buyQuantity} of these to get ${otherProduct.name} at a discount!`);
              }
          });
  }

  return discounts.filter(d => d); // remove empty strings
};


export default function MyNewEcommerceShop() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet>(megaDealFest);

  const updateCartQuantity = (saleItemId: string, change: number) => {
    setCart(currentCart => {
        const itemIndex = currentCart.findIndex(item => item.saleItemId === saleItemId);
        if (itemIndex === -1) return currentCart;

        const updatedCart = [...currentCart];
        const currentItem = updatedCart[itemIndex];
        const newQuantity = currentItem.quantity + change;

        if (newQuantity <= 0) {
            updatedCart.splice(itemIndex, 1);
        } else {
            updatedCart[itemIndex] = { ...currentItem, quantity: newQuantity };
        }
        return updatedCart;
    });
  };

  const addToCart = (product: Product, batch?: ProductBatch) => {
    setCart(currentCart => {
       const existingItem = currentCart.find(item => item.id === product.id && item.selectedBatchId === batch?.id);
       if (existingItem) {
           return currentCart.map(item => 
               item.saleItemId === existingItem.saleItemId ? { ...item, quantity: item.quantity + 1 } : item
           );
       } else {
           const saleItem: SaleItem = {
             ...product,
             saleItemId: `item-${Date.now()}`,
             quantity: 1,
             selectedBatchId: batch?.id,
             selectedBatch: batch,
             price: batch ? batch.sellingPrice : product.sellingPrice,
           };
           return [...currentCart, saleItem];
       }
    });
  };
  
  const discountResult: DiscountResult = useMemo(() => {
    return calculateDiscountsForItems({ saleItems: cart, activeCampaign, allProducts: sampleProducts });
  }, [cart, activeCampaign]);

  const originalTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = originalTotal - (discountResult.totalItemDiscount + discountResult.totalCartDiscount);
  
  return (
   <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Products & Campaign Selector */}
        <div className="lg:col-span-2">
          <header className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">My New Shop</h1>
            <p className="text-base text-gray-500 mt-2">Select a campaign and add products to your cart to see the discount engine in action.</p>
          </header>

          <div className="mb-8">
            <label htmlFor="campaign-selector" className="block text-sm font-medium text-gray-700 mb-2">Active Discount Campaign</label>
            <div className="relative">
              <select id="campaign-selector" value={activeCampaign.id} onChange={(e) => setActiveCampaign(allCampaigns.find((c) => c.id === e.target.value) || megaDealFest)} className="w-full appearance-none rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition">
                {allCampaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">▾</span>
            </div>
          </div>
          
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Products</h3>
            <div className="space-y-4">
              {sampleProducts.map((p) => {
                const productDiscounts = getAvailableDiscountsInfo(p.id, undefined, activeCampaign);
                return (
                  <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{p.name}</h4>
                        <p className="text-sm text-gray-500">{p.category}</p>
                      </div>
                      {!p.batches && (<span className="text-lg font-bold text-gray-800">Rs. {p.sellingPrice.toFixed(2)}</span>)}
                    </div>
                    
                    {/* Display product-level discounts */}
                    {productDiscounts.length > 0 && !p.batches && (
                      <div className="mt-3 space-y-1 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                        <h5 className="font-bold mb-1">Available Offers:</h5>
                        {productDiscounts.map((desc, i) => <p key={i}>{desc}</p>)}
                      </div>
                    )}


                    {p.batches ? (
                      <div className="mt-3 space-y-3">
                        {p.batches.map((b) => {
                          const batchDiscounts = getAvailableDiscountsInfo(p.id, b.id, activeCampaign);
                          return (
                            <div key={b.id} className="flex flex-col gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                               <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm text-gray-700">
                                    <span className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">Batch</span> 
                                    <span className="ml-2 font-semibold text-gray-900">{b.batchNumber}</span> • Rs. {b.sellingPrice.toFixed(2)}
                                  </p>
                                  <button onClick={() => addToCart(p, b)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">Add Batch</button>
                               </div>
                               {/* Display batch & product discounts */}
                               {batchDiscounts.length > 0 && (
                                <div className="space-y-1 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                                   <h5 className="font-bold mb-1">Available Offers for this Batch:</h5>
                                   {batchDiscounts.map((desc, i) => <p key={i}>{desc}</p>)}
                                </div>
                               )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-end gap-3">
                          <button onClick={() => addToCart(p)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">Add to Cart</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Cart & Summary */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-5">Shopping Cart</h2>
              <div className="space-y-4">
                {cart.length === 0 ? <p className="text-center text-gray-500 py-8">Your cart is empty.</p> : cart.map((item) => {
                    const itemDiscountResult = discountResult.getLineItem(item.saleItemId);
                    const lineTotal = item.price * item.quantity;
                    const finalLineTotal = itemDiscountResult ? lineTotal - itemDiscountResult.totalDiscount : lineTotal;

                    return (
                      <div key={item.saleItemId} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow">
                            <p className="font-semibold text-gray-900">{item.name} {item.selectedBatch && <span className="text-sm font-normal text-gray-500">(Batch: {item.selectedBatch.batchNumber})</span>}</p>
                            <p className="text-sm text-gray-600">Rs. {item.price.toFixed(2)} / unit</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQuantity(item.saleItemId, -1)} className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition">-</button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.saleItemId, 1)} className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition">+</button>
                          </div>
                        </div>
                        {itemDiscountResult && itemDiscountResult.appliedRules.length > 0 && (
                          <div className="mt-3 text-xs text-green-800 space-y-1">
                             <div className="border-t border-dashed border-gray-300 pt-2">
                                {itemDiscountResult.appliedRules.map((rule, i) => (<p key={i} className="flex justify-between"><span>Rule: "{rule.appliedRuleInfo.sourceRuleName}"</span><span className="font-semibold">-Rs. {rule.discountAmount.toFixed(2)}</span></p>))}
                             </div>
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>

              <hr className="my-6 border-gray-200" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-600">Original Total:</span><span className={discountResult.getAppliedRulesSummary().length > 0 ? "line-through text-gray-400" : ""}>Rs. {originalTotal.toFixed(2)}</span></div>
                </div>

                {discountResult.getAppliedRulesSummary().length > 0 && (
                  <div className="space-y-3 rounded-xl border border-blue-200 bg-white p-4">
                    <h5 className="text-sm font-semibold text-gray-900">Applied Discounts Breakdown:</h5>
                    <div className="space-y-1">
                      {discountResult.lineItems.flatMap((li) => li.appliedRules.map(rule => ({ ...rule, lineItem: li }))).map((rule, i) => (<div key={`item-disc-${i}`} className="flex justify-between text-sm"><span className="text-gray-600 truncate pr-2">(Item) {rule.appliedRuleInfo.sourceRuleName}</span><span className="font-medium text-green-700">-Rs. {rule.discountAmount.toFixed(2)}</span></div>))}
                      {discountResult.appliedCartRules.map((rule, i) => (<div key={`cart-disc-${i}`} className="flex justify-between text-sm"><span className="text-gray-600">(Cart) {rule.appliedRuleInfo.sourceRuleName}</span><span className="font-medium text-green-700">-Rs. {rule.discountAmount.toFixed(2)}</span></div>))}
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-sm"><span className="text-gray-900">Total All Discounts:</span><span className="text-green-700">-Rs. {(discountResult.totalItemDiscount + discountResult.totalCartDiscount).toFixed(2)}</span></div>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t-2 border-gray-300 flex justify-between items-baseline"><span className="text-lg font-semibold text-gray-900">Final Total</span><span className="text-3xl font-bold text-blue-700">Rs. {finalTotal.toFixed(2)}</span></div>
              </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
