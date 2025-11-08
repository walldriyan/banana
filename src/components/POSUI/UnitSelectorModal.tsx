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


interface UnitSelectorModalProps {
  item: SaleItem;
  onUpdate: (saleItemId: string, newDisplayQuantity: number, newDisplayUnit: string) => void;
}

export function UnitSelectorModal({ item, onUpdate }: UnitSelectorModalProps) {
  const allUnits = useProductUnits(item.product.units);

  // base + derived units එක එකකට list එකක් හදාගන්නවා
  const baseUnitDef = { name: allUnits.baseUnit, conversionFactor: 1 };
  const derivedUnits = allUnits.derivedUnits || [];
  const allUnitDefs = [baseUnitDef, ...derivedUnits];

  // 🧮 UI state
  const [selectedUnit, setSelectedUnit] = useState<string>(item.displayUnit || allUnits.baseUnit);
  const [quantity, setQuantity] = useState<number>(item.displayQuantity || 1);

  // 🧾 Conversion preview
  const preview = useMemo(() => {
    const selectedUnitDef = allUnitDefs.find((u) => u.name === selectedUnit);
    if (!selectedUnitDef) return { convertedQty: 0, newPrice: 0 };

    const baseQty = quantity * selectedUnitDef.conversionFactor;
    const newPrice = baseQty * item.price;

    return { convertedQty: baseQty, newPrice };
  }, [quantity, selectedUnit, allUnitDefs, item.price]);

  // 🧩 unit එක change කිරීමේ function එක
  const handleUnitSelect = (unitName: string) => {
    console.log("--- Unit Conversion Calculation (සිංහලෙන්) ---");
    const newUnitDef = allUnitDefs.find(u => u.name === unitName);
    const currentUnitDef = allUnitDefs.find(u => u.name === selectedUnit);

    if (!newUnitDef || !currentUnitDef) {
      console.error("Unit එක සොයාගන්න බැරි වුණා");
      return;
    }

    // 1️⃣ දැනට ඇති quantity එකෙන් base quantity එක ගන්නවා
    const baseQuantity = quantity * currentUnitDef.conversionFactor;
    console.log(`   🔹 Base Quantity: ${baseQuantity} ${allUnits.baseUnit}`);

    // 2️⃣ අලුත් unit එකට base quantity එක convert කිරීම
    const newDisplayQuantity = baseQuantity / newUnitDef.conversionFactor;
    console.log(`   🔹 Convert: ${baseQuantity} / ${newUnitDef.conversionFactor} = ${newDisplayQuantity}`);

    setSelectedUnit(unitName);
    setQuantity(Number(newDisplayQuantity.toFixed(4)));

    console.log(`   ✅ නව Unit: ${unitName}, Qty: ${newDisplayQuantity}`);
    console.log("--------------------------------------------");
  };

  // ✅ Update item function
  const handleUpdate = () => {
    onUpdate(item.saleItemId, quantity, selectedUnit);
  };

  return (
    <div className="space-y-6 pt-4">
      
      <div className="grid grid-cols-2 gap-4">
        {/* 🔹 Unit Selection Dropdown */}
        <div className="flex flex-col space-y-2">
            <Label htmlFor="unit-select">Select Unit</Label>
            <Select onValueChange={handleUnitSelect} value={selectedUnit}>
                <SelectTrigger id="unit-select" className="w-full">
                    <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                    {allUnitDefs.map(unit => (
                        <SelectItem key={unit.name} value={unit.name}>
                            {unit.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* 🔹 Quantity Input */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="quantity-input">Set Quantity</Label>
          <Input
            id="quantity-input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-10 text-center text-lg font-bold"
          />
        </div>
      </div>
     

      {/* 🔹 Summary */}
      <Card className="bg-muted/50">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-muted-foreground">Base Qty ({allUnits.baseUnit}):</span>
            <span className="font-bold">{preview.convertedQty.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-muted-foreground">Line Total:</span>
            <span className="font-bold">Rs. {preview.newPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Update Button */}
      <CardFooter className="p-0 pt-6">
        <Button onClick={handleUpdate} className="w-full h-12 text-lg">
          Update Item
        </Button>
      </CardFooter>
    </div>
  );
}