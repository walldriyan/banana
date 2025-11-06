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
    <div className="w-full flex flex-col h-full">
      <h2 className="text-2xl font-semibold text-foreground mb-5">Shopping Cart</h2>
      
      <div className="rounded-lg border overflow-hidden flex-grow flex flex-col">
        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground m-auto">Your cart is empty.</p>
        ) : (
          <div className="w-full flex flex-col h-full">
            <div className="flex-shrink-0">
                <Table>
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                    <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="w-[40%]">Product</TableHead>
                    <TableHead className="w-[25%]">Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discounts</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                </Table>
            </div>
            <div className="flex-grow overflow-y-auto max-h-[500px]">
              <Table>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
