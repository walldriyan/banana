// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Separator } from '../ui/separator';

const ReportRow = ({ label, value, isSubtle = false, isBold = false, isHeader = false, isTotal = false, valueClassName = '' }: { 
    label: string, 
    value: string | number, 
    isSubtle?: boolean,
    isBold?: boolean,
    isHeader?: boolean,
    isTotal?: boolean,
    valueClassName?: string,
}) => (
    <>
        <div className={`py-2 px-3 ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader || isTotal ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''} ${isTotal ? 'border-t' : ''}`}>
            {label}
        </div>
        <div className={`py-2 px-3 text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader || isTotal ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''} ${isTotal ? 'border-t' : ''} ${valueClassName}`}>
            {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </div>
    </>
);


export function SummaryReport({ data }: SummaryReportProps) {
  const totalIncome = (data.sales.totalRevenue || 0) + (data.sales.totalDiscount || 0);

  return (
    <div className="report-container p-4 bg-white rounded-lg text-sm text-black">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Financial Summary Report</h1>
        <p className="text-xs text-gray-500">
            For the period of {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}
        </p>
      </header>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Main Grid for the report */}
        <div className="grid grid-cols-2">

          {/* === PROFIT & LOSS SECTION === */}
          <ReportRow isHeader label="PROFIT & LOSS STATEMENT" value="" />

          {/* Expenses Column */}
          <div className="border-r">
              <div className="grid grid-cols-2">
                <ReportRow isHeader label="Expenses" value="" />
                <ReportRow label="Cost of Purchases (GRN)" value={data.purchases.totalCost} isSubtle/>
                <ReportRow label="Other Operational Expenses" value={data.expenses.otherExpenses} isSubtle/>
                <ReportRow label="Total Discounts Given" value={data.sales.totalDiscount} isSubtle />
                <ReportRow label="Total Expenses" value={data.expenses.totalExpenses + data.sales.totalDiscount} isTotal />
              </div>
          </div>
          
          {/* Income Column */}
          <div>
              <div className="grid grid-cols-2">
                <ReportRow isHeader label="Income" value="" />
                <ReportRow label="Revenue from Sales" value={totalIncome} isSubtle />
                <ReportRow label="Other Income Sources" value={data.income.otherIncome} isSubtle/>
                <div className="col-span-2 h-6"></div> {/* Spacer to align totals */}
                <ReportRow label="Total Income" value={totalIncome + data.income.otherIncome} isTotal />
              </div>
          </div>
          
          {/* Net Profit Summary */}
          <div className="col-span-2 grid grid-cols-2 p-3 rounded-b-lg bg-blue-50 border-t border-blue-200">
              <div className='flex flex-col justify-center'>
                  <p className="font-bold text-lg text-blue-800">Net Profit</p>
                  <p className="text-xs text-gray-600">(Total Income - Total Expenses)</p>
              </div>
              <p className="text-right font-bold text-2xl text-blue-800">
                Rs. {data.profit.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
          </div>
          
           {/* === BALANCE SHEET & METRICS === */}
          <ReportRow isHeader label="BALANCE SHEET & METRICS" value="" />

          {/* Assets & Metrics Column */}
          <div className="border-r">
              <div className="grid grid-cols-2">
                <ReportRow isHeader label="Assets & Metrics" value="" />
                <ReportRow label="Debtors (From Customers)" value={data.balanceSheet.assets.debtors} />
                <ReportRow label="Total Transactions" value={data.sales.totalTransactions} />
                <ReportRow label="Gross Profit" value={data.profit.grossProfit} isTotal valueClassName="text-green-700"/>
              </div>
          </div>
          
          {/* Liabilities & Metrics Column */}
          <div>
              <div className="grid grid-cols-2">
                <ReportRow isHeader label="Liabilities & Metrics" value="" />
                <ReportRow label="Creditors (To Suppliers)" value={data.balanceSheet.liabilities.creditors} />
                <ReportRow label="Total GRNs" value={data.purchases.totalGrns} />
                 <ReportRow label="Total Discounts" value={data.sales.totalDiscount} isTotal valueClassName="text-red-700"/>
              </div>
          </div>
        </div>
      </div>

      <footer className="text-center mt-8 pt-4 border-t">
        <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleString()}</p>
        <p className="text-xs text-gray-500">This is a computer-generated report.</p>
      </footer>
    </div>
  );
}
