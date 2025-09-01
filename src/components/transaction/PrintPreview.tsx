// src/components/transaction/PrintPreview.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { ThermalReceipt } from './receipt-templates/ThermalReceipt';

interface PrintPreviewProps {
  data: DatabaseReadyTransaction;
  showFullPrice: boolean; // Add prop to control billing mode
}

export function PrintPreview({ data, showFullPrice }: PrintPreviewProps) {
  return (
    <div className="w-full h-full p-4 bg-white shadow-md rounded-md">
      {/* We can add a selector here later to switch between receipt templates */}
      <ThermalReceipt data={data} showAsGiftReceipt={showFullPrice} />
    </div>
  );
}
