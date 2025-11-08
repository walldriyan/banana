// src/components/POSUI/UnitSelectorModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { SaleItem } from '@/types';
import { useProductUnits } from '@/hooks/use-product-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Package, Scale } from 'lucide-react';

interface UnitSelectorModalProps {
  item: SaleItem;
  onUpdate: (saleItemId: string, newDisplayQuantity: number, newDisplayUnit: string) => void;
}

export function UnitSelectorModal({ item, onUpdate }: UnitSelectorModalProps) {
  const allUnits = useProductUnits(item.product.units);

  const baseUnitDef = { name: allUnits.baseUnit, conversionFactor: 1 };
  const derivedUnits = allUnits.derivedUnits || [];
  
  const allUnitDefs = [baseUnitDef, ...derivedUnits];
  
  const [selectedUnit, setSelectedUnit] = useState<string>(item.displayUnit || allUnits.baseUnit);
  const [quantity, setQuantity] = useState<number>(item.displayQuantity || 1);

  // CORRECT LOGIC: Calculate the price of a single base unit.
  const unitPrice = useMemo(() => {
    // If original quantity is zero, price must be zero to avoid division by zero.
    if (item.quantity === 0) return 0;
    // item.price is the total line price, item.quantity is the total base quantity.
    // So, price of one base unit = total price / total base quantity.
    return item.price / item.quantity;
  }, [item.price, item.quantity]);

  // CORRECT LOGIC: This preview calculation is now accurate.
  const preview = useMemo(() => {
    const selectedUnitDef = allUnitDefs.find((u) => u.name === selectedUnit);
    if (!selectedUnitDef) return { convertedQty: 0, newPrice: 0 };
    
    // 1. Calculate the total base quantity based on the CURRENT user input.
    // e.g., User types '300' for 'G'. Base Qty = 300 / 1000 = 0.3 KG.
    const baseQty = quantity / selectedUnitDef.conversionFactor;

    // 2. Calculate the new total price based on the ACCURATE base quantity and ACCURATE unit price.
    // e.g., New Price = 0.3 KG * (Rs. 260 / 1 KG) = Rs. 78.00
    const newPrice = baseQty * unitPrice;

    return { convertedQty: baseQty, newPrice };
  }, [quantity, selectedUnit, allUnitDefs, unitPrice]);
  

  const handleUpdate = () => {
    onUpdate(item.saleItemId, quantity, selectedUnit);
  };

  return (
    <div className="space-y-4">
      {/* 🔹 Base Unit Display */}
      <Card className="bg-muted/30">
        <CardHeader className="p-4">
            <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-xs text-muted-foreground">Base Unit</p>
                    <p className="text-lg font-bold">{allUnits.baseUnit}</p>
                </div>
            </div>
        </CardHeader>
      </Card>
      
      {/* 🔹 Unit & Quantity Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Unit Selection Dropdown */}
        <div className="flex flex-col space-y-2">
            <Label htmlFor="unit-select">Convert To</Label>
            <Select onValueChange={setSelectedUnit} value={selectedUnit}>
                <SelectTrigger id="unit-select" className="w-full">
                    <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                    {allUnitDefs.map(unit => (
                        <SelectItem key={unit.name} value={unit.name}>
                           {unit.name} 
                           {unit.name !== allUnits.baseUnit && ` (1 ${allUnits.baseUnit} = ${unit.conversionFactor} ${unit.name})`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Quantity Input */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="quantity-input">Quantity</Label>
          <Input
            id="quantity-input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-10 text-center text-lg font-bold"
          />
        </div>
      </div>
     
      {/* 🔹 Calculation Breakdown */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardHeader className="p-4 flex-row items-center gap-3 space-y-0">
          <Scale className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          <CardTitle className="text-base text-blue-800 dark:text-blue-200">Calculation</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2 text-sm">
           <div className="flex justify-between">
              <span className="text-muted-foreground">Current Selection:</span>
              <span className="font-semibold">{quantity} {selectedUnit}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-muted-foreground">Base Quantity ({allUnits.baseUnit}):</span>
              <span className="font-bold">{preview.convertedQty.toFixed(3)}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-muted-foreground">Line Total:</span>
              <span className="font-bold">Rs. {preview.newPrice.toFixed(2)}</span>
           </div>
        </CardContent>
      </Card>

      {/* 🔹 Update Button */}
      <CardFooter className="p-0 pt-4">
        <Button onClick={handleUpdate} className="w-full h-12 text-lg">
          Update Item
        </Button>
      </CardFooter>
    </div>
  );
}
