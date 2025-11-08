// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Separator } from '../ui/separator';

interface SummaryReportProps {
  data: SummaryReportData;
}

const ReportRow = ({ label, value, isSubtle = false, isBold = false, isHeader = false, isTotal = false }: { 
    label: string, 
    value: string | number, 
    isSubtle?: boolean,
    isBold?: boolean,
    isHeader?: boolean,
    isTotal?: boolean
}) => (
    <>
        <div className={`py-2 px-3 ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader || isTotal ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''} ${isTotal ? 'border-t border-b' : ''}`}>
            {label}
        </div>
        <div className={`py-2 px-3 text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader || isTotal ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''} ${isTotal ? 'border-t border-b' : ''}`}>
            {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </div>
    </>
);


export function SummaryReport({ data }: SummaryReportProps) {
  return (
    <div className="report-container p-4 bg-white rounded-lg text-sm text-black">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Financial Summary Report</h1>
        <p className="text-xs text-gray-500">
            For the period of {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}
        </p>
      </header>
      
      {/* Profit & Loss Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-center text-gray-700 mb-2 p-2 bg-gray-100 border-y">Profit & Loss Statement</h2>
        <div className="grid grid-cols-2 border-l border-r border-b rounded-lg overflow-hidden">
            {/* Left Column: Expenses */}
            <div className="border-r">
                <div className="bg-gray-50 p-2 font-bold text-center text-gray-600">Expenses</div>
                <div className="grid grid-cols-2">
                    <ReportRow label="Cost of Purchases (GRN)" value={data.purchases.totalCost} isSubtle/>
                    <ReportRow label="Other Operational Expenses" value={data.expenses.otherExpenses} isSubtle/>
                    <ReportRow label="Total Discounts Given" value={data.sales.totalDiscount} isSubtle/>
                </div>
                 <div className="grid grid-cols-2 border-t font-semibold bg-gray-50">
                    <ReportRow label="Total Expenses" value={data.expenses.totalExpenses + data.sales.totalDiscount} isBold/>
                 </div>
            </div>
            
            {/* Right Column: Income */}
            <div>
                <div className="bg-gray-50 p-2 font-bold text-center text-gray-600">Income</div>
                <div className="grid grid-cols-2">
                    <ReportRow label="Revenue from Sales" value={data.sales.totalRevenue + data.sales.totalDiscount} isSubtle />
                    <ReportRow label="Other Income Sources" value={data.income.otherIncome} isSubtle/>
                </div>
                <div className="grid grid-cols-2 border-t font-semibold bg-gray-50">
                    <ReportRow label="Total Income" value={data.income.totalIncome + data.sales.totalDiscount} isBold/>
                </div>
            </div>
        </div>
        
        {/* Net Profit Summary */}
        <div className="grid grid-cols-2 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className='flex flex-col justify-center'>
                <p className="font-bold text-lg text-blue-800">Net Profit</p>
                 <p className="text-xs text-gray-600">(Total Income - Total Expenses)</p>
            </div>
            <p className="text-right font-bold text-2xl text-blue-800">
                Rs. {data.profit.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
      </section>

       {/* Balance Sheet Summary Section */}
       <section className="mb-8">
        <h2 className="text-lg font-bold text-center text-gray-700 mb-2 p-2 bg-gray-100 border-y">Balance Sheet Summary</h2>
         <div className="grid grid-cols-2 border-l border-r border-b rounded-lg overflow-hidden">
            {/* Assets */}
            <div className="border-r">
                <div className="bg-green-50 p-2 font-bold text-center text-green-800">Assets (Receivables)</div>
                <div className="grid grid-cols-2">
                    <ReportRow label="Debtors (From Customers)" value={data.balanceSheet.assets.debtors} />
                </div>
            </div>
            {/* Liabilities */}
            <div>
                <div className="bg-red-50 p-2 font-bold text-center text-red-800">Liabilities (Payables)</div>
                <div className="grid grid-cols-2">
                     <ReportRow label="Creditors (To Suppliers)" value={data.balanceSheet.liabilities.creditors} />
                </div>
            </div>
        </div>
      </section>
      
      {/* Other Metrics */}
      <section>
          <h2 className="text-lg font-bold text-center text-gray-700 mb-2 p-2 bg-gray-100 border-y">Operational Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Transactions</p>
                  <p className="text-xl font-bold">{data.sales.totalTransactions}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total GRNs</p>
                  <p className="text-xl font-bold">{data.purchases.totalGrns}</p>
              </div>
               <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Discounts</p>
                  <p className="text-xl font-bold">Rs. {data.sales.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
               <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Gross Profit</p>
                  <p className="text-xl font-bold">Rs. {data.profit.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
          </div>
      </section>

      <footer className="text-center mt-8 pt-4 border-t">
        <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleString()}</p>
        <p className="text-xs text-gray-500">This is a computer-generated report.</p>
      </footer>
    </div>
  );
}
