// src/components/debtors/SaleReceipt.tsx
import React from 'react';
import { format } from 'date-fns';
import type { DebtorTransaction } from '@/app/dashboard/debtors/DebtorsClientPage';
import type { SalePayment } from '@prisma/client';

interface SaleReceiptProps {
  transaction: DebtorTransaction;
  payments: SalePayment[];
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function SaleReceipt({ transaction, payments }: SaleReceiptProps) {
  const balance = transaction.finalTotal - transaction.totalPaid;

  return (
    <div id="sale-receipt-container" className="thermal-receipt-container">
      <header className="text-center space-y-1">
        <h1 className="text-lg font-bold">My New Shop</h1>
        <p>123, Galle Road, Colombo 03</p>
        <p>Tel: 011-2345678</p>
      </header>

      <Line />
      <h2 className="font-bold text-center">TRANSACTION PAYMENT STATEMENT</h2>
      <Line />

      <section className="my-1 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="font-bold">Date:</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Transaction ID:</span>
          <span>{transaction.id}</span>
        </div>
         <div className="flex justify-between">
          <span className="font-bold">Transaction Date:</span>
          <span>{format(new Date(transaction.transactionDate), 'PP')}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Customer:</span>
          <span>{transaction.customer.name}</span>
        </div>
      </section>

      <Line />

      <section className="my-1 space-y-1">
        <div className="flex justify-between font-bold text-base">
          <span>Total Bill Amount:</span>
          <span>Rs. {transaction.finalTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Total Paid:</span>
          <span>Rs. {transaction.totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-red-600">
          <span>Balance Due:</span>
          <span>Rs. {balance.toFixed(2)}</span>
        </div>
      </section>

      <Line />

      <section className="my-1">
        <h2 className="font-bold text-center">PAYMENT HISTORY</h2>
        {payments.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="font-bold">
                <th className="text-left">Date</th>
                <th className="text-left">Method</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, index) => (
                <tr key={index}>
                  <td className="text-left">{format(new Date(p.paymentDate), 'yyyy-MM-dd')}</td>
                  <td className="text-left capitalize">{p.paymentMethod}</td>
                  <td className="text-right">{p.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center italic">No payments recorded yet.</p>
        )}
      </section>
      
      <Line />
      <footer className="text-center mt-2">
        <p>This is a computer generated statement.</p>
      </footer>
    </div>
  );
}
