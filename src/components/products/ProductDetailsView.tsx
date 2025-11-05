// src/components/products/ProductDetailsView.tsx
import type { ProductBatch } from "@/types";
import { Badge } from "../ui/badge";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useProductUnits } from "@/hooks/use-product-units";

interface ProductDetailsViewProps {
    batch: ProductBatch;
}

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground text-right">{value || <span className="text-gray-400">N/A</span>}</dd>
    </div>
);

export function ProductDetailsView({ batch }: ProductDetailsViewProps) {
    const { product } = batch;
    const units = useProductUnits(product.units);

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount == null) return "N/A";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "LKR" }).format(amount);
    }
    
    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return "N/A";
        return format(new Date(date), "PPP");
    }

    const formatDiscount = (discount: number | null | undefined, discountType: string | null | undefined) => {
        if (discount == null || discountType == null) return "N/A";
        if (discountType === 'PERCENTAGE') {
            return `${discount}%`;
        }
        return formatCurrency(discount);
    }

    const formatTax = (tax: number | null | undefined, taxtype: string | null | undefined) => {
        if (tax == null || taxtype == null) return "N/A";
        if (taxtype === 'PERCENTAGE') {
            return `${tax}%`;
        }
        return formatCurrency(tax);
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Master Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-2">
                        <DetailRow label="Product Name" value={product.name} />
                        <DetailRow label="Product ID" value={<Badge variant="outline">{product.id}</Badge>} />
                        <DetailRow label="Category" value={product.category} />
                        <DetailRow label="Brand" value={product.brand} />
                        <DetailRow label="Status" value={product.isActive ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>} />
                        <DetailRow label="Is Service" value={product.isService ? "Yes" : "No"} />
                        <DetailRow label="Base Unit" value={units.baseUnit} />
                        {units.derivedUnits && units.derivedUnits.length > 0 && (
                             <DetailRow label="Derived Units" value={
                                 <div className="flex flex-col items-end">
                                    {units.derivedUnits.map((u: any) => `${u.name} (${u.conversionFactor} ${units.baseUnit})`).join(', ')}
                                 </div>
                            }/>
                        )}
                        <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{product.description}</p>} />
                    </dl>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Batch Specific Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-2">
                        <DetailRow label="Batch Number" value={<Badge variant="secondary">{batch.batchNumber}</Badge>} />
                        <DetailRow label="Batch ID" value={<Badge variant="outline">{batch.id}</Badge>} />
                        <DetailRow label="Barcode (SKU)" value={batch.barcode} />
                        <DetailRow label="Current Stock" value={<span className="font-bold text-lg">{batch.stock} {units.baseUnit}</span>} />
                        <DetailRow label="Cost Price" value={formatCurrency(batch.costPrice)} />
                        <DetailRow label="Selling Price" value={<span className="font-bold text-blue-600">{formatCurrency(batch.sellingPrice)}</span>} />
                        <Separator />
                        <DetailRow label="Batch Tax" value={formatTax(batch.tax, batch.taxtype)} />
                        <DetailRow label="Batch Discount" value={formatDiscount(batch.discount, batch.discountType)} />
                        <Separator />
                        <DetailRow label="Manufacture Date" value={formatDate(batch.manufactureDate)} />
                        <DetailRow label="Expiry Date" value={formatDate(batch.expiryDate)} />
                        <DetailRow label="Date Added" value={formatDate(batch.addedDate)} />
                        <DetailRow label="Location" value={batch.location} />
                        <DetailRow label="Notes" value={<p className="whitespace-pre-wrap">{batch.notes}</p>} />
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}