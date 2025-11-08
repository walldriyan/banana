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
    className?: string;
}

const ReportRow: React.FC<ReportRowProps> = ({ 
    label, value, isSubtle, isBold, isTotal, valueClassName, isHeader, className
}) => {
    const { t } = useLanguage();
    const translatedLabel = t(label as any);

    if (isHeader) {
        return (
            <h2 className={`p-3 bg-gray-100 dark:bg-gray-800 font-semibold text-black dark:text-white text-base col-span-2 ${className}`}>{translatedLabel}</h2>
        )
    }

    return (
        <>
            <div className={`flex items-center ${isSubtle ? 'text-gray-600 dark:text-gray-400' : 'text-black dark:text-white'} ${isBold ? 'font-semibold' : ''} ${className}`}>
                {isSubtle && <span className="mr-4">–</span>}
                {translatedLabel}
            </div>
            <div className={`text-right ${isSubtle ? 'text-gray-600 dark:text-gray-400' : 'text-black dark:text-white'} ${isBold ? 'font-semibold' : ''} ${valueClassName} ${className}`}>
                {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
            </div>
        </>
    );
};

interface SummaryReportProps {
  data: SummaryReportData;
}

export function SummaryReport({ data }: SummaryReportProps) {
  const { t, language } = useLanguage();
  
  const totalRevenueWithDiscounts = (data.sales.totalRevenue || 0) + (data.sales.totalDiscount || 0);
  
  const expenseItems = [
    { label: 'purchasesCost', value: data.purchases.totalCost },
    { label: 'otherExpenses', value: data.expenses.otherExpenses },
    { label: 'totalDiscountsGiven', value: data.sales.totalDiscount },
  ];

  const incomeItems = [
      { label: 'salesRevenue', value: totalRevenueWithDiscounts },
      { label: 'otherIncome', value: data.income.otherIncome },
  ];
  
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.value, 0);
  const netProfit = totalIncome - totalExpenses;

  const b_s_expenseItems = [
      { label: 'creditors', value: data.balanceSheet.liabilities.creditors},
      { label: 'totalGrns', value: data.purchases.totalGrns},
      { label: 'totalDiscounts', value: data.sales.totalDiscount},
  ];

  const b_s_incomeItems = [
      { label: 'debtors', value: data.balanceSheet.assets.debtors},
      { label: 'totalTransactions', value: data.sales.totalTransactions},
      { label: 'grossProfit', value: data.profit.grossProfit, className: 'text-green-700 dark:text-green-500' },
  ];
  
  const maxRows = Math.max(expenseItems.length, incomeItems.length);

  return (
    <div className="report-container p-4 bg-white dark:bg-gray-900 rounded-lg text-sm text-black dark:text-white">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('reportTitle')}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('reportPeriodTitle')} {new Date(data.dateRange.from).toLocaleDateString(language)} {t('reportToTitle')} {new Date(data.dateRange.to).toLocaleDateString(language)}
        </p>
      </header>
      
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Profit & Loss Section */}
        <ReportRow label="plStatementTitle" value="" isHeader />
        <div className="grid grid-cols-2 gap-x-4 p-3">
          <div className="font-semibold">{t('expensesTitle')}</div>
          <div className="font-semibold">{t('incomeTitle')}</div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 px-3">
          {Array.from({ length: maxRows }).map((_, index) => (
            <React.Fragment key={`pl-row-${index}`}>
              {expenseItems[index] ? <ReportRow {...expenseItems[index]} isSubtle /> : <><div /><div /></>}
              {incomeItems[index] ? <ReportRow {...incomeItems[index]} isSubtle /> : <><div /><div /></>}
            </React.Fragment>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 px-3 border-t dark:border-gray-700">
          <ReportRow label="totalExpenses" value={totalExpenses} isTotal isBold />
          <ReportRow label="totalIncome" value={totalIncome} isTotal isBold />
        </div>
        
        <div className="col-span-2 border-t dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-2">
            <h3 className="font-bold text-base text-center text-blue-800 dark:text-blue-300">{t('netProfitTitle')}</h3>
              <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600 dark:text-gray-400">{t('totalIncome')}</span>
                  <span className="font-semibold">{`Rs. ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600 dark:text-gray-400">{`(-) ${t('totalExpenses')}`}</span>
                  <span className="font-semibold">{`Rs. ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
              <Separator className="my-2 bg-gray-300 dark:bg-gray-600" />
              <div className="flex justify-between items-center text-lg font-bold text-blue-800 dark:text-blue-300">
                  <span>{`(=) ${t('netProfitTitle')}`}</span>
                  <span>{`Rs. ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
        </div>

        {/* Balance Sheet & Metrics Section */}
        <ReportRow label="bsAndMetricsTitle" value="" isHeader />
        <div className="grid grid-cols-2 gap-x-4 p-3">
          <div className="font-semibold">{t('liabilitiesAndMetricsTitle')}</div>
          <div className="font-semibold">{t('assetsAndMetricsTitle')}</div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 px-3">
           {Array.from({ length: Math.max(b_s_expenseItems.length, b_s_incomeItems.length) }).map((_, index) => (
            <React.Fragment key={`bs-row-${index}`}>
              {b_s_expenseItems[index] ? <ReportRow {...b_s_expenseItems[index]} isSubtle /> : <><div /><div /></>}
              {b_s_incomeItems[index] ? <ReportRow {...b_s_incomeItems[index]} isSubtle /> : <><div /><div /></>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <footer className="text-center mt-8 pt-4 border-t dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('generatedOn')} {new Date().toLocaleString(language)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('computerGeneratedReport')}</p>
      </footer>
    </div>
  );
}
