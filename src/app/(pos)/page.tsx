// src/app/(pos)/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Product, SaleItem, DiscountSet, ProductBatch } from '@/types';
import { allCampaigns as hardcodedCampaigns } from '@/lib/my-campaigns';
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
import { History, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { AuthorizationGuard } from '@/components/auth/AuthorizationGuard';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { defaultDiscounts } from '@/lib/default-campaign';
import { CustomDiscountForm } from '@/components/POSUI/CustomDiscountForm';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductBatchesAction } from '@/lib/actions/product.actions';
import { getDiscountSetsAction } from '@/lib/actions/discount.actions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import OrderSummary from '@/components/POSUI/OrderSummary';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';


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
  const [allCampaigns, setAllCampaigns] = useState<DiscountSet[]>(hardcodedCampaigns);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet>(defaultDiscounts);
  const [transactionId, setTransactionId] = useState<string>('');
  const productSearchRef = useRef<SearchableProductInputRef>(null);
  const drawer = useDrawer();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [isCalculating, setIsCalculating] = useState(false);
  const [discountResult, setDiscountResult] = useState<any>(initialDiscountResult);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const user = useSessionStore(state => state.user);


  const createNewTransactionId = () => `txn-${Date.now()}`;

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const [productsResult, campaignsResult] = await Promise.all([
        getProductBatchesAction(),
        getDiscountSetsAction()
      ]);

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error fetching products',
          description: productsResult.error,
        });
      }

      if (campaignsResult.success && campaignsResult.data) {
        // Combine hardcoded campaigns with database campaigns
        setAllCampaigns([...hardcodedCampaigns, ...campaignsResult.data]);
      } else {
        // Fallback to hardcoded if DB fetch fails
        setAllCampaigns(hardcodedCampaigns);
      }


      setIsLoading(false);
    }
    fetchData();
  }, [toast]);


  useEffect(() => {
    setTransactionId(createNewTransactionId());
  }, []);

  // Recalculate discounts when cart or campaign changes
  useEffect(() => {
    const recalculate = async () => {
      
      const cartWithUnits = cart.map(item => {
        if (!item.displayUnit) {
          const unitsData = typeof item.product.units === 'string' 
            ? JSON.parse(item.product.units) 
            : item.product.units;
          return { ...item, displayUnit: unitsData.baseUnit };
        }
        return item;
      });

      if (cartWithUnits.length === 0) {
        setDiscountResult(initialDiscountResult);
        return;
      }
      setIsCalculating(true);
      const result = await calculateDiscountsAction(cartWithUnits, activeCampaign);
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
        // toast({
        //   variant: "destructive",
        //   title: "Discount Error",
        //   description: result.error,
        // });
        setDiscountResult(initialDiscountResult);
      }
      setIsCalculating(false);
    };

    recalculate();
  }, [cart, activeCampaign]);


  const handleTransactionComplete = useCallback(() => {
    drawer.closeDrawer();
    clearCart();
    toast({
      title: "Transaction Complete!",
      description: "The cart has been cleared and a new transaction is ready.",
    });
  }, [drawer, toast]); // clearCart is stable


  const openTransactionDrawer = useCallback(() => {
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
  }, [drawer, cart, discountResult, transactionId, activeCampaign, handleTransactionComplete]);


  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;

        const isTyping =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;
        
        const isDrawerOpen = !!document.querySelector('[data-state="open"]');

        // Handle Ctrl+Enter for completing transaction *only if drawer is closed*
        if (event.ctrlKey && event.key === 'Enter' && !isDrawerOpen) {
            event.preventDefault();
            if (cart.length > 0) {
                openTransactionDrawer();
            }
            return;
        }

        // The back-navigation for the drawer is handled inside the drawer component itself.
        
        // Existing logic to focus search input
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
  }, [cart.length, openTransactionDrawer, drawer]);


  const availableProducts = useMemo(() => {
    const cartQuantities: { [batchId: string]: number } = {};
    for (const item of cart) {
        cartQuantities[item.id] = (cartQuantities[item.id] || 0) + item.quantity;
    }

    return products.map(p => {
        const quantityInCart = cartQuantities[p.id] || 0;
        return {
            ...p,
            stock: p.stock - quantityInCart
        };
    });
}, [products, cart]);


  const handleCartUpdate = (saleItemId: string, newDisplayQuantity: number, newDisplayUnit?: string) => {
    setCart(currentCart => {
        const itemIndex = currentCart.findIndex(item => item.saleItemId === saleItemId);
        if (itemIndex === -1) return currentCart;

        const currentItem = currentCart[itemIndex];

        if (newDisplayQuantity <= 0) {
            return currentCart.filter(item => item.saleItemId !== saleItemId);
        }

        const unitsData = typeof currentItem.product.units === 'string' 
          ? JSON.parse(currentItem.product.units) 
          : currentItem.product.units;
          
        const allUnits = [{ name: unitsData.baseUnit, conversionFactor: 1 }, ...(unitsData.derivedUnits || [])];
        
        // Determine the unit to use. If a new one is provided, use it, otherwise stick with the current one.
        const unitToUse = newDisplayUnit || currentItem.displayUnit;
        const selectedUnitDefinition = allUnits.find(u => u.name === unitToUse);
        const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;

        const newBaseQuantity = newDisplayQuantity * conversionFactor;
        
        // Check against the original stock of the product, not the calculated available stock
        const originalProduct = products.find(p => p.id === currentItem.id);
        const originalStock = originalProduct?.stock || 0;

        if (newBaseQuantity > originalStock) {
            return currentCart; // Return original cart without changes
        }

        const updatedCart = [...currentCart];
        updatedCart[itemIndex] = {
            ...currentItem,
            quantity: newBaseQuantity,
            displayQuantity: newDisplayQuantity,
            displayUnit: unitToUse, // Explicitly set the correct unit
        };
        return updatedCart;
    });
  };


 const addToCart = (productBatch: ProductBatch) => {
    const availableStock = availableProducts.find(p => p.id === productBatch.id)?.stock ?? 0;
    
    const existingItemIndex = cart.findIndex(item => item.id === productBatch.id);

    if (existingItemIndex !== -1) {
        setCart(currentCart => currentCart.map((item, index) => {
            if (index === existingItemIndex) {
                const newDisplayQuantity = item.displayQuantity + 1;
                
                const unitsData = typeof item.product.units === 'string' 
                    ? JSON.parse(item.product.units) 
                    : item.product.units;

                const allUnits = [{ name: unitsData.baseUnit, conversionFactor: 1 }, ...(unitsData.derivedUnits || [])];
                const selectedUnitDefinition = allUnits.find(u => u.name === item.displayUnit);
                const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;

                const newBaseQuantity = newDisplayQuantity * conversionFactor;

                const originalProduct = products.find(p => p.id === item.id);
                const originalStock = originalProduct?.stock || 0;

                if (newBaseQuantity > originalStock) {
                    return item;
                }
                
                return {
                    ...item,
                    quantity: newBaseQuantity,
                    displayQuantity: newDisplayQuantity,
                };
            }
            return item;
        }));
    } else {
        if (1 > availableStock) {
            return;
        }
        
        const unitsData = typeof productBatch.product.units === 'string' 
          ? JSON.parse(productBatch.product.units) 
          : productBatch.product.units;

        const newSaleItem: SaleItem = {
            ...productBatch,
            saleItemId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quantity: 1, 
            displayQuantity: 1, 
            displayUnit: unitsData.baseUnit,
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

  
  const originalTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = discountResult?.finalTotal || originalTotal;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </header>
        <Card>
            <CardContent className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 lg:p-8 border-b">
         <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight">My New Shop</h1>
            <p className="text-base text-muted-foreground mt-2">
                Welcome, {user?.name || 'User'}! ({user?.role})
            </p>
         </div>
        <div className="flex-grow max-w-sm">
           <AuthorizationGuard permissionKey='pos.view' fallback={<p>You do not have permission to view the POS.</p>}>
              <CampaignSelector
                activeCampaign={activeCampaign}
                allCampaigns={allCampaigns}
                onCampaignChange={setActiveCampaign}
              />
          </AuthorizationGuard>
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
            <ThemeToggle />
            <LogoutButton />
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="w-full">
            <CardContent className="p-4 sm:p-6 space-y-6">
                 <SearchableProductInput
                    ref={productSearchRef}
                    products={availableProducts}
                    onProductSelect={addToCart}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ShoppingCart
                            cart={cart}
                            isCalculating={isCalculating}
                            discountResult={discountResult}
                            onUpdateQuantity={handleCartUpdate}
                            onOverrideDiscount={openCustomDiscountDrawer}
                            />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
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

                        <AuthorizationGuard permissionKey='pos.create.transaction'>
                          <div className="flex flex-col gap-3">
                            {isCalculating ? (
                              <Skeleton className="h-12 w-full" />
                            ) : (
                              <button
                                onClick={openTransactionDrawer}
                                disabled={cart.length === 0}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                              >
                                Complete Transaction
                              </button>
                            )}
                            <button
                              onClick={clearCart}
                              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                              Clear Cart
                            </button>
                          </div>
                        </AuthorizationGuard>
                    </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg mt-6">
                    <Switch 
                    id="analysis-mode" 
                    checked={showAnalysisPanel}
                    onCheckedChange={setShowAnalysisPanel}
                    />
                    <Label htmlFor="analysis-mode" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Show Discount Analysis
                    </Label>
                </div>
                
                {showAnalysisPanel && (
                <>
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
                </>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
