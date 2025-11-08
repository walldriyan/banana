// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Separator } from '../ui/separator';

interface SummaryReportProps {
  data: SummaryReportData;
}

const ReportRow = ({ label, value, isSubtle = false, isBold = false, isHeader = false }: { 
    label: string, 
    value: string | number, 
    isSubtle?: boolean,
    isBold?: boolean,
    isHeader?: boolean
}) => (
    <>
        <div className={`py-2 px-3 ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''}`}>
            {label}
        </div>
        <div className={`py-2 px-3 text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isBold || isHeader ? 'font-semibold' : ''} ${isHeader ? 'bg-gray-100' : ''}`}>
            {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </div>
    </>
);


export function SummaryReport({ data }: SummaryReportProps) {
  return (
    <div className="report-container p-4 bg-white rounded-lg text-sm">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Financial Summary Report</h1>
        <p className="text-xs text-gray-500">
            For the period of {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}
        </p>
      </header>

      <div className="border rounded-lg overflow-hidden">
        {/* Main two-column layout */}
        <div className="grid grid-cols-2">
          {/* Left Column: Expenses & Costs */}
          <div className="border-r">
            <div className="bg-gray-100 p-2 font-bold text-center text-gray-700">Expenses & Costs</div>
            <div className="grid grid-cols-2">
                <ReportRow label="From Purchases (GRN)" value={data.purchases.totalCost} isSubtle />
                <ReportRow label="Other Expenses" value={data.expenses.otherExpenses} isSubtle />
            </div>
             <div className="grid grid-cols-2 border-t font-semibold">
                <ReportRow label="Total Expenses" value={data.expenses.totalExpenses} isBold/>
             </div>
          </div>
          
          {/* Right Column: Income & Revenue */}
          <div>
            <div className="bg-gray-100 p-2 font-bold text-center text-gray-700">Income & Revenue</div>
            <div className="grid grid-cols-2">
                <ReportRow label="From Sales (After Discounts)" value={data.sales.totalRevenue} isSubtle />
                <ReportRow label="Other Income Sources" value={data.income.otherIncome} isSubtle />
            </div>
             <div className="grid grid-cols-2 border-t font-semibold">
                 <ReportRow label="Total Income" value={data.income.totalIncome} isBold/>
             </div>
          </div>
        </div>
        
        {/* Footer section for Profit Summary */}
        <div className="border-t bg-gray-50">
             <div className="grid grid-cols-2 gap-x-4 p-3">
                 <div>
                    <p className="font-semibold">Gross Profit</p>
                    <p className="text-xs text-gray-500">(Sales Revenue - Purchase Costs)</p>
                 </div>
                 <p className="text-right font-semibold text-lg">
                    Rs. {data.profit.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>
             </div>
             <Separator />
             <div className="grid grid-cols-2 gap-x-4 p-4 bg-gray-100">
                 <div>
                    <p className="font-bold text-lg text-blue-700">Net Profit</p>
                    <p className="text-xs text-gray-500">(Gross Profit + Other Income - Other Expenses)</p>
                 </div>
                 <p className="text-right font-bold text-2xl text-blue-700">
                    Rs. {data.profit.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>
             </div>
        </div>

      </div>

      <footer className="text-center mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleString()}</p>
        <p className="text-xs text-gray-500">This is a computer-generated report.</p>
      </footer>
    </div>
  );
}
