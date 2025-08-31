// src/components/POSUI/ProductList.tsx
import React from 'react';
import type { Product, DiscountSet, ProductBatch } from '@/types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  activeCampaign: DiscountSet;
  onAddToCart: (product: Product, batch?: ProductBatch) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, activeCampaign, onAddToCart }) => {
  return (
    <section>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Products</h3>
      <div className="space-y-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            activeCampaign={activeCampaign}
            onAddToCart={onAddToCart}
            products={products}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductList;
