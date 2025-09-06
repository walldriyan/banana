// src/app/(pos)/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Product, SaleItem, DiscountSet, ProductBatch } from '@/types';
// import { DiscountResult } from '@/discount-engine/core/result';
import { allCampaigns, megaDealFest } from '@/lib/my-campaigns';
import CampaignSelector from '@/components/POSUI/CampaignSelector';
import ShoppingCart from '@/components/POSUI/ShoppingCart';
import SearchableProductInput from '@/components/POSUI/SearchableProductInput';
import DiscountBehaviorPanel from '@/components/DiscountBehaviorPanel';
import type { SearchableProductInputRef } from '@/components/POSUI/SearchableProductInput';
import { TransactionDialogContent } from '@/components/transaction/TransactionDialogContent';
import { useDrawer } from '@/hooks/use-drawer';
import { calculateDiscountsAction } from '@/lib/actions/transaction.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { AuthorizationGuard } from '@/components/auth/AuthorizationGuard';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { defaultDiscounts } from '@/lib/default-campaign';
import { CustomDiscountForm } from '@/components/POSUI/CustomDiscountForm';


const oldBatch: ProductBatch = {
  id: 't-shirt-batch-old',
  batchNumber: 'OLD-2023',
  sellingPrice: 2000,
  costPrice: 1500,
  quantity: 100,
  productId: 't-shirt-01'
};

const newBatch: ProductBatch = {
  id: 't-shirt-batch-new',
  batchNumber: 'NEW-2024',
  sellingPrice: 2500,
  costPrice: 1800,
  quantity: 100,
  productId: 't-shirt-01'
};

const jeansOldBatch: ProductBatch = {
  id: 'jeans-batch-old',
  batchNumber: 'JEANS-OLD-2023',
  sellingPrice: 7000,
  costPrice: 4000,
  quantity: 50,
  productId: 'jeans-01'
};

const jeansNewBatch: ProductBatch = {
  id: 'jeans-batch-new',
  batchNumber: 'JEANS-NEW-2024',
  sellingPrice: 8000,
  costPrice: 5000,
  quantity: 30,
  productId: 'jeans-01'
};

const sampleProducts: Product[] = [
  {
    id: 't-shirt-01',
    name: 'T-Shirt',
    sellingPrice: 2500,
    batches: [oldBatch, newBatch],
    category: 'Apparel',
    units: { baseUnit: 'pcs' },
    stock: 200,
    defaultQuantity: 1,
    isActive: true,
    isService: false
  },
  {
    id: 'jeans-01',
    name: 'Jeans',
    sellingPrice: 8000,
    batches: [jeansOldBatch, jeansNewBatch],
    category: 'Apparel',
    units: { baseUnit: 'pcs' },
    stock: 80,
    defaultQuantity: 1,
    isActive: true,
    isService: false
  },
];


// A plain object to represent the initial state of the discount result
// We add dummy methods to prevent initial render errors.
const initialDiscountResult = {
  lineItems: [],
  totalItemDiscount: 0,
  totalCartDiscount: 0,
  appliedCartRules: [],
  originalSubtotal: 0,
  totalDiscount: 0,
  finalTotal: 0,
  getLineItem: (saleItemId: string) => undefined,
  getAppliedRulesSummary: () => [],
};


