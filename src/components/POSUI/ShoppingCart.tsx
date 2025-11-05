// src/components/POSUI/ShoppingCart.tsx
import React from 'react';
import type { SaleItem } from '@/types';
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

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold text-foreground mb-5">Shopping Cart</h2>
      
      <div className="w-full">
        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Your cart is empty.</p>
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
    </div>
  );
};

export default ShoppingCart;

    