// src/app/dashboard/products/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { ProductBatch } from "@/types"
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
import { Badge } from "@/components/ui/badge"

// Define a new interface for the component props
interface CellActionsProps {
  batch: ProductBatch;
  onEdit: (batch: ProductBatch) => void; // Callback to open the edit drawer
  onDelete: (batchId: string) => void; // Callback to handle deletion
}

const CellActions = ({ batch, onEdit, onDelete }: CellActionsProps) => {
    const handleEditClick = () => {
        onEdit(batch);
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(batch.id)}>
                    Copy Batch ID
                </DropdownMenuItem>
                 <AuthorizationGuard permissionKey="products.update">
                    <DropdownMenuItem onClick={handleEditClick}>
                      Edit Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="products.delete">
                    <DropdownMenuItem onClick={() => onDelete(batch.id)} className="text-red-500">
                        Delete Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Update the type definition for the columns factory
export const getColumns = (
  onEdit: (batch: ProductBatch) => void,
  onDelete: (batchId: string) => void
): ColumnDef<ProductBatch>[] => [
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
        accessorKey: "product.name",
        header: "Name",
        cell: ({ row, getValue }) => {
            const isGrouped = row.getIsGrouped();
            const value = getValue() as string;

            if (isGrouped) {
                return (
                <div className="flex items-center gap-2">
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
                    <span className="font-bold">{value} ({row.subRows.length})</span>
                </div>
                );
            }

            // For non-grouped rows, we are now showing the master product name.
            // The grouping cell handles the display for sub-rows implicitly.
            return <div className="font-bold">{value}</div>;
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
        accessorKey: "stock",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
            const batch = row.original;
            const stock = row.getValue("stock") as number;
            const units = typeof batch.product.units === 'string' ? JSON.parse(batch.product.units) : batch.product.units;
            return <div className="text-right">{stock} {units.baseUnit}</div>
        }
    },
     {
        accessorKey: "product.category",
        header: "Category",
    },
     {
        accessorKey: "product.brand",
        header: "Brand",
    },
    {
        accessorKey: "product.isActive",
        header: "Status",
        cell: ({ row }) => {
            return row.original.product.isActive ? "Active" : "Inactive";
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            if (row.getIsGrouped()) {
                return null; // No actions on grouped rows
            }
            return <CellActions batch={row.original} onEdit={onEdit} onDelete={onDelete} />
        },
    },
]
