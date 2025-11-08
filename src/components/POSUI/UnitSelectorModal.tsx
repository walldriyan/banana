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
    // Calculate the price per single base unit.
    return item.price / item.quantity;
  }, [item.price, item.quantity]);

  const preview = useMemo(() => {
    const selectedUnitDef = allUnitDefs.find((u) => u.name === selectedUnit);
    if (!selectedUnitDef) return { convertedQty: 0, newPrice: 0 };
    
    // Calculate the total base quantity based on the CURRENT display quantity and unit
    const baseQty = quantity * selectedUnitDef.conversionFactor;
    // Calculate the new total price based on the calculated base quantity and the price per base unit
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
  
    // 1️⃣ Convert the CURRENT display quantity (from the input box) back to the base quantity.
    const baseQuantity = quantity * currentUnitDef.conversionFactor;
    console.log(`   - දැනට ඇති Base Quantity: ${baseQuantity} ${allUnits.baseUnit}`);
  
    // 2️⃣ Convert that base quantity to the NEW display quantity by dividing.
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
     
      {/* 🔹 Calculation Summary in Simple Sinhala */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base text-primary">ගණනය කිරීම සහ තහවුරු කිරීම</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p>
                    ඔබ දැන් තෝරාගෙන ඇත්තේ <span className="font-bold text-foreground">{item.product.name}</span> වලින් <span className="font-bold text-foreground">{quantity} {selectedUnit}</span> ප්‍රමාණයකි.
                </p>
                <p className="text-muted-foreground">
                    මෙය, එහි මූලික ඒකකය වන <span className="font-semibold text-foreground">{allUnits.baseUnit}</span> වලින් <span className="font-semibold text-foreground">{preview.convertedQty.toFixed(3)}</span> ක ප්‍රමාණයකට සමාන වේ.
                </p>
                <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-medium">නව මුළු මුදල:</span>
                        <span className="text-2xl font-bold text-primary">Rs. {preview.newPrice.toFixed(2)}</span>
                    </div>
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
