// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';

interface SummaryReportProps {
  data: SummaryReportData;
}

const DetailRow = ({ label, value, className = '' }: { label: string, value: string | number, className?: string }) => (
    <div className={`flex-between py-2 border-b border-dashed ${className}`}>
        <p className="text-sm">{label}</p>
        <p className="text-sm font-bold">{typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</p>
    </div>
);

export function SummaryReport({ data }: SummaryReportProps) {
  return (
    <div className="thermal-receipt-container">
      <header className="text-center mb-4">
        <h1>Financial Summary Report</h1>
        <p>
            {new Date(data.dateRange.from).toLocaleDateString()} - {new Date(data.dateRange.to).toLocaleDateString()}
        </p>
      </header>

      <section>
        <h2>Overall Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Net Profit" value={data.profit.netProfit} className="text-blue-600 font-bold text-lg" />
            <DetailRow label="Gross Profit (Sales - Purchases)" value={data.profit.grossProfit} className="font-semibold"/>
        </div>
      </section>

      <section>
        <h2>Income Details</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Total Income (Sales + Other)" value={data.income.totalIncome} className="text-green-600 font-bold" />
            <DetailRow label="From Sales" value={data.income.salesIncome} />
            <DetailRow label="Other Income" value={data.income.otherIncome} />
        </div>
      </section>

      <section>
        <h2>Expense Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Total Expenses (Purchases + Other)" value={data.expenses.totalExpenses} className="text-red-600 font-bold" />
            <DetailRow label="From Purchases (GRN)" value={data.expenses.purchaseExpenses} />
            <DetailRow label="Other Expenses" value={data.expenses.otherExpenses} />
        </div>
      </section>

      <section>
        <h2>Sales Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Total Sales Revenue" value={data.sales.totalRevenue} />
            <DetailRow label="Number of Transactions" value={data.sales.totalTransactions} />
            <DetailRow label="Total Discounts Given" value={data.sales.totalDiscount} />
        </div>
      </section>
      
      <section>
        <h2>Purchase Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Total Purchase Cost" value={data.purchases.totalCost} />
            <DetailRow label="Number of GRNs" value={data.purchases.totalGrns} />
        </div>
      </section>

      <footer className="text-center mt-6 text-xs text-gray-500">
        <p>Generated on: {new Date().toLocaleString()}</p>
        <p>This is a computer-generated report.</p>
      </footer>
    </div>
  );
}
