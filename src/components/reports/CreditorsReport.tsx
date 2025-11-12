// src/components/reports/CreditorsReport.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { GoodsReceivedNote, Supplier, GoodsReceivedNoteItem, ProductBatch, Product, PurchasePayment } from '@prisma/client';
import { format } from 'date-fns';

type GrnItemWithRelations = GoodsReceivedNoteItem & {
    productBatch: (ProductBatch & { product: Product }) | null;
}

type CreditorGrn = GoodsReceivedNote & { 
    supplier: Supplier; 
    totalPaid: number; 
    items: GrnItemWithRelations[];
    payments: PurchasePayment[];
};

interface CreditorsReportProps {
  data: {
    creditors: CreditorGrn[];
    dateRange?: { from: Date, to: Date }
  };
}

const SubTable = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mt-2 pl-4">
        <h4 className="font-semibold text-xs text-gray-600">{title}</h4>
        <table className="w-full text-xs mt-1">
            {children}
        </table>
    </div>
);


export const CreditorsReport: React.FC<CreditorsReportProps> = ({ data }) => {
  const { creditors, dateRange } = data;
  const { t, language } = useLanguage();
  const totalOutstanding = creditors.reduce((sum, grn) => sum + (grn.totalAmount - grn.totalPaid), 0);
  
  return (
    <div className="report-container p-4 bg-white text-sm text-black">
        <header className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Creditors Report (Outstanding GRNs)</h1>
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
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">GRN Date</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">GRN No. & Supplier</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Amount</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Total Paid</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Balance Due</th>
            </tr>
            </thead>
            <tbody>
            {creditors.map((grn) => (
              <React.Fragment key={grn.id}>
                <tr className="hover:bg-gray-50 border-t-2 border-gray-400">
                    <td className="p-2 border-b border-gray-200">{format(new Date(grn.grnDate), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b border-gray-200">
                        <div className="font-semibold">{grn.supplier.name}</div>
                        <div className="text-xs text-gray-500">{grn.grnNumber}</div>
                    </td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {grn.totalAmount.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right">Rs. {grn.totalPaid.toFixed(2)}</td>
                    <td className="p-2 border-b border-gray-200 text-right font-bold text-red-600">Rs. {(grn.totalAmount - grn.totalPaid).toFixed(2)}</td>
                </tr>
                 <tr>
                    <td colSpan={5} className="p-2 border-b border-gray-300 bg-gray-50">
                        <SubTable title="Received Items">
                            <thead>
                                <tr className="text-gray-500">
                                    <th className="text-left font-medium">Product</th>
                                    <th className="text-right font-medium">Qty</th>
                                    <th className="text-right font-medium">Cost Price</th>
                                    <th className="text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                            {grn.items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.productBatch?.product.name ?? 'Unknown Product'}</td>
                                    <td className="text-right">{item.quantity.toString()}</td>
                                    <td className="text-right">{item.costPrice.toFixed(2)}</td>
                                    <td className="text-right">{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </SubTable>
                        {grn.payments.length > 0 && (
                            <SubTable title="Payment History">
                                <thead>
                                    <tr className="text-gray-500">
                                        <th className="text-left font-medium">Date</th>
                                        <th className="text-left font-medium">Method</th>
                                        <th className="text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {grn.payments.map(p => (
                                    <tr key={p.id}>
                                        <td>{format(new Date(p.paymentDate), 'yyyy-MM-dd')}</td>
                                        <td className="capitalize">{p.paymentMethod}</td>
                                        <td className="text-right">{p.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </SubTable>
                        )}
                    </td>
                </tr>
              </React.Fragment>
            ))}
            </tbody>
             <tfoot>
                <tr className="bg-gray-200 font-bold">
                    <td colSpan={4} className="p-2 text-right">Total Outstanding Debt to Suppliers:</td>
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
