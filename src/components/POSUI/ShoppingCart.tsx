// src/components/POSUI/ShoppingCart.tsx
import React from 'react';
import type { SaleItem } from '@/types';
import OrderSummary from './OrderSummary';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CartTableRow } from './CartTableRow';


interface ShoppingCartProps {
  cart: SaleItem[];
  isCalculating: boolean;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  onUpdateQuantity: (saleItemId: string, newDisplayQuantity: number, newDisplayUnit?: string) => void;
  onOverrideDiscount: (item: SaleItem) => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ cart, isCalculating, discountResult, onUpdateQuantity, onOverrideDiscount }) => {
  const originalTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = discountResult?.finalTotal || originalTotal;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-900 mb-5">Shopping Cart</h2>
      
      <div className="w-full">
        {cart.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Product</TableHead>
                <TableHead className="w-[25%]">Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <CartTableRow
                  key={item.saleItemId}
                  item={item}
                  isCalculating={isCalculating}
                  discountResult={discountResult}
                  onUpdateQuantity={onUpdateQuantity}
                  onOverrideDiscount={onOverrideDiscount}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>


      <hr className="my-6 border-gray-200" />
      
      {isCalculating && cart.length > 0 ? (
          <div className="space-y-4">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full mt-4" />
          </div>
      ) : (
          <OrderSummary
            originalTotal={originalTotal}
            finalTotal={finalTotal}
            discountResult={discountResult}
          />
      )}
    </div>
  );
};

export default ShoppingCart;
