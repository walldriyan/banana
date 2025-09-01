// src/components/transaction/receipt-templates/ThermalReceipt.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Separator } from '@/components/ui/separator';

interface ThermalReceiptProps {
  data: DatabaseReadyTransaction;
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function ThermalReceipt({ data }: ThermalReceiptProps) {
  const { transactionHeader, transactionLines, appliedDiscountsLog, customerDetails, paymentDetails } = data;

  return (
    <div className="bg-white text-black font-mono text-xs max-w-[300px] mx-auto p-2">
      <header className="text-center space-y-1">
        <h1 className="text-lg font-bold">My New Shop</h1>
        <p>123, Galle Road, Colombo 03</p>
        <p>Tel: 011-2345678</p>
        <p>Date: {new Date(transactionHeader.transactionDate).toLocaleString()}</p>
        <p>Receipt No: {transactionHeader.transactionId}</p>
      </header>

      <Line />

      <section className="my-1">
        <p><span className="font-bold">Customer:</span> {customerDetails.name}</p>
        {customerDetails.phone && <p><span className="font-bold">Phone:</span> {customerDetails.phone}</p>}
      </section>

      <Line />

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-bold">Item</th>
            <th className="text-center font-bold">Qty</th>
            <th className="text-right font-bold">Price</th>
            <th className="text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {transactionLines.map((item, index) => (
            <tr key={index}>
              <td className="text-left">{item.productName}{item.batchNumber ? ` (${item.batchNumber})` : ''}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{item.unitPrice.toFixed(2)}</td>
              <td className="text-right">{item.lineTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Line />

      <section className="my-1 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{transactionHeader.subtotal.toFixed(2)}</span>
        </div>
        {transactionHeader.totalDiscountAmount > 0 && (
          <div className="flex justify-between font-bold text-green-700">
            <span>Total Discounts:</span>
            <span>({transactionHeader.totalDiscountAmount.toFixed(2)})</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL:</span>
          <span>Rs. {transactionHeader.finalTotal.toFixed(2)}</span>
        </div>
      </section>

      {appliedDiscountsLog.length > 0 && (
        <>
          <Line />
          <section className="my-1">
            <h2 className="font-bold text-center">APPLIED DISCOUNTS</h2>
            {appliedDiscountsLog.map((discount, index) => (
              <div key={index} className="text-left">
                - {discount.sourceRuleName} ({discount.totalCalculatedDiscount.toFixed(2)})
              </div>
            ))}
          </section>
        </>
      )}
      
      <Line />

      <section className="my-1 space-y-1">
         <div className="flex justify-between">
          <span>Paid ({paymentDetails.paymentMethod}):</span>
          <span>{paymentDetails.paidAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Balance Due:</span>
          <span>{paymentDetails.outstandingAmount.toFixed(2)}</span>
        </div>
      </section>

      <Line />

      <footer className="text-center mt-2">
        <p>Thank You For Shopping With Us!</p>
        <p>Come Again!</p>
      </footer>
    </div>
  );
}
