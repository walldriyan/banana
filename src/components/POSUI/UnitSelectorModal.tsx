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
    const newUnitDef = allUnitDefs.find(u => u.name === unitName);
    const currentUnitDef = allUnitDefs.find(u => u.name === selectedUnit);

    if (!newUnitDef || !currentUnitDef) {
      console.error("Unit not found");
      return;
    }

    const baseQuantity = quantity * currentUnitDef.conversionFactor;
    const newDisplayQuantity = baseQuantity / newUnitDef.conversionFactor;

    setSelectedUnit(unitName);
    setQuantity(Number(newDisplayQuantity.toFixed(4)));
  };

  const handleUpdate = () => {
    onUpdate(item.saleItemId, quantity, selectedUnit);
  };
  
  const updateButtonText = `Update to ${quantity} ${selectedUnit} (Rs. ${preview.newPrice.toFixed(2)})`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

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
     
        <Card>
            <CardHeader>
                <CardTitle className="text-base text-primary">Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                    <span>Price per {allUnits.baseUnit}:</span>
                    <span className="font-semibold">Rs. {unitPrice.toFixed(2)}</span>
                </div>
                 <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-medium">New Line Total:</span>
                        <span className="text-2xl font-bold text-primary">Rs. {preview.newPrice.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>


      <CardFooter className="p-0 pt-4">
        <Button onClick={handleUpdate} className="w-full h-12 text-base">
          {updateButtonText}
        </Button>
      </CardFooter>
    </div>
  );
}
