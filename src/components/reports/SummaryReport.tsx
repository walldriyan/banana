// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Separator } from '../ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from "@/lib/utils";


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

const ReportSubHeader: React.FC<{ label: string, className?: string }> = ({ label, className }) => {
    const { t } = useLanguage();
    return (
        <h3 className={cn("font-semibold text-black mt-4 border-b pb-1 mb-1", className)}>
            {t(label as any)}
        </h3>
    )
}

const ReportRow: React.FC<ReportRowProps> = ({ 
    label, value, isSubtle, isBold, isTotal, valueClassName, isHeader, className
}) => {
    const { t } = useLanguage();
    const translatedLabel = t(label as any);

    if (isHeader) {
        return (
            <h2 className={`p-3 bg-gray-100 font-semibold text-black text-base col-span-4 ${className}`}>{translatedLabel}</h2>
        )
    }

    return (
        <>
            <div className={`flex items-center ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold ? 'font-semibold' : ''} ${className}`}>
                {isSubtle && <span className="mr-4">–</span>}
                {translatedLabel}
            </div>
            <div className={`text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold ? 'font-semibold' : ''} ${valueClassName} ${className}`}>
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
  
  const expenseItems = [
    { label: 'purchasesCost', value: data.purchases.totalCost },
    { label: 'otherExpenses', value: data.expenses.otherExpenses },
    { label: 'totalDiscountsGiven', value: data.sales.totalDiscount },
    { label: 'lostAndDamageValue', value: data.inventory.lostAndDamageValue },
    { label: 'totalRefundsIssued', value: data.sales.totalRefunds },
  ];

  const incomeItems = [
      { label: 'salesRevenue', value: data.income.salesIncome },
      { label: 'otherIncome', value: data.income.otherIncome },
  ];
  
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.value, 0);
  const netProfit = totalIncome - totalExpenses;

  const liabilitiesItems = [
    { label: 'creditors', value: data.balanceSheet.liabilities.creditors, isBold: true, valueClassName: 'text-orange-600' },
    { label: 'todaysCreditorPayments', value: data.balanceSheet.liabilities.todaysCreditorPayments, isSubtle: true, valueClassName: 'text-green-600' },
    { label: 'totalGrns', value: data.purchases.totalGrns, isSubtle: true },
  ];

  const assetsItems = [
      { label: 'debtors', value: data.balanceSheet.assets.debtors, isBold: true, valueClassName: 'text-red-600' },
      { label: 'todaysDebtorPayments', value: data.balanceSheet.assets.todaysDebtorPayments, isSubtle: true, valueClassName: 'text-green-600' },
      { label: 'grossProfit', value: data.profit.grossProfit, isSubtle: true },
      { label: 'totalTransactions', value: data.sales.totalTransactions, isSubtle: true },
  ];


  return (
    <div className="report-container p-4 bg-white text-sm text-black space-y-6">
      <header className="text-center">
        <h1 className="text-xl font-bold text-gray-800">{t('reportTitle')}</h1>
        <p className="text-xs text-gray-500">
          {t('reportPeriodTitle')} {new Date(data.dateRange.from).toLocaleDateString(language)} {t('reportToTitle')} {new Date(data.dateRange.to).toLocaleDateString(language)}
        </p>
      </header>
      
      <div className="border border-gray-300 overflow-hidden">
        {/* Profit & Loss Section */}
        <ReportRow label="plStatementTitle" value="" isHeader />
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 p-3">
          {/* Column Headers */}
          <div className="font-semibold text-black col-span-2">{t('expensesTitle')}</div>
          <div className="font-semibold text-black col-span-2">{t('incomeTitle')}</div>
          
          {/* P&L Items */}
          {Array.from({ length: Math.max(expenseItems.length, incomeItems.length) }).map((_, index) => (
             <React.Fragment key={`pl-row-${index}`}>
                {expenseItems[index] ? <ReportRow {...expenseItems[index]} isSubtle /> : <><div/><div/></>}
                {incomeItems[index] ? <ReportRow {...incomeItems[index]} isSubtle /> : <><div/><div/></>}
            </React.Fragment>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 px-3 pt-2 mt-2 border-t border-gray-200">
          <ReportRow label="totalExpenses" value={totalExpenses} isTotal isBold />
          <ReportRow label="totalIncome" value={totalIncome} isTotal isBold />
        </div>
        
        {/* Balance Sheet & Metrics Section */}
        <ReportRow label="bsAndMetricsTitle" value="" isHeader className="mt-0" />
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-4 p-3">
            {/* Headers */}
            <ReportSubHeader label="liabilitiesAndMetricsTitle" className="col-span-2" />
            <ReportSubHeader label="assetsAndMetricsTitle" className="col-span-2" />
            
             {/* Data Rows */}
            {Array.from({ length: Math.max(liabilitiesItems.length, assetsItems.length) }).map((_, index) => (
                <React.Fragment key={`bs-row-${index}`}>
                    {liabilitiesItems[index] ? <ReportRow {...liabilitiesItems[index]} /> : <><div /><div /></>}
                    {assetsItems[index] ? <ReportRow {...assetsItems[index]} /> : <><div /><div /></>}
                </React.Fragment>
            ))}
        </div>
      </div>

       {/* Net Profit Section */}
        <div className="col-span-4 bg-blue-50 p-4 space-y-2 mt-2">
            <h3 className="font-bold text-base text-center text-blue-800">{t('netProfitTitle')}</h3>
              <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600">{t('totalIncome')}</span>
                  <span className="font-semibold">{`Rs. ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600">{`(-) ${t('totalExpenses')}`}</span>
                  <span className="font-semibold">{`Rs. ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
              <Separator className="my-2 bg-gray-300" />
              <div className="flex justify-between items-center text-lg font-bold text-blue-800">
                  <span>{`(=) ${t('netProfitTitle')}`}</span>
                  <span>{`Rs. ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
        </div>


      <footer className="text-center mt-8 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-500">{t('generatedOn')} {new Date().toLocaleString(language)}</p>
        <p className="text-xs text-gray-500">{t('computerGeneratedReport')}</p>
      </footer>
    </div>
  );
}
