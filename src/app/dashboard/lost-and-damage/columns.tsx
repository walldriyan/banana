// src/app/dashboard/lost-and-damage/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
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
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { LostAndDamageRecord } from "./LostDamageClientPage"

interface CellActionsProps {
  record: LostAndDamageRecord;
  onDelete: (recordId: string) => void;
}

const CellActions = ({ record, onDelete }: CellActionsProps) => {
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
                 <AuthorizationGuard permissionKey="products.delete">
                    <DropdownMenuItem onClick={() => onDelete(record.id)} className="text-red-500">
                        Delete Record
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onDelete: (recordId: string) => void
): ColumnDef<LostAndDamageRecord>[] => [
    {
        accessorKey: "date",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.getValue("date")), "PPP")
    },
    {
        id: "productName",
        accessorFn: (row) => row.productBatch.product.name,
        header: "Product Name",
        cell: ({ row }) => <div className="font-medium">{row.original.productBatch.product.name}</div>
    },
    {
        accessorKey: "productBatch.batchNumber",
        header: "Batch Number",
        cell: ({ row }) => <Badge variant="secondary">{row.original.productBatch.batchNumber}</Badge>
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
            const record = row.original;
            const units = typeof record.productBatch.product.units === 'string' 
                ? JSON.parse(record.productBatch.product.units) 
                : record.productBatch.product.units;
            return `${row.getValue("quantity")} ${units.baseUnit}`;
        }
    },
    {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => {
            const reason = row.getValue("reason") as string;
            let variant: "default" | "secondary" | "destructive" = "secondary";
            if (reason === 'DAMAGED') variant = "destructive";
            if (reason === 'EXPIRED') variant = "destructive";
            if (reason === 'LOST') variant = "destructive";
            
            return <Badge variant={variant} className="capitalize">{reason.toLowerCase()}</Badge>
        }
    },
    {
        accessorKey: "notes",
        header: "Notes",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions record={row.original} onDelete={onDelete} />,
    },
]
