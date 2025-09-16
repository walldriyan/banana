// src/components/transaction/PrintPreview.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { ThermalReceipt } from './receipt-templates/ThermalReceipt';

interface PrintPreviewProps {
  data: DatabaseReadyTransaction;
  showFullPrice: boolean; // Add prop to control billing mode
}

export function PrintPreview({ data, showFullPrice }: PrintPreviewProps) {
  // The white background and shadow are for the UI preview only.
  // By removing the wrapper div and directly returning ThermalReceipt,
  // we ensure no container styles interfere with the print layout.
  return (
    <ThermalReceipt data={data} showAsGiftReceipt={showFullPrice} />
  );
}
