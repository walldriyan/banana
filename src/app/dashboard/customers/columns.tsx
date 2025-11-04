// src/app/dashboard/customers/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Customer } from "@prisma/client"
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
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const CellActions = ({ customer, onEdit, onDelete }: CellActionsProps) => {
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customer.id)}>
                    Copy customer ID
                </DropdownMenuItem>
                 <AuthorizationGuard permissionKey="customers.update">
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      Edit
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="customers.delete">
                    <DropdownMenuItem onClick={() => onDelete(customer.id)} className="text-red-500">
                        Delete
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (customer: Customer) => void,
  onDelete: (customerId: string) => void
): ColumnDef<Customer>[] => [
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
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "address",
        header: "Address",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions customer={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
