// src/components/reports/CreditorsReport.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { GoodsReceivedNote, Supplier } from '@prisma/client';
import { format } from 'date-fns';

type CreditorGrn = GoodsReceivedNote & { supplier: Supplier; totalPaid: number; };

interface CreditorsReportProps {
  data: CreditorGrn[];
}

export const CreditorsReport: React.FC<CreditorsReportProps> = ({ data }) => {
  const { t, language } = useLanguage();
  const totalOutstanding = data.reduce((sum, grn) => sum + (grn.totalAmount - grn.totalPaid), 0);
  
  return (
    <div className="report-container p-4 bg-white text-sm text-black">
        <header className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Creditors Report (Outstanding GRNs)</h1>
            <p className="text-xs text-gray-500">
            As of {new Date().toLocaleString(language)}
            </p>
        </header>

        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-gray-100">
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">GRN Date</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">GRN No.</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Supplier</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Amount</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Paid</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Balance Due</th>
            </tr>
            </thead>
            <tbody>
            {data.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50">
                    <td className="p-2 border-b border-gray-200">{format(new Date(grn.grnDate), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b border-gray-200">{grn.grnNumber}</td>
                    <td className="p-2 border-b border-gray-200">{grn.supplier.name}</td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {grn.totalAmount.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {grn.totalPaid.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right font-semibold">Rs. {(grn.totalAmount - grn.totalPaid).toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
             <tfoot>
                <tr className="bg-gray-100 font-bold">
                    <td colSpan={5} className="p-2 text-right">Total Outstanding Debt to Suppliers:</td>
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
