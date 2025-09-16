// src/components/transaction/PrintPreview.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { ThermalReceipt } from './receipt-templates/ThermalReceipt';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface PrintPreviewProps {
  data: DatabaseReadyTransaction;
  showFullPrice: boolean;
  setShowFullPrice: (value: boolean) => void;
  shouldPrintBill: boolean;
  setShouldPrintBill: (value: boolean) => void;
  onBack: () => void;
  onSaveAndFinish: () => void;
  isSaving: boolean;
}

export function PrintPreview({
  data,
  showFullPrice,
  setShowFullPrice,
  shouldPrintBill,
  setShouldPrintBill,
  onBack,
  onSaveAndFinish,
  isSaving,
}: PrintPreviewProps) {
  return (
    <div>
      <ThermalReceipt data={data} showAsGiftReceipt={showFullPrice} />
      
      <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-between no-print">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="billing-mode"
              checked={showFullPrice}
              onCheckedChange={setShowFullPrice}
            />
            <Label htmlFor="billing-mode">Gift Receipt</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="print-mode"
              checked={shouldPrintBill}
              onCheckedChange={setShouldPrintBill}
            />
            <Label htmlFor="print-mode">Print Bill</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onSaveAndFinish} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save & Finish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
