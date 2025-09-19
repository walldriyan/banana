// src/app/(pos)/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product, SaleItem, DiscountSet, ProductBatch } from '@/types';
import { allCampaigns } from '@/lib/my-campaigns';
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
import { History, LayoutDashboard } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { AuthorizationGuard } from '@/components/auth/AuthorizationGuard';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { defaultDiscounts } from '@/lib/default-campaign';
import { CustomDiscountForm } from '@/components/POSUI/CustomDiscountForm';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductBatchesAction } from '@/lib/actions/product.actions';


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
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet>(defaultDiscounts);
  const [transactionId, setTransactionId] = useState<string>('');
  const productSearchRef = useRef<SearchableProductInputRef>(null);
  const drawer = useDrawer();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [isCalculating, setIsCalculating] = useState(false);
  const [discountResult, setDiscountResult] = useState<any>(initialDiscountResult);

  const user = useSessionStore(state => state.user);


  const createNewTransactionId = () => `txn-${Date.now()}`;

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      const result = await getProductBatchesAction();
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error fetching products',
          description: result.error,
        });
      }
      setIsLoading(false);
    }
    fetchProducts();
  }, [toast]);


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


  const handleCartUpdate = (saleItemId: string, newDisplayQuantity: number, newDisplayUnit?: string) => {
    const itemIndex = cart.findIndex(item => item.saleItemId === saleItemId);
    if (itemIndex === -1) return;

    const currentItem = cart[itemIndex];
    
    // If the quantity is zero or less, remove the item from the cart.
    if (newDisplayQuantity <= 0) {
      setCart(currentCart => currentCart.filter(item => item.saleItemId !== saleItemId));
      return;
    }

    const unitToUse = newDisplayUnit || currentItem.displayUnit;
    const allUnits = [{ name: currentItem.product.units.baseUnit, conversionFactor: 1 }, ...(currentItem.product.units.derivedUnits || [])];
    const selectedUnitDefinition = allUnits.find(u => u.name === unitToUse);
    const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;

    // Calculate the new total quantity in the base unit.
    const newBaseQuantity = newDisplayQuantity * conversionFactor;

    // STOCK VALIDATION
    if (newBaseQuantity > currentItem.stock) {
      toast({
        variant: "destructive",
        title: "Stock Limit Exceeded",
        description: `Cannot set quantity to ${newDisplayQuantity} ${unitToUse}. Only ${currentItem.stock / conversionFactor} ${unitToUse} available.`,
      });
      // Do not update state if stock limit is exceeded.
      return;
    }

    // Update the state with the new values.
    setCart(currentCart => {
      const updatedCart = [...currentCart];
      updatedCart[itemIndex] = {
        ...currentItem,
        displayUnit: unitToUse,
        displayQuantity: newDisplayQuantity,
        quantity: newBaseQuantity, // This is the total base unit quantity
      };
      return updatedCart;
    });
  };


  const addToCart = (productBatch: ProductBatch) => {
    const existingItemIndex = cart.findIndex(item => item.id === productBatch.id);

    if (existingItemIndex !== -1) {
        // Item exists, just increase its quantity
        setCart(currentCart => {
            const updatedCart = [...currentCart];
            const existingItem = updatedCart[existingItemIndex];
            
            // Increment the display quantity by 1
            const newDisplayQuantity = existingItem.displayQuantity + 1;

            // Find the conversion factor for the current display unit
            const allUnits = [{ name: existingItem.product.units.baseUnit, conversionFactor: 1 }, ...(existingItem.product.units.derivedUnits || [])];
            const selectedUnitDefinition = allUnits.find(u => u.name === existingItem.displayUnit);
            const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;
            
            // Calculate the new total base quantity
            const newBaseQuantity = newDisplayQuantity * conversionFactor;

            if (newBaseQuantity > existingItem.stock) {
                toast({
                    variant: "destructive",
                    title: "Stock Limit Exceeded",
                    description: `Cannot add more ${existingItem.product.name}. Maximum stock reached.`,
                });
                return currentCart; // Return original cart without changes
            }

            // Update the item in the cart
            updatedCart[existingItemIndex] = {
                ...existingItem,
                quantity: newBaseQuantity,
                displayQuantity: newDisplayQuantity,
                // Ensure displayUnit is carried over
                displayUnit: existingItem.displayUnit, 
            };

            return updatedCart;
        });
    } else {
        // Item is not in the cart, add it
        if (1 > productBatch.stock) {
            toast({
                variant: "destructive",
                title: "Out of Stock",
                description: `Cannot add ${productBatch.product.name}, it is out of stock.`,
            });
            return;
        }
        
        const newSaleItem: SaleItem = {
            ...productBatch,
            saleItemId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quantity: 1, // Base unit quantity
            displayQuantity: 1, // Display quantity
            displayUnit: productBatch.product.units.baseUnit, // Set the default display unit
            price: productBatch.sellingPrice,
        };
        
        setCart(currentCart => [...currentCart, newSaleItem]);
    }
};

  const clearCart = () => {
    setCart([]);
    setTransactionId(createNewTransactionId());
  };

  const handleApplyCustomDiscount = (
    saleItemId: string,
    type: 'fixed' | 'percentage',
    value: number,
    applyOnce: boolean
  ) => {
    setCart(currentCart => currentCart.map(item => {
      if (item.saleItemId === saleItemId) {
        return {
          ...item,
          customDiscountType: type,
          customDiscountValue: value,
          customApplyFixedOnce: applyOnce,
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
      title: `Override Discount for ${item.product.name}`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-10 w-64 mb-3" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-72 mt-4" />
            </div>

            {/* Campaign and Search Skeletons */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-8 h-fit">
            {/* Shopping Cart Skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <hr className="my-2 border-gray-200" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <header className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">My New Shop</h1>
                <p className="text-base text-muted-foreground mt-2">
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
                 <AuthorizationGuard permissionKey='products.view'>
                  <Link href="/dashboard/products" passHref>
                    <Button variant="outline">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
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
                products={products}
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
                  {isCalculating ? (
                    <Skeleton className="h-10 w-48" />
                  ) : (
                    <button
                      onClick={openTransactionDrawer}
                      disabled={cart.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Complete Transaction
                    </button>
                  )}
                </div>
              </AuthorizationGuard>
            </div>
          </AuthorizationGuard>
        </div>

        <aside className="lg:sticky lg:top-8 h-fit">
          <ShoppingCart
            cart={cart}
            isCalculating={isCalculating}
            discountResult={discountResult}
            onUpdateQuantity={handleCartUpdate}
            onOverrideDiscount={openCustomDiscountDrawer}
          />

          <DiscountBehaviorPanel
            isCalculating={isCalculating}
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
