// src/lib/actions/report.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { Prisma } from "@prisma/client";
import { serializeDecimals } from "@/lib/utils/serialize";


interface DateRange {
    from: Date;
    to: Date;
}

export interface SummaryReportData {
    dateRange: { from: string; to: string };
    sales: {
        totalRevenue: number;
        totalTransactions: number;
        totalDiscount: number;
        totalRefunds: number; // New field
    };
    purchases: {
        totalCost: number;
        totalGrns: number;
    };
    inventory: { // New section
        lostAndDamageValue: number;
    };
    income: {
        totalIncome: number;
        salesIncome: number;
        otherIncome: number;
    };
    expenses: {
        totalExpenses: number;
        purchaseExpenses: number;
        otherExpenses: number;
    };
    profit: {
        netProfit: number;
        grossProfit: number;
    };
    balanceSheet: {
        assets: {
            debtors: number; // Money owed by customers
            todaysDebtorPayments: number; // Collections received today for any debt
        };
        liabilities: {
            creditors: number; // Money owed to suppliers
            todaysCreditorPayments: number; // Payments made today for any debt
        };
    };
    cashFlow: { // New Section
        cashSales: number;
        cashOtherIncome: number;
        todaysDebtorCashPayments: number;
        cashPurchases: number;
        cashOtherExpenses: number;
        todaysCreditorCashPayments: number;
        cashInDrawer: number;
    };
}


