// src/app/dashboard/suppliers/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Supplier } from "@prisma/client"
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

interface CellActionsProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

const CellActions = ({ supplier, onEdit, onDelete }: CellActionsProps) => {
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(supplier.id)}>
                    Copy supplier ID
                </DropdownMenuItem>
                 <AuthorizationGuard permissionKey="suppliers.update">
                    <DropdownMenuItem onClick={() => onEdit(supplier)}>
                      Edit
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="suppliers.delete">
                    <DropdownMenuItem onClick={() => onDelete(supplier.id)} className="text-red-500">
                        Delete
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (supplier: Supplier) => void,
  onDelete: (supplierId: string) => void
): ColumnDef<Supplier>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
    },
    {
        accessorKey: "contactPerson",
        header: "Contact Person",
    },
    {
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions supplier={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
