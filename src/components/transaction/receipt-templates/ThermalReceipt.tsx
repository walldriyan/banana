// src/components/transaction/receipt-templates/ThermalReceipt.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

interface ThermalReceiptProps {
  data: DatabaseReadyTransaction;
  originalTransaction?: DatabaseReadyTransaction | null;
  showAsGiftReceipt?: boolean; // Now optional
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function ThermalReceipt({ data, originalTransaction, showAsGiftReceipt: showAsGiftReceiptProp }: ThermalReceiptProps) {
  const { transactionHeader, transactionLines, appliedDiscountsLog, customerDetails, paymentDetails } = data;

  // *** THE DEFINITIVE FIX V2 ***
  // The decision to show gift/discount mode is now hierarchical:
  // 1. If the `showAsGiftReceipt` prop is provided (from the live toggle), it takes highest priority.
  // 2. If it's not provided (like in the History view), it falls back to the permanently saved `isGiftReceipt` flag in the transaction data.
  const showAsGiftReceipt = showAsGiftReceiptProp !== undefined
    ? showAsGiftReceiptProp
    : (transactionHeader.isGiftReceipt ?? false);

  const finalTotalToShow = showAsGiftReceipt ? transactionHeader.subtotal : transactionHeader.finalTotal;
  const isRefund = transactionHeader.status === 'refund';

  // For a refund receipt, this is the net cash change. For a normal sale, it's the change given.
  const finalCashChange = paymentDetails.paidAmount - finalTotalToShow;

  // This is the original amount the customer paid in the transaction that is being refunded.
  const originalPaidAmountForRefundContext = originalTransaction?.paymentDetails.paidAmount;

  // By adding 'printable-area' here, only this component will be visible during printing.
  // The 'bg-white' and other styles ensure it looks like a receipt in the UI preview.
  return (
    <div className="bg-white text-black font-mono text-xs max-w-[300px] mx-auto p-2 printable-area">
      <header className="text-center space-y-1">
        <h1 className="text-lg font-bold">My New Shop</h1>
        <p>123, Galle Road, Colombo 03</p>
        <p>Tel: 011-2345678</p>
        <p>Date: {new Date(transactionHeader.transactionDate).toLocaleString()}</p>
        <p>Receipt No: {transactionHeader.transactionId}</p>
        {isRefund && transactionHeader.originalTransactionId && (
          <p className='font-bold'>(REFUND for: {transactionHeader.originalTransactionId})</p>
        )}
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
            <th className="text-right">Our Price</th>
          </tr>
        </thead>
        <tbody>
          {transactionLines.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="text-left">{item.productName}{item.batchNumber ? ` (${item.batchNumber})` : ''}</td>
                <td className="text-center">{item.displayQuantity} {item.displayUnit}</td>
              
                <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                <td className="text-right">
                  {item.lineTotalBeforeDiscount.toFixed(2)}
                </td>
                <td className="text-right">
                  {item.lineTotalAfterDiscount.toFixed(2)}
                </td>
              </tr>
              {item.lineDiscount > 0 && !showAsGiftReceipt && (
                <tr>
                  <td colSpan={3} className="text-right italic text-gray-600">
                    (Discount)
                  </td>
                  <td className="text-right italic text-gray-600">
                    - {item.lineDiscount.toFixed(2)}
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
          <>
            <Line />
            <div className="flex justify-between font-bold text-blue-700">
                <span>Your Savings:</span>
                <span>Rs. {transactionHeader.totalDiscountAmount.toFixed(2)}</span>
            </div>
          </>
        )}
      </section>

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
        {isRefund ? (
          <>
            <div className="flex justify-between font-bold">
              <span>Original Bill Paid:</span>
              <span>{originalPaidAmountForRefundContext?.toFixed(2) ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>New Bill Total:</span>
              <span>{finalTotalToShow.toFixed(2)}</span>
            </div>
            <Line />
            {/* Net cash change for the refund transaction */}
            {(paymentDetails.paidAmount > 0) ? (
              <div className="flex justify-between font-bold text-red-700">
                <span>Amount Collected from Customer:</span>
                <span>{paymentDetails.paidAmount.toFixed(2)}</span>
              </div>
            ) : (paymentDetails.paidAmount < 0) ? (
              <div className="flex justify-between font-bold text-green-700">
                <span>Amount Returned to Customer:</span>
                <span>{(-paymentDetails.paidAmount).toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between font-bold">
                <span>Net Change:</span>
                <span>0.00</span>
              </div>
            )}
            
            {paymentDetails.outstandingAmount > 0 && (
              <div className="flex justify-between font-bold">
                <span>New Outstanding:</span>
                <span>{paymentDetails.outstandingAmount.toFixed(2)}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Paid ({paymentDetails.paymentMethod}):</span>
              <span>{paymentDetails.paidAmount.toFixed(2)}</span>
            </div>

            {paymentDetails.outstandingAmount > 0 ? (
               <div className="flex justify-between font-bold text-red-600">
                  <span>Outstanding:</span>
                  <span>{paymentDetails.outstandingAmount.toFixed(2)}</span>
                </div>
            ) : (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>{finalCashChange.toFixed(2)}</span>
                </div>
            )}
          </>
        )}
      </section>

      <Line />

      <footer className="text-center mt-2">
        <p>Thank You For Shopping With Us!</p>
        <p>Come Again!</p>
      </footer>
    </div>
  );
}
