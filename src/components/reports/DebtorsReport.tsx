// src/components/reports/DebtorsReport.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { Transaction, Customer } from '@prisma/client';
import { format } from 'date-fns';

type DebtorTransaction = Transaction & { customer: Customer; totalPaid: number; };

interface DebtorsReportProps {
  data: DebtorTransaction[];
}

export const DebtorsReport: React.FC<DebtorsReportProps> = ({ data }) => {
  const { t, language } = useLanguage();
  const totalOutstanding = data.reduce((sum, tx) => sum + (tx.finalTotal - tx.totalPaid), 0);

  return (
    <div className="report-container p-4 bg-white text-sm text-black">
        <header className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Debtors Report (Outstanding Sales)</h1>
            <p className="text-xs text-gray-500">
            As of {new Date().toLocaleString(language)}
            </p>
        </header>

        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-gray-100">
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Txn Date</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Txn ID</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Customer</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Amount</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Paid</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Balance Due</th>
            </tr>
            </thead>
            <tbody>
            {data.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-2 border-b border-gray-200">{format(new Date(tx.transactionDate), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b border-gray-200 truncate max-w-[100px]">{tx.id}</td>
                    <td className="p-2 border-b border-gray-200">{tx.customer.name}</td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {tx.finalTotal.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {tx.totalPaid.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right font-semibold">Rs. {(tx.finalTotal - tx.totalPaid).toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
             <tfoot>
                <tr className="bg-gray-100 font-bold">
                    <td colSpan={5} className="p-2 text-right">Total Outstanding Debt from Customers:</td>
                    <td className="p-2 text-right">Rs. {totalOutstanding.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
         <footer className="text-center mt-8 pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-500">{t('generatedOn')} {new Date().toLocaleString(language)}</p>
            <p className="text-xs text-gray-500">{t('computerGeneratedReport')}</p>
        </footer>
    </div>
  );
};
