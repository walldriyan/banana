// src/app/page.tsx
'use client';

import { useState, useMemo } from 'react';
import type { Product, SaleItem, DiscountSet, ProductBatch } from '@/types';
import { DiscountResult } from '@/discount-engine/core/result';
import { calculateDiscountsForItems } from '@/lib/discountUtils';
import { megaDealFest, buyMoreSaveMore, clearanceSale } from '@/lib/my-campaigns';
import CampaignSelector from '@/components/POSUI/CampaignSelector';
import ShoppingCart from '@/components/POSUI/ShoppingCart';
import SearchableProductInput from '@/components/POSUI/SearchableProductInput';

// --- Sample Data ---
const oldBatch: ProductBatch = { id: 't-shirt-batch-old', batchNumber: 'OLD-2023', sellingPrice: 2000, costPrice: 1500, quantity: 100, productId: 't-shirt-01' };
const newBatch: ProductBatch = { id: 't-shirt-batch-new', batchNumber: 'NEW-2024', sellingPrice: 2500, costPrice: 1800, quantity: 100, productId: 't-shirt-01' };
const sampleProducts: Product[] = [
  { id: 't-shirt-01', name: 'T-Shirt', sellingPrice: 2500, batches: [oldBatch, newBatch], category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 200, defaultQuantity: 1, isActive: true, isService: false },
  { id: 'jeans-01', name: 'Jeans', sellingPrice: 7000, category: 'Apparel', units: {baseUnit: 'pcs'}, stock: 50, defaultQuantity: 1, isActive: true, isService: false },
];
const allCampaigns = [megaDealFest, buyMoreSaveMore, clearanceSale];
// ---

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Products & Campaign Selector */}
        <div className="lg:col-span-2">
          <header className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">My New Shop</h1>
            <p className="text-base text-gray-500 mt-2">Search for products by name or barcode and add them to your cart.</p>
          </header>

          <div className="space-y-6">
            <CampaignSelector
              activeCampaign={activeCampaign}
              allCampaigns={allCampaigns}
              onCampaignChange={setActiveCampaign}
            />

            <SearchableProductInput 
              products={sampleProducts}
              onProductSelect={addToCart}
            />
          </div>

        </div>

        {/* Right Column: Cart & Summary */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <ShoppingCart
            cart={cart}
            discountResult={discountResult}
            onUpdateQuantity={updateCartQuantity}
          />
        </aside>
      </div>
    </div>
  );
}
