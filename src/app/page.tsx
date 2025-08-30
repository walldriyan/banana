// ඔබගේ අනෙක් project එකේ src/app/page.tsx ගොනුවට යෙදිය යුතු සම්පූර්ණ code එක
'use client';

import { useState, useMemo } from 'react';

// --- ඔබගේ අලුත් project එකේදී මෙම import paths නිවැරදිව සකස් කරගන්න ---
import type { Product, SaleItem, ProductBatch, DiscountSet } from '@/types';
import { DiscountResult } from '@/discount-engine/core/result';
// නිවැරදි කරන ලද import path සහ function නම
import { calculateDiscountsForItems } from '@/lib/discountUtils'; 
// @ts-ignore
// -----------------------------------------------------------------------


// --- උදාහරණයක් සඳහා Products සහ Batches ---
const oldBatch: ProductBatch = { id: 't-shirt-batch-old', batchNumber: 'OLD-2023', sellingPrice: 2000, costPrice: 1500, quantity: 100, productId: 't-shirt-01' };
const newBatch: ProductBatch = { id: 't-shirt-batch-new', batchNumber: 'NEW-2024', sellingPrice: 2500, costPrice: 1800, quantity: 100, productId: 't-shirt-01' };
const sampleProducts: Product[] = [
  { id: 't-shirt-01', name: 'T-Shirt', sellingPrice: 2500, batches: [oldBatch, newBatch], category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 200, defaultQuantity: 1, isActive: true, isService: false },
  { id: 'jeans-01', name: 'Jeans', sellingPrice: 7000, category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 50, defaultQuantity: 1, isActive: true, isService: false },
];
// ---

// --- Campaigns are now defined directly in the file ---
const summerSale: DiscountSet = {
  id: 'promo-summer',
  name: 'Summer Sale',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: false,
  productConfigurations: [
    {
      productId: 't-shirt-01',
      lineItemValueRuleJson: {
        isEnabled: true, name: '10% OFF T-Shirts', type: 'percentage', value: 10,
      },
      id: 'summersale-tshirt-config',
      discountSetId: 'promo-summer',
      productNameAtConfiguration: 'T-Shirt',
      isActiveForProductInCampaign: true,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  globalCartPriceRuleJson: {
    isEnabled: true, name: 'Bonus 500 OFF', type: 'fixed', value: 500, conditionMin: 10000
  },
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};

const vintageSale: DiscountSet = {
  id: 'promo-vintage',
  name: 'Vintage Stock Clearance',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,
  batchConfigurations: [
    {
      productBatchId: 't-shirt-batch-old',
      lineItemValueRuleJson: {
        isEnabled: true, name: '50% OFF Old Batch', type: 'percentage', value: 50
      },
      id: 'vintage-old-batch-config',
      discountSetId: 'promo-vintage',
      isActiveForBatchInCampaign: true,
      lineItemQuantityRuleJson: null,
    }
  ],
  productConfigurations: [
     {
      productId: 't-shirt-01',
      lineItemValueRuleJson: {
        isEnabled: true, name: '10% OFF T-Shirts', type: 'percentage', value: 10
      },
      id: 'vintage-tshirt-config',
      discountSetId: 'promo-vintage',
      productNameAtConfiguration: 'T-Shirt',
      isActiveForProductInCampaign: true,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
     }
  ],
    globalCartPriceRuleJson: null,
    globalCartQuantityRuleJson: null,
    defaultLineItemValueRuleJson: null,
    defaultLineItemQuantityRuleJson: null,
    defaultSpecificQtyThresholdRuleJson: null,
    defaultSpecificUnitPriceThresholdRuleJson: null,
};


const allCampaigns = [summerSale, vintageSale];

export default function MyNewEcommerceShop() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet>(summerSale);

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

  const removeFromCart = (saleItemId: string) => {
    setCart(currentCart => currentCart.filter(item => item.saleItemId !== saleItemId));
  };
  
  const discountResult: DiscountResult = useMemo(() => {
    return calculateDiscountsForItems({ saleItems: cart, activeCampaign, allProducts: sampleProducts });
  }, [cart, activeCampaign]);

  const originalTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = originalTotal - (discountResult.totalItemDiscount + discountResult.totalCartDiscount);
  
  const isDiscountAvailableForProduct = (productId: string, batchId?: string) => {
    if (batchId && activeCampaign.batchConfigurations?.some(bc => bc.productBatchId === batchId && bc.lineItemValueRuleJson?.isEnabled)) {
        return true;
    }
    if (activeCampaign.productConfigurations?.some(pc => pc.productId === productId && pc.lineItemValueRuleJson?.isEnabled)) {
        return true;
    }
    return false;
  };

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
              <select id="campaign-selector" value={activeCampaign.id} onChange={(e) => setActiveCampaign(allCampaigns.find((c) => c.id === e.target.value) || summerSale)} className="w-full appearance-none rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition">
                {allCampaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">▾</span>
            </div>
          </div>
          
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Products</h3>
            <div className="space-y-4">
              {sampleProducts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{p.name}</h4>
                      <p className="text-sm text-gray-500">{p.category}</p>
                    </div>
                    {!p.batches && (<span className="text-lg font-bold text-gray-800">Rs. {p.sellingPrice.toFixed(2)}</span>)}
                  </div>

                  {p.batches ? (
                    <div className="mt-3 space-y-3">
                      {p.batches.map((b) => (
                        <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                          <p className="text-sm text-gray-700">
                            <span className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">Batch</span> 
                            <span className="ml-2 font-semibold text-gray-900">{b.batchNumber}</span> • Rs. {b.sellingPrice.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-3">
                            {isDiscountAvailableForProduct(p.id, b.id) && (<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Discount Available</span>)}
                            <button onClick={() => addToCart(p, b)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">Add Batch</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center justify-end gap-3">
                        {isDiscountAvailableForProduct(p.id) && (<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Discount Available</span>)}
                        <button onClick={() => addToCart(p)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition">Add to Cart</button>
                    </div>
                  )}
                </div>
              ))}
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