export default function MyNewEcommerceShop() {

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet>(defaultDiscounts);
  const [transactionId, setTransactionId] = useState<string>('');
  const productSearchRef = useRef<SearchableProductInputRef>(null);
  const drawer = useDrawer();
  const { toast } = useToast();

  const [isCalculating, setIsCalculating] = useState(false);
  const [discountResult, setDiscountResult] = useState<any>(initialDiscountResult);

  const user = useSessionStore(state => state.user);


  const createNewTransactionId = () => `txn-${Date.now()}`;

  useEffect(() => {
    setTransactionId(createNewTransactionId());
  }, []);

  // Recalculate discounts when cart or campaign changes
  useEffect(() => {
    const recalculate = async () => {
      if (cart.length === 0) {
        setDiscountResult(initialDiscountResult);
        return;
      }
      setIsCalculating(true);
      const result = await calculateDiscountsAction(cart, activeCampaign);
      if (result.success && result.data) {
        // We receive a plain object from the server action, not a class instance.
        // We need to re-attach any methods our components rely on.
        setDiscountResult({
          ...result.data,
          // Recreate the getLineItem method on the client
          getLineItem: (saleItemId: string) => result.data.lineItems.find((li: any) => li.saleItemId === saleItemId),
          // Recreate the getAppliedRulesSummary method on the client
          getAppliedRulesSummary: () => result.data.appliedRulesSummary || []
        });
      } else {
        toast({
          variant: "destructive",
          title: "Discount Error",
          description: result.error,
        });
        setDiscountResult(initialDiscountResult);
      }
      setIsCalculating(false);
    };

    recalculate();
  }, [cart, activeCampaign, toast]);


  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isInteracting =
        target.closest('[role="dialog"], [role="menu"], [data-radix-popper-content-wrapper]') !== null;

      if (isTyping || isInteracting) {
        return;
      }

      const isPrintableKey = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

      if (isPrintableKey) {
        if (productSearchRef.current) {
          productSearchRef.current.focusSearchInput();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

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
      const existingItem = currentCart.find(item =>
        item.id === product.id && item.selectedBatchId === batch?.id
      );

      if (existingItem) {
        return currentCart.map(item =>
          item.saleItemId === existingItem.saleItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const saleItem: SaleItem = {
          ...product,
          saleItemId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: 1,
          selectedBatchId: batch?.id,
          selectedBatch: batch,
          price: batch ? batch.sellingPrice : product.sellingPrice,
        };
        return [...currentCart, saleItem];
      }
    });
  };

  const clearCart = () => {
    setCart([]);
    setTransactionId(createNewTransactionId());
  };

  const handleApplyCustomDiscount = (saleItemId: string, type: 'fixed' | 'percentage', value: number) => {
    setCart(currentCart => currentCart.map(item => {
        if (item.saleItemId === saleItemId) {
            return {
                ...item,
                customDiscountType: type,
                customDiscountValue: value,
            };
        }
        return item;
    }));
    drawer.closeDrawer();
    toast({
        title: "Custom Discount Applied!",
        description: `A custom ${type} discount of ${value} was applied to the item.`,
    });
  };

  const openCustomDiscountDrawer = (item: SaleItem) => {
    drawer.openDrawer({
        title: `Override Discount for ${item.name}`,
        description: "Apply a special, one-time discount for this line item.",
        content: (
            <CustomDiscountForm
                item={item}
                onApplyDiscount={handleApplyCustomDiscount}
            />
        ),
        drawerClassName: "sm:max-w-md"
    });
  };


  const handleTransactionComplete = () => {
    drawer.closeDrawer();
    clearCart();
    toast({
        title: "Transaction Complete!",
        description: "The cart has been cleared and a new transaction is ready.",
    });
  };

  const openTransactionDrawer = () => {
    drawer.openDrawer({
      title: 'Complete Transaction',
      content: (
        <TransactionDialogContent
          cart={cart}
          discountResult={discountResult}
          transactionId={transactionId}
          activeCampaign={activeCampaign}
          onTransactionComplete={handleTransactionComplete}
        />
      ),
      closeOnOverlayClick: false,
      drawerClassName: "sm:max-w-4xl" 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2">
          <header className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900">My New Shop</h1>
                 <p className="text-base text-gray-500 mt-2">
                    Welcome, {user?.name || 'User'}! ({user?.role})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AuthorizationGuard permissionKey='history.view'>
                    <Link href="/history" passHref>
                        <Button variant="outline">
                        <History className="mr-2 h-4 w-4" />
                        View History
                        </Button>
                    </Link>
                </AuthorizationGuard>
                <LogoutButton />
              </div>

            </div>
            <div className="text-sm text-gray-400 mt-4">
              Transaction ID: {transactionId}
              {activeCampaign.isOneTimePerTransaction && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                  One-Time Campaign
                </span>
              )}
            </div>
             {isCalculating && <div className="text-sm text-blue-500 mt-2 animate-pulse">Calculating discounts...</div>}
          </header>

          <AuthorizationGuard permissionKey='pos.view' fallback={<p>You do not have permission to view the POS.</p>}>
            <div className="space-y-6">
                <CampaignSelector
                activeCampaign={activeCampaign}
                allCampaigns={allCampaigns}
                onCampaignChange={setActiveCampaign}
                />

                <SearchableProductInput
                ref={productSearchRef}
                products={sampleProducts}
                onProductSelect={addToCart}
                />
                
                <AuthorizationGuard permissionKey='pos.create.transaction'>
                    <div className="flex gap-3">
                        <button
                            onClick={clearCart}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Clear Cart
                        </button>
                        <button
                            onClick={openTransactionDrawer}
                            disabled={cart.length === 0 || isCalculating}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Complete Transaction
                        </button>
                    </div>
                </AuthorizationGuard>
            </div>
          </AuthorizationGuard>
        </div>

        <aside className="lg:sticky lg:top-8 h-fit">
          <ShoppingCart
            cart={cart}
            discountResult={discountResult}
            onUpdateQuantity={updateCartQuantity}
            onOverrideDiscount={openCustomDiscountDrawer}
          />

          <DiscountBehaviorPanel
            discountResult={discountResult}
            activeCampaign={activeCampaign}
            transactionId={transactionId}
          />

          {process.env.NODE_ENV === 'development' && discountResult.finalTotal > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
              <h4 className="font-semibold text-blue-800 mb-2">Debug Info:</h4>
              <div className="space-y-1 text-blue-700">
                <div>Original Subtotal: Rs.{discountResult.originalSubtotal.toFixed(2)}</div>
                <div>Item Discounts: Rs.{discountResult.totalItemDiscount.toFixed(2)}</div>
                <div>Cart Discounts: Rs.{discountResult.totalCartDiscount.toFixed(2)}</div>
                <div>Final Total: Rs.{discountResult.finalTotal.toFixed(2)}</div>
                <div>Applied Rules: {discountResult.getAppliedRulesSummary().length}</div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
