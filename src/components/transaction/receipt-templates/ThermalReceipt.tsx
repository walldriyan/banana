// src/components/transaction/receipt-templates/ThermalReceipt.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

interface ThermalReceiptProps {
  data: DatabaseReadyTransaction;
  showAsGiftReceipt?: boolean; // New prop to control the display mode
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function ThermalReceipt({ data, showAsGiftReceipt = false }: ThermalReceiptProps) {
  const { transactionHeader, transactionLines, appliedDiscountsLog, customerDetails, paymentDetails } = data;

  const finalTotalToShow = showAsGiftReceipt ? transactionHeader.subtotal : transactionHeader.finalTotal;

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
          <tr className="font-bold">
            <th className="text-left">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {transactionLines.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="text-left">{item.productName}{item.batchNumber ? ` (${item.batchNumber})` : ''}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                <td className="text-right">{item.lineTotalAfterDiscount.toFixed(2)}</td>
              </tr>
              {item.lineDiscount > 0 && !showAsGiftReceipt && (
                 <tr>
                    <td colSpan={3} className="text-right italic text-gray-600">
                      (Discount: 
                        <span className="line-through mx-1">{item.lineTotalBeforeDiscount.toFixed(2)}</span>)
                    </td>
                    <td className="text-right font-semibold text-green-700">
                      -{item.lineDiscount.toFixed(2)}
                    </td>
                 </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <Line />

      <section className="my-1 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{transactionHeader.subtotal.toFixed(2)}</span>
        </div>
        
        {transactionHeader.totalDiscountAmount > 0 && !showAsGiftReceipt && (
          <div className="flex justify-between font-bold text-green-700">
            <span>Total Discounts:</span>
            <span>({transactionHeader.totalDiscountAmount.toFixed(2)})</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL:</span>
          <span>Rs. {finalTotalToShow.toFixed(2)}</span>
        </div>

        {transactionHeader.totalDiscountAmount > 0 && showAsGiftReceipt && (
          <div className="flex justify-between font-bold text-blue-700">
            <span>Your Savings:</span>
            <span>Rs. {transactionHeader.totalDiscountAmount.toFixed(2)}</span>
          </div>
        )}
      </section>

      {/* Hide applied discounts log in gift mode to avoid confusion */}
      {appliedDiscountsLog.length > 0 && !showAsGiftReceipt && (
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
          <span>{(finalTotalToShow - paymentDetails.paidAmount).toFixed(2)}</span>
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
