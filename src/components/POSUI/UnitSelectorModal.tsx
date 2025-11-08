// src/components/POSUI/UnitSelectorModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { SaleItem } from '@/types';
import { useProductUnits } from '@/hooks/use-product-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

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

  // 🧩 unit එක click කිරීමේ function එක
  const handleUnitSelect = (unitName: string) => {
    const newUnitDef = allUnitDefs.find(u => u.name === unitName);
    const currentUnitDef = allUnitDefs.find(u => u.name === selectedUnit);

    if (!newUnitDef || !currentUnitDef) {
        console.error("Unit එක සොයාගන්න බැරි වුණා");
        return;
    }
    
    // 1️⃣ දැනට ඇති display quantity එකෙන් base quantity එක හදාගන්නවා
    const baseQuantity = quantity * currentUnitDef.conversionFactor;

    // 2️⃣ අලුත් unit එකට base quantity එක convert කිරීම
    const newDisplayQuantity = baseQuantity / newUnitDef.conversionFactor;
    
    setSelectedUnit(unitName);
    setQuantity(Number(newDisplayQuantity.toFixed(4)));
  };


  // ✅ Update item function
  const handleUpdate = () => {
    onUpdate(item.saleItemId, quantity, selectedUnit);
  };

  return (
    <div className="space-y-6">
      {/* 🔹 Unit Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Unit</CardTitle>
          <CardDescription>Choose the unit you want to count in.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {allUnitDefs.map((unit) => (
            <Button
              key={unit.name}
              variant={selectedUnit === unit.name ? 'secondary' : 'outline'}
              onClick={() => handleUnitSelect(unit.name)}
              className="h-12 text-base flex items-center justify-center gap-2"
            >
              {selectedUnit === unit.name && <CheckCircle className="h-4 w-4" />}
              {unit.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 🔹 Quantity Input */}
      <Card>
        <CardHeader>
          <CardTitle>Set Quantity</CardTitle>
          <CardDescription>Enter the quantity for {selectedUnit}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="quantity-input" className="sr-only">Quantity</Label>
          <Input
            id="quantity-input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-14 text-center text-2xl font-bold"
          />
        </CardContent>
      </Card>

      {/* 🔹 Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
