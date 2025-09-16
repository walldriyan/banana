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
    <div className="w-full h-full p-4 bg-white shadow-md rounded-md overflow-y-scroll printable-area">
      {/* 
        Pass the live toggle state `showFullPrice` to the ThermalReceipt.
        This ensures the receipt preview updates in real-time when the toggle is clicked.
        The ThermalReceipt component will prioritize this prop over the saved data.
      */}
      <ThermalReceipt data={data} showAsGiftReceipt={showFullPrice} />
    </div>
  );
}
