// src/components/reports/StockReport.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { Product, ProductBatch } from '@prisma/client';
import { format } from 'date-fns';

type ProductBatchWithProduct = ProductBatch & { product: Product };

interface StockReportProps {
  data: ProductBatchWithProduct[];
}

export const StockReport: React.FC<StockReportProps> = ({ data }) => {
  const { t, language } = useLanguage();
  const totalStockValue = data.reduce((sum, batch) => sum + (batch.stock * batch.sellingPrice), 0);

  return (
    <div className="report-container p-4 bg-white text-sm text-black">
        <header className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Stock Report</h1>
            <p className="text-xs text-gray-500">
            As of {new Date().toLocaleString(language)}
            </p>
        </header>

        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-gray-100">
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Product Name</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black">Batch No.</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Stock Qty</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Selling Price</th>
                <th className="p-2 border-b-2 border-gray-300 font-semibold text-black text-right">Stock Value</th>
            </tr>
            </thead>
            <tbody>
            {data.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                <td className="p-2 border-b border-gray-200">{batch.product.name}</td>
                <td className="p-2 border-b border-gray-200">{batch.batchNumber}</td>
                <td className="p-2 border-b border-gray-200 text-right">{batch.stock}</td>
                <td className="p-2 border-b border-gray-200 text-right">Rs. {batch.sellingPrice.toFixed(2)}</td>
                <td className="p-2 border-b border-gray-200 text-right">Rs. {(batch.stock * batch.sellingPrice).toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
            <tfoot>
                <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 text-right">Total Stock Value:</td>
                    <td className="p-2 text-right">Rs. {totalStockValue.toFixed(2)}</td>
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
