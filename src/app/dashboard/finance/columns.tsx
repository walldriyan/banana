// src/app/dashboard/finance/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { FinancialTransaction, Company, Customer, Supplier } from "@prisma/client"
import { MoreHorizontal, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type TransactionWithRelations = FinancialTransaction & {
    company: Company | null;
    customer: Customer | null;
    supplier: Supplier | null;
};

interface CellActionsProps {
  transaction: TransactionWithRelations;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (transactionId: string) => void;
}

const CellActions = ({ transaction, onEdit, onDelete }: CellActionsProps) => {
    return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <AuthorizationGuard permissionKey="finance.manage">
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(transaction.id)} className="text-red-500">Delete</DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (transaction: TransactionWithRelations) => void,
  onDelete: (transactionId: string) => void
): ColumnDef<TransactionWithRelations>[] => [
    {
        accessorKey: "date",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.getValue("date")), "PPP")
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const type = row.getValue("type") as string;
            const isIncome = type === 'INCOME';
            return <Badge variant={isIncome ? "secondary" : "destructive"} className={isIncome ? 'text-green-700' : 'text-red-700'}>
                {isIncome ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {type}
            </Badge>
        }
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "LKR" }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "company.name",
        header: "Company",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions transaction={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
