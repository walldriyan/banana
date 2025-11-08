// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Separator } from '../ui/separator';
import { useLanguage } from '@/context/LanguageContext';

interface ReportRowProps {
    label: string;
    value: string | number;
    isSubtle?: boolean;
    isBold?: boolean;
    isTotal?: boolean;
    valueClassName?: string;
    isHeader?: boolean;
}

const ReportRow: React.FC<ReportRowProps> = ({ 
    label, value, isSubtle, isBold, isTotal, valueClassName, isHeader
}) => {
    const { t } = useLanguage();
    const translatedLabel = t(label as any);

    if (isHeader) {
        return (
            <h2 className="p-3 bg-gray-100 font-semibold text-black text-base col-span-2">{translatedLabel}</h2>
        )
    }

    return (
        <div className={`grid grid-cols-2 gap-4 py-2 px-3 ${isTotal ? 'border-t' : ''}`}>
            <div className={`flex items-center ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold ? 'font-semibold' : ''}`}>
                {isSubtle && <span className="mr-4">–</span>}
                {translatedLabel}
            </div>
            <div className={`text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold ? 'font-semibold' : ''} ${valueClassName}`}>
                {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
            </div>
        </div>
    );
};

interface SummaryReportProps {
  data: SummaryReportData;
}

export function SummaryReport({ data }: SummaryReportProps) {
  const { t, language } = useLanguage();
  
  const totalRevenueWithDiscounts = (data.sales.totalRevenue || 0) + (data.sales.totalDiscount || 0);
  const totalExpenses = (data.purchases.totalCost || 0) + (data.expenses.otherExpenses || 0) + (data.sales.totalDiscount || 0);
  const totalIncome = totalRevenueWithDiscounts + (data.income.otherIncome || 0);

  return (
    <div className="report-container p-4 bg-white rounded-lg text-sm text-black">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">{t('reportTitle')}</h1>
        <p className="text-xs text-gray-500">
          {t('reportPeriodTitle')} {new Date(data.dateRange.from).toLocaleDateString(language)} {t('reportToTitle')} {new Date(data.dateRange.to).toLocaleDateString(language)}
        </p>
      </header>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-1">
          
          <ReportRow label="plStatementTitle" value="" isHeader />

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-r">
                <ReportRow label="expensesTitle" value="" isBold />
                <ReportRow label="purchasesCost" value={data.purchases.totalCost} isSubtle />
                <ReportRow label="otherExpenses" value={data.expenses.otherExpenses} isSubtle />
                <ReportRow label="totalDiscountsGiven" value={data.sales.totalDiscount} isSubtle />
                <ReportRow label="totalExpenses" value={totalExpenses} isTotal isBold />
            </div>
            <div>
                <ReportRow label="incomeTitle" value="" isBold />
                <ReportRow label="salesRevenue" value={totalRevenueWithDiscounts} isSubtle />
                <ReportRow label="otherIncome" value={data.income.otherIncome} isSubtle />
                 {/* This spacer div ensures the "Total Income" aligns with "Total Expenses" if there are more expense lines */}
                 <div className="py-2 px-3 h-[44px]"></div>
                <ReportRow label="totalIncome" value={totalIncome} isTotal isBold />
            </div>
          </div>
          
            <div className="col-span-2 border-t bg-blue-50 p-4 space-y-2">
                <h3 className="font-bold text-base text-center text-blue-800">{t('netProfitTitle')}</h3>
                 <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">{t('totalIncome')}</span>
                    <span className="font-semibold">{`Rs. ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
                <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">{`(-) ${t('totalExpenses')}`}</span>
                    <span className="font-semibold">{`Rs. ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-lg font-bold text-blue-800">
                    <span>{`(=) ${t('netProfitTitle')}`}</span>
                    <span>{`Rs. ${data.profit.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
            </div>
        </div>
      </div>
      
       <div className="border rounded-lg overflow-hidden mt-6">
        <div className="grid grid-cols-1">
             <ReportRow label="bsAndMetricsTitle" value="" isHeader />
             <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-r">
                    <ReportRow label="assetsAndMetricsTitle" value="" isBold />
                    <ReportRow label="debtors" value={data.balanceSheet.assets.debtors} isSubtle />
                    <ReportRow label="totalTransactions" value={data.sales.totalTransactions.toLocaleString()} isSubtle />
                    <ReportRow label="grossProfit" value={data.profit.grossProfit} isTotal isBold valueClassName="text-green-700" />
                </div>
                <div>
                    <ReportRow label="liabilitiesAndMetricsTitle" value="" isBold />
                    <ReportRow label="creditors" value={data.balanceSheet.liabilities.creditors} isSubtle />
                    <ReportRow label="totalGrns" value={data.purchases.totalGrns.toLocaleString()} isSubtle />
                    <ReportRow label="totalDiscounts" value={data.sales.totalDiscount} isTotal isBold valueClassName="text-red-700" />
                </div>
            </div>
        </div>
      </div>

      <footer className="text-center mt-8 pt-4 border-t">
        <p className="text-xs text-gray-500">{t('generatedOn')} {new Date().toLocaleString(language)}</p>
        <p className="text-xs text-gray-500">{t('computerGeneratedReport')}</p>
      </footer>
    </div>
  );
}
