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
}

const ReportRow: React.FC<ReportRowProps> = ({ 
    label, value, isSubtle, isBold, isTotal, valueClassName 
}) => {
    const { t } = useLanguage();
    const translatedLabel = t(label as any);

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
  const totalIncome = (data.sales.totalRevenue || 0) + (data.sales.totalDiscount || 0);

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
          
          <div className="grid grid-cols-2 bg-gray-100 font-semibold text-black">
            <h2 className="p-3">{t('plStatementTitle')}</h2>
          </div>

          <div className="grid grid-cols-2">
            <div className="border-r">
                <ReportRow label="expensesTitle" value="" isBold />
                <ReportRow label="purchasesCost" value={data.purchases.totalCost} isSubtle />
                <ReportRow label="otherExpenses" value={data.expenses.otherExpenses} isSubtle />
                <ReportRow label="totalDiscountsGiven" value={data.sales.totalDiscount} isSubtle />
                <ReportRow label="totalExpenses" value={data.expenses.totalExpenses + data.sales.totalDiscount} isTotal isBold />
            </div>
            <div>
                <ReportRow label="incomeTitle" value="" isBold />
                <ReportRow label="salesRevenue" value={totalIncome} isSubtle />
                <ReportRow label="otherIncome" value={data.income.otherIncome} isSubtle />
                <div className="h-8"></div>
                <ReportRow label="totalIncome" value={totalIncome + data.income.otherIncome} isTotal isBold />
            </div>
          </div>
          
          <div className="grid grid-cols-2 p-3 rounded-b-lg bg-blue-50 border-t border-blue-200">
              <div className='flex flex-col justify-center'>
                  <p className="font-bold text-lg text-blue-800">{t('netProfitTitle')}</p>
                  <p className="text-xs text-gray-600">{t('netProfitDesc')}</p>
              </div>
              <p className="text-right font-bold text-2xl text-blue-800">
                Rs. {data.profit.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
          </div>
        </div>
      </div>
      
       <div className="border rounded-lg overflow-hidden mt-6">
        <div className="grid grid-cols-1">
            <div className="grid grid-cols-2 bg-gray-100 font-semibold text-black">
                <h2 className="p-3">{t('bsAndMetricsTitle')}</h2>
            </div>
             <div className="grid grid-cols-2">
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
