// src/components/POSUI/ShoppingCart.tsx
import React from 'react';
import type { SaleItem } from '@/types';
// import { DiscountResult } from '@/discount-engine/core/result';
import CartItemCard from './CartItemCard';
import OrderSummary from './OrderSummary';

interface ShoppingCartProps {
  cart: SaleItem[];
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  onUpdateQuantity: (saleItemId: string, change: number) => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ cart, discountResult, onUpdateQuantity }) => {
  const originalTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = discountResult?.finalTotal || originalTotal;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-900 mb-5">Shopping Cart</h2>
      <div className="space-y-4">
        {cart.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
        ) : (
          cart.map((item) => {
            // Safely call getLineItem if it exists and it's a function
            const lineItemDiscount = (discountResult && typeof discountResult.getLineItem === 'function')
              ? discountResult.getLineItem(item.saleItemId)
              : undefined;

            return (
              <CartItemCard
                key={item.saleItemId}
                item={item}
                discountResult={lineItemDiscount} // Pass the specific line item's discount result
                onUpdateQuantity={onUpdateQuantity}
              />
            );
          })
        )}
      </div>

      <hr className="my-6 border-gray-200" />
      
      <OrderSummary
        originalTotal={originalTotal}
        finalTotal={finalTotal}
        discountResult={discountResult}
      />
    </div>
  );
};

export default ShoppingCart;
