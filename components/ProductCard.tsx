"use client";

import Link from "next/link";
import { Product } from "@/lib/api";

interface Props {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-2"
      data-testid="product-card"
    >
      <Link href={`/products/${product.id}`} className="font-semibold text-gray-800 hover:text-indigo-600 text-lg">
        {product.name}
      </Link>
      {product.description && (
        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-indigo-600 font-bold text-lg" data-testid="product-price">
          ${product.price.toFixed(2)}
        </span>
        <span className="text-xs text-gray-400">Stock: {product.stock}</span>
      </div>
      {onAddToCart && (
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={product.stock === 0}
          className="mt-1 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          data-testid="add-to-cart-btn"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      )}
    </div>
  );
}
