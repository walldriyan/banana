// src/app/dashboard/purchases/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { GrnWithRelations } from "./PurchasesClientPage";
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { format } from "date-fns";

interface CellActionsProps {
  grn: GrnWithRelations;
  onEdit: (grn: GrnWithRelations) => void;
  onDelete: (grnId: string) => void;
}

const CellActions = ({ grn, onEdit, onDelete }: CellActionsProps) => {
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(grn.id)}>
                    Copy GRN ID
                </DropdownMenuItem>
                 <AuthorizationGuard permissionKey="purchases.update">
                    <DropdownMenuItem onClick={() => onEdit(grn)}>
                      Edit
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="purchases.delete">
                    <DropdownMenuItem onClick={() => onDelete(grn.id)} className="text-red-500">
                        Delete
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (grn: GrnWithRelations) => void,
  onDelete: (grnId: string) => void
): ColumnDef<GrnWithRelations>[] => [
    {
        accessorKey: "grnNumber",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              GRN Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("grnNumber")}</div>
    },
    {
        accessorKey: "grnDate",
        header: "Date",
        cell: ({ row }) => format(new Date(row.getValue("grnDate")), "PPP")
    },
    {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => row.original.supplier.name,
    },
    {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "Payment Status",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions grn={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
