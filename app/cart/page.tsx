"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Cart } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchCart();
  }, [user, authLoading]);

  async function fetchCart() {
    setLoading(true);
    try {
      const data = await api.get<Cart>("/api/cart");
      setCart(data);
    } catch { setError("Failed to load cart."); }
    finally { setLoading(false); }
  }

  async function updateQty(itemId: number, quantity: number) {
    try {
      await api.patch(`/api/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "Failed to update.");
    }
  }

  async function removeItem(itemId: number) {
    try {
      await api.delete(`/api/cart/${itemId}`);
      await fetchCart();
    } catch { setError("Failed to remove item."); }
  }

  if (authLoading || loading) return <LoadingSpinner />;

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
      <ErrorMessage message={error} />

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg mb-4" data-testid="empty-cart">Your cart is empty.</p>
          <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ul>
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0" data-testid="cart-item">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-40"
                    data-testid="qty-decrease"
                  >−</button>
                  <span className="px-3 py-1 text-sm font-medium" data-testid="item-quantity">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100"
                    data-testid="qty-increase"
                  >+</button>
                </div>
                <span className="w-20 text-right font-semibold text-indigo-600" data-testid="item-subtotal">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  data-testid="remove-item"
                >Remove</button>
              </li>
            ))}
          </ul>
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-bold text-indigo-600" data-testid="cart-total">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
