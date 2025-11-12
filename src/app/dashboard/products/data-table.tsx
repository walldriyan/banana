// src/app/dashboard/products/data-table.tsx
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  ExpandedState,
  Row,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PlusCircle, ArchiveX } from "lucide-react"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  onAddProduct: () => void; // Callback to open the add master product drawer
  hideZeroStock: boolean;
  onHideZeroStockChange: (checked: boolean) => void;
}


const renderRowSubComponent = ({ row }: { row: Row<any> }) => {
  return (
    <pre style={{ fontSize: '10px' }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  )
}


export function ProductsDataTable<TData, TValue>({
  columns,
  data,
  onAddProduct,
  hideZeroStock,
  onHideZeroStockChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [grouping, setGrouping] = useState<string[]>(['product.name']) // Group by master product name
    const [expanded, setExpanded] = useState<ExpandedState>({})


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    getGroupedRowModel: getGroupedRowModel(),
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    autoResetAll: false, // Prevents table from resetting on data change
    state: {
      sorting,
      columnFilters,
      rowSelection,
      grouping,
      expanded,
    },
  })

  return (
    <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between py-4 gap-4 flex-shrink-0">
            <Input
                placeholder="Filter by product name..."
                value={(table.getColumn("product.name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("product.name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="hide-zero-stock" 
                        checked={hideZeroStock}
                        onCheckedChange={onHideZeroStockChange}
                    />
                    <Label htmlFor="hide-zero-stock" className="whitespace-nowrap">
                        <ArchiveX className="inline-block mr-2 h-4 w-4" />
                        Hide Zero Stock
                    </Label>
                </div>
                <AuthorizationGuard permissionKey="products.create">
                    <Button onClick={onAddProduct}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Master Product
                    </Button>
                </AuthorizationGuard>
            </div>
        </div>
        <div className="rounded-md border flex-grow overflow-y-auto p-2 space-y-2 bg-muted/20">
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                    const isGrouped = row.getIsGrouped();
                    return (
                        <div
                            key={row.id}
                            className={cn(
                                "bg-card rounded-sm shadow-sm transition-all border",
                                row.depth > 0 && "bg-muted/50"
                            )}
                        >
                            <div className="grid grid-cols-12 items-center gap-4 p-3">
                                {row.getVisibleCells().map((cell) => (
                                    <div 
                                        key={cell.id} 
                                        className={cn(
                                            "flex flex-col",
                                            cell.column.id === 'product.name' && 'col-span-3',
                                            cell.column.id === 'sellingPrice' && 'col-span-2 text-right',
                                            cell.column.id === 'stock' && 'col-span-2 text-right',
                                            cell.column.id === 'product.category' && 'col-span-2',
                                            cell.column.id === 'product.brand' && 'col-span-1',
                                            cell.column.id === 'product.isActive' && 'col-span-1',
                                            cell.column.id === 'actions' && 'col-span-1 flex-row justify-end',
                                        )}
                                    >
                                        <span className="text-xs text-muted-foreground font-medium md:hidden">
                                           {typeof cell.column.columnDef.header === 'function' 
                                                ? ''
                                                : cell.column.columnDef.header?.toString()
                                            }
                                        </span>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-24 text-muted-foreground">
                    No results.
                </div>
            )}
        </div>
         <div className="flex items-center justify-end space-x-2 py-4 flex-shrink-0">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
                Next
            </Button>
        </div>
        <div className="text-sm text-muted-foreground flex-shrink-0">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
    </div>
  )
}