export async function getSummaryReportDataAction(dateRange: DateRange): Promise<{ success: boolean; data?: SummaryReportData; error?: string }> {
    try {
        const { from, to } = dateRange;

        const adjustedFrom = startOfDay(from);
        const adjustedTo = endOfDay(to);

        // --- P&L Calculations (Period Specific) ---
        const [
            salesData,
            purchaseData,
            financialTxData,
            lostAndDamageData,
            refundData,
        ] = await Promise.all([
            // P&L: Sales within the date range
            prisma.transaction.findMany({
                where: {
                    status: 'completed',
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                include: { payment: true }
            }),
            // P&L: Purchases within the date range
            prisma.goodsReceivedNote.aggregate({
                where: { grnDate: { gte: adjustedFrom, lte: adjustedTo } },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            // P&L: Other Income/Expenses within the date range
            prisma.financialTransaction.findMany({
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
            }),
            // P&L: Lost & Damage within the date range
            prisma.lostAndDamage.findMany({
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
                include: { productBatch: { select: { costPrice: true } } }
            }),
            // P&L: Refunds within the date range
            prisma.transaction.findMany({
                where: {
                    status: 'refund',
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                include: {
                    originalTransaction: {
                        select: { finalTotal: true }
                    }
                }
            }),
        ]);

        // --- Balance Sheet Calculations (As of Now) ---
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const [
            debtorsData,
            creditorsData,
            todaysDebtorPayments,
            todaysCreditorPayments,
        ] = await Promise.all([
            // Balance Sheet: All outstanding debtor transactions
            prisma.transaction.findMany({
                where: { paymentStatus: { in: ['pending', 'partial'] } },
                select: { finalTotal: true, salePayments: { select: { amount: true } } }
            }),
            // Balance Sheet: All outstanding creditor GRNs
            prisma.goodsReceivedNote.findMany({
                where: { paymentStatus: { in: ['pending', 'partial'] } },
                select: { totalAmount: true, payments: { select: { amount: true } } }
            }),
            // Balance Sheet: Debtor payments received today
            prisma.salePayment.findMany({
                where: { paymentDate: { gte: todayStart, lte: todayEnd } }
            }),
            // Balance Sheet: Creditor payments made today
            prisma.purchasePayment.findMany({
                where: { paymentDate: { gte: todayStart, lte: todayEnd } }
            })
        ]);

        // --- Process Sales Data ---
        const grossSalesRevenue = salesData.reduce((sum, tx) => sum + Number(tx.finalTotal), 0);
        const totalDiscountsGiven = salesData.reduce((sum, tx) => sum + Number(tx.totalDiscountAmount), 0);
        const cashSales = salesData
            .filter(tx => tx.payment?.paymentMethod === 'cash')
            .reduce((sum, tx) => sum + Number(tx.payment!.paidAmount), 0); // Amount paid in cash

        // --- Process Other Financial Transactions ---
        const otherIncome = financialTxData
            .filter(tx => tx.type === 'INCOME')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const otherExpenses = financialTxData
            .filter(tx => tx.type === 'EXPENSE')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        // --- Process Purchase Data ---
        const totalPurchaseCost = Number(purchaseData._sum.totalAmount || 0);

        // --- Process Inventory & Refund Data ---
        const lostAndDamageValue = lostAndDamageData.reduce((sum, record) => {
            return sum + (Number(record.quantity) * Number(record.productBatch?.costPrice || 0));
        }, 0);

        const totalRefundsValue = refundData.reduce((sum, tx) => {
            const originalTotal = Number(tx.originalTransaction?.finalTotal || 0);
            const keptTotal = Number(tx.finalTotal);
            return sum + (originalTotal - keptTotal);
        }, 0);

        // --- P&L Summary ---
        const netSalesRevenue = grossSalesRevenue - totalRefundsValue;
        const grossProfit = netSalesRevenue - totalPurchaseCost; // This is a simplified GP
        const netProfit = grossProfit + otherIncome - otherExpenses - lostAndDamageValue;

        // --- Balance Sheet Summary ---
        const totalDebtorsValue = debtorsData.reduce((totalDue, tx) => {
            const totalPaidForTx = tx.salePayments.reduce((paidSum, p) => paidSum + Number(p.amount), 0);
            const dueForThisTx = Number(tx.finalTotal) - totalPaidForTx;
            return totalDue + dueForThisTx;
        }, 0);

        const totalCreditorsValue = creditorsData.reduce((totalDue, grn) => {
            const totalPaidForGrn = grn.payments.reduce((paidSum, p) => paidSum + Number(p.amount), 0);
            const dueForThisGrn = Number(grn.totalAmount) - totalPaidForGrn;
            return totalDue + dueForThisGrn;
        }, 0);

        const totalTodaysDebtorPayments = todaysDebtorPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalTodaysCreditorPayments = todaysCreditorPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        // --- Cash Flow Calculations (For Today Only) ---
        const cashOtherIncomeToday = financialTxData
            .filter(tx => tx.type === 'INCOME' && tx.date >= todayStart && tx.date <= todayEnd) // Assuming all 'other' are cash
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const cashOtherExpensesToday = financialTxData
            .filter(tx => tx.type === 'EXPENSE' && tx.date >= todayStart && tx.date <= todayEnd) // Assuming all 'other' are cash
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const todaysDebtorCashPayments = todaysDebtorPayments
            .filter(p => p.paymentMethod === 'cash')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const todaysCreditorCashPayments = todaysCreditorPayments
            .filter(p => p.paymentMethod === 'cash')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const cashIn = cashSales + cashOtherIncomeToday + todaysDebtorCashPayments;
        const cashOut = cashOtherExpensesToday + todaysCreditorCashPayments;
        const cashInDrawer = cashIn - cashOut;


        const reportData: SummaryReportData = {
            dateRange: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            sales: {
                totalRevenue: grossSalesRevenue,
                totalTransactions: salesData.length || 0,
                totalDiscount: totalDiscountsGiven,
                totalRefunds: totalRefundsValue,
            },
            purchases: {
                totalCost: totalPurchaseCost,
                totalGrns: purchaseData._count.id || 0,
            },
            inventory: {
                lostAndDamageValue: lostAndDamageValue,
            },
            income: {
                totalIncome: grossSalesRevenue + otherIncome,
                salesIncome: grossSalesRevenue,
                otherIncome: otherIncome,
            },
            expenses: {
                totalExpenses: totalPurchaseCost + otherExpenses + totalDiscountsGiven + lostAndDamageValue + totalRefundsValue,
                purchaseExpenses: totalPurchaseCost,
                otherExpenses: otherExpenses,
            },
            profit: {
                netProfit: netProfit,
                grossProfit: grossProfit,
            },
            balanceSheet: {
                assets: {
                    debtors: totalDebtorsValue,
                    todaysDebtorPayments: totalTodaysDebtorPayments,
                },
                liabilities: {
                    creditors: totalCreditorsValue,
                    todaysCreditorPayments: totalTodaysCreditorPayments,
                },
            },
            cashFlow: {
                cashSales,
                cashOtherIncome: cashOtherIncomeToday,
                todaysDebtorCashPayments,
                cashPurchases: 0, // Not tracked by payment method yet
                cashOtherExpenses: cashOtherExpensesToday,
                todaysCreditorCashPayments,
                cashInDrawer,
            }
        };

        return { success: true, data: reportData };

    } catch (error) {
        console.error('[getSummaryReportDataAction] Error:', error);
        return { success: false, error: 'Failed to generate summary report data.' };
    }
}


export async function getStockReportDataAction() {
    try {
        const batches = await prisma.productBatch.findMany({
            where: { stock: { gt: 0 } },
            include: { product: true },
            orderBy: [{ product: { name: 'asc' } }, { addedDate: 'desc' }],
        });

        // Convert Decimal `stock` to number for easier use in the report
        const serializedBatches = batches.map(batch => ({
            ...batch,
            stock: Number(batch.stock),
        }));

        return { success: true, data: { data: serializedBatches } };
    } catch (error) {
        console.error("Error fetching stock report data:", error);
        return { success: false, error: "Failed to fetch stock report data." };
    }
}

export async function getCreditorsReportDataAction(dateRange?: DateRange) {
    try {
        const where: Prisma.GoodsReceivedNoteWhereInput = {
            paymentStatus: { in: ['pending', 'partial'] }
        };
        if (dateRange?.from && dateRange?.to) {
            where.grnDate = {
                gte: startOfDay(dateRange.from),
                lte: endOfDay(dateRange.to),
            };
        }

        const creditorGrns = await prisma.goodsReceivedNote.findMany({
            where,
            include: {
                supplier: true,
                payments: true, // Include full payment details
                items: {
                    include: {
                        productBatch: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
            },
            orderBy: { grnDate: 'asc' },
        });

        const grnsWithPaidAmount = creditorGrns.map(grn => ({
            ...grn,
            totalPaid: grn.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        }));

        // Serialize Decimal fields to plain numbers
        const serializedCreditors = serializeDecimals(grnsWithPaidAmount);

        return { success: true, data: { creditors: serializedCreditors, dateRange } };
    } catch (error) {
        console.error('[getCreditorsReportDataAction] Error:', error);
        return { success: false, error: 'Failed to fetch creditors report data.' };
    }
}

export async function getDebtorsReportDataAction(dateRange?: DateRange) {
    try {
        const where: Prisma.TransactionWhereInput = {
            paymentStatus: { in: ['pending', 'partial'] }
        };
        if (dateRange?.from && dateRange?.to) {
            where.transactionDate = {
                gte: startOfDay(dateRange.from),
                lte: endOfDay(dateRange.to),
            };
        }

        const debtorTransactions = await prisma.transaction.findMany({
            where,
            include: {
                customer: true,
                salePayments: true, // Include full payment details
                lines: {
                    include: {
                        productBatch: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
            },
            orderBy: { transactionDate: 'asc' },
        });

        const transactionsWithPaidAmount = debtorTransactions.map(tx => ({
            ...tx,
            totalPaid: tx.salePayments.reduce((sum, p) => sum + Number(p.amount), 0),
            lines: tx.lines.map(line => ({
                ...line,
                productName: line.productBatch.product.name,
            })),
        }));

        // Serialize Decimal fields to plain numbers
        const serializedDebtors = serializeDecimals(transactionsWithPaidAmount);

        return { success: true, data: { debtors: serializedDebtors, dateRange } };
    } catch (error) {
        console.error('[getDebtorsReportDataAction] Error:', error);
        return { success: false, error: 'Failed to fetch debtors report data.' };
    }
}


export async function getTransactionsReportDataAction(dateRange?: DateRange) {
    try {
        const where: Prisma.TransactionWhereInput = {
            status: 'completed',
        };
        if (dateRange?.from && dateRange?.to) {
            where.transactionDate = {
                gte: startOfDay(dateRange.from),
                lte: endOfDay(dateRange.to),
            };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: { customer: true },
            orderBy: { transactionDate: 'desc' },
        });

        // Serialize Decimal fields to plain numbers
        const serializedTransactions = serializeDecimals(transactions);

        return { success: true, data: { transactions: serializedTransactions, dateRange } };
    } catch (error) {
        return { success: false, error: "Failed to fetch transactions report data." };
    }
}

export async function getRefundsReportDataAction(dateRange?: DateRange) {
    try {
        const where: Prisma.TransactionWhereInput = {
            status: 'refund',
        };
        if (dateRange?.from && dateRange?.to) {
            where.transactionDate = {
                gte: startOfDay(dateRange.from),
                lte: endOfDay(dateRange.to),
            };
        }

        const refunds = await prisma.transaction.findMany({
            where,
            include: {
                customer: true,
                originalTransaction: { select: { id: true, finalTotal: true } },
            },
            orderBy: { transactionDate: 'desc' },
        });

        // Serialize Decimal fields to plain numbers
        const serializedRefunds = serializeDecimals(refunds);

        return { success: true, data: { refunds: serializedRefunds, dateRange } };
    } catch (error) {
        return { success: false, error: "Failed to fetch refunds report data." };
    }
}
