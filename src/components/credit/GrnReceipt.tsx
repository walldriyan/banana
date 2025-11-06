// src/components/credit/GrnReceipt.tsx
import React from 'react';
import { format } from 'date-fns';
import type { CreditorGrn } from '@/app/dashboard/credit/CreditClientPage';
import type { Company, PurchasePayment } from '@prisma/client';
import { useLanguage } from '@/context/LanguageContext';

interface GrnReceiptProps {
  grn: CreditorGrn;
  payments: PurchasePayment[];
  company: Company | null;
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function GrnReceipt({ grn, payments, company }: GrnReceiptProps) {
  const { t } = useLanguage();
  const balance = grn.totalAmount - grn.totalPaid;

  const companyName = company?.name || t('shopName');
  const companyAddress = company?.address || t('shopAddress');
  const companyPhone = company?.phone || '';

  return (
    <div id="grn-receipt-container" className="thermal-receipt-container">
      <header className="text-center space-y-1">
        <h1 className="text-lg font-bold">{companyName}</h1>
        <p>{companyAddress}</p>
        {companyPhone && <p>{t('shopTel')}: {companyPhone}</p>}
      </header>

      <Line />
      <h2 className="font-bold text-center">GRN PAYMENT STATEMENT</h2>
      <Line />

      <section className="my-1 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="font-bold">{t('dateLabel')}:</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">GRN No:</span>
          <span>{grn.grnNumber}</span>
        </div>
         <div className="flex justify-between">
          <span className="font-bold">GRN Date:</span>
          <span>{format(new Date(grn.grnDate), 'PP')}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Supplier:</span>
          <span>{grn.supplier.name}</span>
        </div>
      </section>

      <Line />

      <section className="my-1 space-y-1">
        <div className="flex justify-between font-bold text-base">
          <span>Total Bill Amount:</span>
          <span>Rs. {grn.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Total Paid:</span>
          <span>Rs. {grn.totalPaid.toFixed(2)}</span>
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
