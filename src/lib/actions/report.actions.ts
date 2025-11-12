// src/lib/actions/report.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { Prisma } from "@prisma/client";


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
        };
        liabilities: {
            creditors: number; // Money owed to suppliers
        };
    };
}


export async function getSummaryReportDataAction(dateRange: DateRange): Promise<{ success: boolean; data?: SummaryReportData; error?: string }> {
    try {
        const { from, to } = dateRange;
        
        const adjustedFrom = startOfDay(from);
        const adjustedTo = endOfDay(to);

        const [
            salesData, 
            purchaseData, 
            financialTxData, 
            creditorsData,
            lostAndDamageData,
            refundData,
            debtorsCalculations, // New calculation for debtors
        ] = await Promise.all([
            // P&L: Sales within the date range
            prisma.transaction.aggregate({
                where: {
                    status: 'completed',
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                _sum: { finalTotal: true, totalDiscountAmount: true },
                _count: { id: true },
            }),
            // P&L: Purchases within the date range
            prisma.goodsReceivedNote.aggregate({
                where: { grnDate: { gte: adjustedFrom, lte: adjustedTo } },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            // P&L: Other Income/Expenses within the date range
            prisma.financialTransaction.groupBy({
                by: ['type'],
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
                _sum: { amount: true },
            }),
             // Balance Sheet: ALL outstanding GRNs (creditors)
            prisma.goodsReceivedNote.aggregate({
                where: {
                    paymentStatus: { in: ['pending', 'partial'] },
                },
                _sum: { totalAmount: true, paidAmount: true },
            }),
            // P&L: Lost & Damage within the date range
            prisma.lostAndDamage.findMany({
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
                include: { productBatch: { select: { costPrice: true }}}
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
            // Balance Sheet: Correctly calculate total debtors balance
            prisma.transaction.findMany({
                where: {
                    paymentStatus: { in: ['pending', 'partial'] }
                },
                include: {
                    salePayments: {
                        select: { amount: true }
                    }
                }
            })
        ]);
        
        const otherIncome = financialTxData.find(d => d.type === 'INCOME')?._sum.amount || 0;
        const otherExpenses = financialTxData.find(d => d.type === 'EXPENSE')?._sum.amount || 0;

        const grossSalesRevenue = salesData._sum.finalTotal || 0;
        const totalPurchaseCost = purchaseData._sum.totalAmount || 0;
        
        const lostAndDamageValue = lostAndDamageData.reduce((sum, record) => {
            return sum + (record.quantity * (record.productBatch?.costPrice || 0));
        }, 0);
        
        const totalRefundsValue = refundData.reduce((sum, tx) => {
            const originalTotal = tx.originalTransaction?.finalTotal || 0;
            const keptTotal = tx.finalTotal;
            return sum + (originalTotal - keptTotal);
        }, 0);

        const netSalesRevenue = grossSalesRevenue - totalRefundsValue;
        const grossProfit = netSalesRevenue - totalPurchaseCost;
        const totalDiscountsGiven = salesData._sum.totalDiscountAmount || 0;
        const netProfit = grossProfit + otherIncome - otherExpenses - lostAndDamageValue;
        
        // Accurate Balance Sheet Calculations
        const totalDebtorsValue = debtorsCalculations.reduce((totalDue, tx) => {
            const totalPaid = tx.salePayments.reduce((paidSum, p) => paidSum + p.amount, 0);
            const dueForThisTx = tx.finalTotal - totalPaid;
            return totalDue + dueForThisTx;
        }, 0);

        const totalCreditorsValue = (creditorsData._sum.totalAmount || 0) - (creditorsData._sum.paidAmount || 0);

        const reportData: SummaryReportData = {
            dateRange: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            sales: {
                totalRevenue: grossSalesRevenue,
                totalTransactions: salesData._count.id || 0,
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
                },
                liabilities: {
                    creditors: totalCreditorsValue,
                },
            },
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
            where: { stock: { gt: 0 }},
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
      totalPaid: grn.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return { success: true, data: { creditors: grnsWithPaidAmount, dateRange } };
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
      totalPaid: tx.salePayments.reduce((sum, p) => sum + p.amount, 0),
       lines: tx.lines.map(line => ({
          ...line,
          productName: line.productBatch.product.name,
      })),
    }));

    return { success: true, data: { debtors: transactionsWithPaidAmount, dateRange } };
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
        return { success: true, data: { transactions, dateRange } };
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
        return { success: true, data: { refunds, dateRange } };
    } catch (error) {
        return { success: false, error: "Failed to fetch refunds report data." };
    }
}
