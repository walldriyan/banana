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
    // The white background and shadow are for the UI preview only.
    // The printable-area class is now applied directly inside ThermalReceipt
    // to ensure only the receipt content is targeted by print styles.
    <div className="w-full bg-gray-100 shadow-md rounded-md p-4">
      {/* 
        Pass the live toggle state `showFullPrice` to the ThermalReceipt.
        This ensures the receipt preview updates in real-time when the toggle is clicked.
        The ThermalReceipt component will prioritize this prop over the saved data.
      */}
      <ThermalReceipt data={data} showAsGiftReceipt={showFullPrice} />
    </div>
  );
}
