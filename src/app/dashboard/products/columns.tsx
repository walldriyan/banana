// src/app/dashboard/products/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Product } from "@/types"
import { MoreHorizontal, ArrowUpDown, ChevronsRight, ChevronsDownUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Badge } from "../ui/badge"

// Define a new interface for the component props
interface CellActionsProps {
  product: Product;
  onEdit: (product: Product) => void; // Callback to open the edit drawer
  onDelete: (productId: string) => void; // Callback to handle deletion
}

const CellActions = ({ product, onEdit, onDelete }: CellActionsProps) => {
    const handleEditClick = () => {
        console.log('[columns.tsx] "Edit" button clicked for product:', product);
        onEdit(product);
    }
    
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)}>
                    Copy product ID
                </DropdownMenuItem>
                 <AuthorizationGuard permissionKey="products.update">
                    <DropdownMenuItem onClick={handleEditClick}>
                      Edit Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="products.delete">
                    <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-red-500">
                        Delete Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Update the type definition for the columns factory
export const getColumns = (
  onEdit: (product: Product) => void,
  onDelete: (productId: string) => void
): ColumnDef<Product>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row, getValue }) => {
            const isGrouped = row.getIsGrouped();
            const value = getValue() as string;

            if (isGrouped) {
                return (
                <div className="flex items-center gap-2 font-bold">
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={row.getToggleExpandedHandler()}
                    className="h-6 w-6"
                    >
                    {row.getIsExpanded() ? (
                        <ChevronsDownUp className="h-4 w-4" />
                    ) : (
                        <ChevronsRight className="h-4 w-4" />
                    )}
                    </Button>
                    {value} ({row.subRows.length})
                </div>
                );
            }

            return <div>{value}</div>;
        },
    },
     {
        accessorKey: "batchNumber",
        header: "Batch Number",
        cell: ({ row }) => {
            return <Badge variant="secondary">{row.getValue("batchNumber")}</Badge>
        }
    },
    {
        accessorKey: "sellingPrice",
        header: () => <div className="text-right">Selling Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("sellingPrice"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "quantity",
        header: "Stock",
        cell: ({ row }) => {
            const product = row.original;
            return <div>{product.quantity} {product.units.baseUnit}</div>
        }
    },
     {
        accessorKey: "category",
        header: "Category",
    },
     {
        accessorKey: "brand",
        header: "Brand",
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
            return row.getValue("isActive") ? "Active" : "Inactive";
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            if (row.getIsGrouped()) {
                return null; // No actions on grouped rows
            }
            return <CellActions product={row.original} onEdit={onEdit} onDelete={onDelete} />
        },
    },
]
