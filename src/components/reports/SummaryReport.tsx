// src/components/reports/SummaryReport.tsx
import React from 'react';
import type { SummaryReportData } from '@/lib/actions/report.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface SummaryReportProps {
  data: SummaryReportData;
}

const DetailRow = ({ label, value, isSubtle = false, isHeader = false }: { 
    label: string, 
    value: string | number, 
    isSubtle?: boolean,
    isHeader?: boolean
}) => (
    <>
        <div className={`py-3 ${isSubtle ? 'text-gray-600' : 'text-black'} ${isHeader ? 'font-bold' : ''}`}>
            {label}
        </div>
        <div className={`py-3 text-right ${isSubtle ? 'text-gray-600' : 'text-black'} ${isHeader ? 'font-bold' : ''}`}>
            {typeof value === 'number' ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </div>
    </>
);

export function SummaryReport({ data }: SummaryReportProps) {
  return (
    <div className="report-container p-4 bg-white rounded-lg">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Summary Report</h1>
        <p className="text-sm text-gray-500">
            For the period of {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}
        </p>
      </header>

      <div className="space-y-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-x-4 border-t">
                    <DetailRow label="Gross Profit (Sales - Purchases)" value={data.profit.grossProfit} isSubtle />
                    <DetailRow label="Other Income" value={data.income.otherIncome} isSubtle />
                    <DetailRow label="Other Expenses" value={-data.expenses.otherExpenses} isSubtle />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 border-t-2 border-b-2 border-black font-bold text-lg">
                    <DetailRow label="Net Profit" value={data.profit.netProfit} isHeader />
                 </div>
            </CardContent>
        </Card>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Income & Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-x-4 border-t">
                    <DetailRow label="From Sales (After Discounts)" value={data.sales.totalRevenue} isSubtle />
                    <DetailRow label="Other Income Sources" value={data.income.otherIncome} isSubtle />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 border-t-2 border-b-2 border-black font-semibold">
                    <DetailRow label="Total Income" value={data.income.totalIncome} isHeader />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 border-t pt-2 mt-4">
                    <DetailRow label="Total Transactions" value={data.sales.totalTransactions} isSubtle />
                    <DetailRow label="Total Discounts Given" value={-data.sales.totalDiscount} isSubtle />
                 </div>
            </CardContent>
        </Card>
        
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Expenses & Costs</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-x-4 border-t">
                    <DetailRow label="From Purchases (GRN)" value={data.purchases.totalCost} isSubtle />
                    <DetailRow label="Other Expenses" value={data.expenses.otherExpenses} isSubtle />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 border-t-2 border-b-2 border-black font-semibold">
                    <DetailRow label="Total Expenses" value={data.expenses.totalExpenses} isHeader />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 border-t pt-2 mt-4">
                    <DetailRow label="Total GRNs" value={data.purchases.totalGrns} isSubtle />
                 </div>
            </CardContent>
        </Card>

      </div>

      <footer className="text-center mt-8 pt-4 border-t">
        <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleString()}</p>
        <p className="text-xs text-gray-500">This is a computer-generated report.</p>
      </footer>
    </div>
  );
}
