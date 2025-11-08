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

  const unitPrice = useMemo(() => {
    if (item.quantity === 0) return 0;
    return item.price / item.quantity;
  }, [item.price, item.quantity]);

  const preview = useMemo(() => {
    const selectedUnitDef = allUnitDefs.find((u) => u.name === selectedUnit);
    if (!selectedUnitDef) return { convertedQty: 0, newPrice: 0 };
    
    const baseQty = quantity * selectedUnitDef.conversionFactor;
    const newPrice = baseQty * unitPrice;

    return { convertedQty: baseQty, newPrice };
  }, [quantity, selectedUnit, allUnitDefs, unitPrice]);

  const handleUnitSelect = (unitName: string) => {
    console.log("--- Unit Conversion Calculation (සිංහලෙන්) ---");
  
    const newUnitDef = allUnitDefs.find(u => u.name === unitName);
    // Get the definition of the unit that is *currently* selected in the state, before the change.
    const currentUnitDef = allUnitDefs.find(u => u.name === selectedUnit);
  
    if (!newUnitDef || !currentUnitDef) {
      console.error("Unit එක සොයාගන්න බැරි වුණා");
      return;
    }
  
    // 1️⃣ Convert the CURRENT display quantity back to the base quantity.
    // Use the `quantity` state value, which is what the user sees in the input box.
    const baseQuantity = quantity * currentUnitDef.conversionFactor;
    console.log(`   - දැනට ඇති Base Quantity: ${baseQuantity} ${allUnits.baseUnit}`);
  
    // 2️⃣ Convert the base quantity to the NEW display quantity.
    const newDisplayQuantity = baseQuantity / newUnitDef.conversionFactor;
    console.log(`   - ගණනය: ${baseQuantity} / ${newUnitDef.conversionFactor} = ${newDisplayQuantity}`);
  
    // 3️⃣ Update both the selected unit AND the quantity in the input box.
    setSelectedUnit(unitName);
    setQuantity(Number(newDisplayQuantity.toFixed(4))); // Use toFixed to avoid floating point inaccuracies
  
    console.log(`   ✅ නව Display Unit: ${unitName}, Quantity: ${newDisplayQuantity}`);
    console.log("-------------------------------------------------");
  };

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
            <Select onValueChange={handleUnitSelect} value={selectedUnit}>
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
          <Label htmlFor="quantity-input">Quantity in {selectedUnit}</Label>
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
              <span className="text-muted-foreground">Equivalent Base Quantity ({allUnits.baseUnit}):</span>
              <span className="font-bold">{preview.convertedQty.toFixed(3)}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-muted-foreground">New Line Total:</span>
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
