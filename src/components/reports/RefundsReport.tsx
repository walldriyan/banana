// src/components/reports/RefundsReport.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { Transaction, Customer } from '@prisma/client';
import { format } from 'date-fns';

type RefundTransaction = Transaction & { 
    customer: Customer; 
    originalTransaction: { id: string, finalTotal: number } | null 
};

interface RefundsReportProps {
  data: {
    refunds: RefundTransaction[],
    dateRange?: { from: Date, to: Date }
  };
}

export const RefundsReport: React.FC<RefundsReportProps> = ({ data }) => {
  const { refunds, dateRange } = data;
  const { t, language } = useLanguage();

  const totalRefundedValue = refunds.reduce((sum, tx) => {
      const originalTotal = tx.originalTransaction?.finalTotal || 0;
      const keptTotal = tx.finalTotal;
      return sum + (originalTotal - keptTotal);
  }, 0);

  return (
    <div className="report-container p-4 bg-white text-sm text-black">
        <header className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Refunds Report</h1>
            <p className="text-xs text-gray-500">
                 {dateRange?.from && dateRange?.to
                    ? `For the period of ${format(new Date(dateRange.from), 'PPP')} to ${format(new Date(dateRange.to), 'PPP')}`
                    : `As of ${new Date().toLocaleString(language)}`
                }
            </p>
        </header>

        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-100">
                    <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Refund Date</th>
                    <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Refund ID</th>
                    <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Original ID</th>
                    <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Customer</th>
                    <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Refunded Amount</th>
                </tr>
            </thead>
            <tbody>
                {refunds.map((tx) => {
                    const originalTotal = tx.originalTransaction?.finalTotal || 0;
                    const keptTotal = tx.finalTotal;
                    const refundedAmount = originalTotal - keptTotal;

                    return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="p-2 border-b border-gray-200">{format(new Date(tx.transactionDate), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border-b border-gray-200 truncate max-w-[100px]">{tx.id}</td>
                            <td className="p-2 border-b border-gray-200 truncate max-w-[100px]">{tx.originalTransactionId}</td>
                            <td className="p-2 border-b border-gray-200">{tx.customer.name}</td>
                            <td className="p-2 border-b border-gray-200 text-right font-semibold text-red-600">Rs. {refundedAmount.toFixed(2)}</td>
                        </tr>
                    );
                })}
            </tbody>
             <tfoot>
                <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 text-right">Total Value of Refunds Issued:</td>
                    <td className="p-2 text-right">Rs. {totalRefundedValue.toFixed(2)}</td>
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
