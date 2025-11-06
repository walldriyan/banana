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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useProductUnits } from '@/hooks/use-product-units';
import { debounce } from 'lodash';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import OrderSummary from '@/components/POSUI/OrderSummary';


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

  const unitsCache = useRef<Map<string, any>>(new Map());

  const parseUnits = useCallback((units: any) => {
    if (typeof units !== 'string') return units;

    const cached = unitsCache.current.get(units);
    if (cached) return cached;

    try {
      const parsed = JSON.parse(units);
      unitsCache.current.set(units, parsed);
      return parsed;
    } catch (e) {
      console.error('Failed to parse units:', e);
      return { baseUnit: 'unit', derivedUnits: [] };
    }
  }, []);

  // Memoized cart transformation
  const cartWithUnits = useMemo(() => {
    return cart.map(item => {
      if (item.displayUnit) return item;

      const unitsData = parseUnits(item.product.units);
      return {
        ...item,
        displayUnit: unitsData.baseUnit
      };
    });
  }, [cart, parseUnits]);


  // Debounced calculation function
  const debouncedCalculateRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    // Create debounced function once
    debouncedCalculateRef.current = debounce(async (cartData, campaign) => {
      if (cartData.length === 0) {
        setDiscountResult(initialDiscountResult);
        setIsCalculating(false);
        return;
      }
      setIsCalculating(true);
      const result = await calculateDiscountsAction(cartData, campaign);
      if (result.success && result.data) {
        setDiscountResult({
          ...result.data,
          getLineItem: (saleItemId: string) =>
            result.data.lineItems.find((li: any) => li.saleItemId === saleItemId),
          getAppliedRulesSummary: () => result.data.appliedRulesSummary || []
        });
      } else {
        setDiscountResult(initialDiscountResult);
      }
      setIsCalculating(false);
    }, 300);

    // Cleanup function to cancel pending debounced calls
    return () => {
      if (debouncedCalculateRef.current) {
        debouncedCalculateRef.current.cancel();
      }
    };
  }, []);

  // Create a fingerprint to detect meaningful changes only
  const cartFingerprint = useMemo(() => {
    return cart.map(item =>
      `${item.saleItemId}:${item.quantity}:${item.customDiscountValue || 0}`
    ).join('|');
  }, [cart]);

  const campaignFingerprint = useMemo(() => activeCampaign.id, [activeCampaign]);

  // Smart debouncing with fingerprint comparison
  const prevFingerprintRef = useRef<string>('');

  useEffect(() => {
    const currentFingerprint = `${cartFingerprint}:${campaignFingerprint}`;

    // Skip calculation if nothing meaningful changed
    if (prevFingerprintRef.current === currentFingerprint) {
      return;
    }

    prevFingerprintRef.current = currentFingerprint;

    if (debouncedCalculateRef.current) {
      debouncedCalculateRef.current(cartWithUnits, activeCampaign);
    }
  }, [cartFingerprint, campaignFingerprint, cartWithUnits, activeCampaign]);


  // Clear cache periodically to prevent memory growth
  useEffect(() => {
    const interval = setInterval(() => {
      if (unitsCache.current.size > 100) {
        unitsCache.current.clear();
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);


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

  // Use useRef to maintain stable reference
  const cartLengthRef = useRef(0);
  const openTransactionDrawerRef = useRef<(() => void) | null>(null);

  // Update refs on changes
  useEffect(() => {
    cartLengthRef.current = cart.length;
  }, [cart.length]);

  useEffect(() => {
    openTransactionDrawerRef.current = openTransactionDrawer;
  }, [openTransactionDrawer]);

  // Stable event handler that doesn't change
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;

    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    const isDrawerOpen = !!document.querySelector('[data-state="open"]');

    if (event.ctrlKey && event.key === 'Enter' && !isDrawerOpen) {
      event.preventDefault();
      if (cartLengthRef.current > 0 && openTransactionDrawerRef.current) {
        openTransactionDrawerRef.current();
      }
      return;
    }

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
  }, []); // Empty deps - handler is now stable

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]); // Now handleGlobalKeyDown never changes


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
    const itemIndex = cart.findIndex(item => item.saleItemId === saleItemId);
    if (itemIndex === -1) return;

    const currentItem = cart[itemIndex];
    const unitsData = parseUnits(currentItem.product.units);
    const allUnits = [{ name: unitsData.baseUnit, conversionFactor: 1 }, ...(unitsData.derivedUnits || [])];

    const unitToUse = newDisplayUnit || currentItem.displayUnit;
    const selectedUnitDefinition = allUnits.find(u => u.name === unitToUse);
    const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;

    const newBaseQuantity = newDisplayQuantity * conversionFactor;
    const originalProduct = products.find(p => p.id === currentItem.id);
    const originalStock = originalProduct?.stock || 0;

    if (newBaseQuantity > originalStock) {
      toast({
        variant: "destructive",
        title: "Stock Limit Exceeded",
        description: `Cannot add more than the available stock of ${originalStock} ${unitsData.baseUnit}.`,
      });
      return;
    }

    setCart(currentCart => {
      const updatedCart = [...currentCart];
      const idx = updatedCart.findIndex(item => item.saleItemId === saleItemId);
      if (idx === -1) return currentCart;

      if (newDisplayQuantity <= 0) {
        return updatedCart.filter(item => item.saleItemId !== saleItemId);
      }

      updatedCart[idx] = {
        ...updatedCart[idx],
        quantity: newBaseQuantity,
        displayQuantity: newDisplayQuantity,
        displayUnit: unitToUse,
      };
      return updatedCart;
    });
  };


  const addToCart = (productBatch: ProductBatch) => {
    const unitsData = parseUnits(productBatch.product.units);
    const allUnits = [{ name: unitsData.baseUnit, conversionFactor: 1 }, ...(unitsData.derivedUnits || [])];
    const existingItemIndex = cart.findIndex(item => item.id === productBatch.id);

    if (existingItemIndex !== -1) {
      const currentItem = cart[existingItemIndex];
      const newDisplayQuantity = currentItem.displayQuantity + 1;
      const selectedUnitDefinition = allUnits.find(u => u.name === currentItem.displayUnit);
      const conversionFactor = selectedUnitDefinition?.conversionFactor || 1;
      const newBaseQuantity = newDisplayQuantity * conversionFactor;
      const originalProduct = products.find(p => p.id === currentItem.id);
      const originalStock = originalProduct?.stock || 0;

      if (newBaseQuantity > originalStock) {
        toast({
          variant: "destructive",
          title: "Stock Limit Exceeded",
          description: `Cannot add more than the available stock of ${originalStock} ${unitsData.baseUnit}.`,
        });
        return;
      }

      setCart(currentCart => currentCart.map((item, index) => {
        if (index === existingItemIndex) {
          return {
            ...item,
            quantity: newBaseQuantity,
            displayQuantity: newDisplayQuantity,
          };
        }
        return item;
      }));
    } else {
      const availableStock = availableProducts.find(p => p.id === productBatch.id)?.stock ?? 0;
      if (1 > availableStock) {
        toast({
          variant: "destructive",
          title: "Out of Stock",
          description: "This product batch is currently out of stock.",
        });
        return;
      }

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

  const clearCart = useCallback(() => {
    setCart([]);
    setTransactionId(createNewTransactionId());
  }, []);

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

  const openAnalysisDrawer = useCallback(() => {
    drawer.openDrawer({
      title: 'Discount Behavior Analysis',
      content: (
        <DiscountBehaviorPanel
          isCalculating={isCalculating}
          discountResult={discountResult}
          activeCampaign={activeCampaign}
          transactionId={transactionId}
        />
      ),
      drawerClassName: 'sm:max-w-lg',
    });
  }, [drawer, isCalculating, discountResult, activeCampaign, transactionId]);


  const originalTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const finalTotal = discountResult?.finalTotal ?? originalTotal;

  if (isLoading) {
    return (
      <div className="min-h-screen  text-gray-900 font-sans p-4 sm:p-6 lg:p-8">
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

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <TooltipProvider>
        <aside className="flex flex-col items-center gap-1 p-2 border-r bg-background  flex-shrink-0 lg:flex md:flex hidden hidden xs:hidden ">
          <AuthorizationGuard permissionKey="history.view">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/history" passHref>
                  <Button variant="ghost" size="icon">
                    <History className="h-5 w-5" />
                    <span className="sr-only">View History</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">View History</TooltipContent>
            </Tooltip>
          </AuthorizationGuard>

          <AuthorizationGuard permissionKey="products.view">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/products" passHref>
                  <Button variant="ghost" size="icon">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
          </AuthorizationGuard>

          <div className="mt-auto flex flex-col items-center gap-4">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </aside>
      </TooltipProvider>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0   overflow-hidden ">
        {/* Header Avatar */}
        <div className="absolute top-6 right-6 z-20 ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex cursor-pointer items-center gap-3 p-2 border rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-muted transition-colors">
                <Avatar>
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="md:hidden">
                <AuthorizationGuard permissionKey="history.view">
                  <DropdownMenuItem asChild>
                    <Link href="/history">
                      <History className="mr-2 h-4 w-4" />
                      <span>History</span>
                    </Link>
                  </DropdownMenuItem>
                </AuthorizationGuard>
                <AuthorizationGuard permissionKey="products.view">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/products">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                </AuthorizationGuard>
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem>
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* MAIN */}
        <main className="flex flex-1 flex-col px-4 py-2 lg:overflow-hidden overflow-hidden p-2 mb-2">
          <Card className="flex flex-col flex-1 w-full shadow-md overflow-hidden p-2">
            <CardContent className="flex flex-col flex-1 p-4 sm:p-6 gap-6 lg:overflow-hidden overflow-y-auto">

              {/* 🔍 Search Row */}
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <div className="flex-grow min-w-0">
                  <SearchableProductInput
                    ref={productSearchRef}
                    products={availableProducts}
                    onProductSelect={addToCart}
                  />
                </div>
                <div className="w-full sm:w-64 flex-shrink-0">
                  <AuthorizationGuard permissionKey="pos.view">
                    <CampaignSelector
                      activeCampaign={activeCampaign}
                      allCampaigns={allCampaigns}
                      onCampaignChange={setActiveCampaign}
                    />
                  </AuthorizationGuard>
                </div>
              </div>

              {/* 🧩 Main Grid Area */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 lg:min-h-0 lg:overflow-hidden">

                {/* 🛒 Left - Cart */}
                <div className="flex flex-col flex-1 min-w-0 rounded-lg lg:overflow-hidden">
                  <div className="flex-1 lg:overflow-y-auto">
                    <ShoppingCart
                      cart={cart}
                      isCalculating={isCalculating}
                      discountResult={discountResult}
                      onUpdateQuantity={handleCartUpdate}
                      onOverrideDiscount={openCustomDiscountDrawer}
                    />
                  </div>
                </div>

                {/* 📊 Right - Summary */}
                <div className="flex flex-col lg:w-[28%] flex-shrink-0 rounded-lg lg:overflow-hidden">
                  <div className="flex flex-col h-full p-5">
                    <div className="flex-grow overflow-y-auto min-h-0">
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
                          onOpenAnalysis={openAnalysisDrawer}
                        />
                      )}
                    </div>

                    {/* 🧾 Bottom Buttons */}
                    <AuthorizationGuard permissionKey="pos.create.transaction">
                      <div className="mt-auto pt-4 border-t border-border rounded-lg flex-shrink-0">
                        <div className="  bottom-0 w-full border-t border-border pt-2 mt-2 flex justify-between font-semibold text-sm">
                          <span className="text-foreground">Total All Discounts:</span>
                          <span className="text-green-600">
                            -Rs. {(discountResult.totalItemDiscount + discountResult.totalCartDiscount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex  justify-between items-baseline py-2">
                          <span className="text-lg font-semibold">Final Total</span>
                          <span className="text-3xl font-bold text-primary">
                            Rs. {finalTotal.toFixed(2)}
                          </span>
                        </div>
                        {isCalculating ? (
                          <Skeleton className="h-12 w-full" />
                        ) : (
                          <button
                            onClick={openTransactionDrawer}
                            disabled={cart.length === 0}
                            className="w-full mb-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-900/10 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                          >
                            Complete Transaction
                          </button>
                        )}

                        <button
                          onClick={clearCart}
                          className="w-full px-4 mb-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </AuthorizationGuard>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
