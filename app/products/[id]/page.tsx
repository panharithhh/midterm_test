"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Product>(`/api/products/${id}`)
      .then(setProduct)
      .catch((e) => { if (e.status === 404) setNotFound(true); else setError("Failed to load product."); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!user) { router.push("/login"); return; }
    try {
      await api.post("/api/cart", { productId: Number(id), quantity });
      setCartMsg("Added to cart!");
      setTimeout(() => setCartMsg(""), 2000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setCartMsg(e.error || "Failed to add to cart.");
      setTimeout(() => setCartMsg(""), 2000);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (notFound) return (
    <div className="text-center py-20" data-testid="not-found">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Product Not Found</h2>
      <p className="text-gray-500 mb-4">This product doesn't exist.</p>
      <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline">Back to Products</button>
    </div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (!product) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline text-sm mb-4 block">
        ← Back to Products
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="product-name">{product.name}</h1>
        {product.description && (
          <p className="text-gray-500 mb-4">{product.description}</p>
        )}
        <div className="flex items-center gap-6 mb-6">
          <span className="text-3xl font-bold text-indigo-600" data-testid="product-price">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-400" data-testid="product-stock">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>

        {cartMsg && (
          <div className={`mb-4 px-4 py-2 rounded text-sm ${cartMsg.includes("Added") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} data-testid="cart-feedback">
            {cartMsg}
          </div>
        )}

        {product.stock > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
                data-testid="qty-decrease"
              >−</button>
              <span className="px-4 py-2 text-sm font-medium" data-testid="qty-value">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
                data-testid="qty-increase"
              >+</button>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              data-testid="add-to-cart-btn"
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
