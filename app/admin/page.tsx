"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

interface ProductForm { name: string; description: string; price: string; stock: string; }
const emptyForm: ProductForm = { name: "", description: "", price: "", stock: "0" };

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "inventory">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null });
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [stockInputs, setStockInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); return; }
    fetchProducts();
  }, [user, authLoading]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const data = await api.get<Product[]>("/api/products");
      setProducts(data);
      const inputs: Record<number, string> = {};
      data.forEach((p) => { inputs[p.id] = String(p.stock); });
      setStockInputs(inputs);
    } catch { setError("Failed to load products."); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm(emptyForm);
    setModal({ open: true, editing: null });
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), stock: String(p.stock) });
    setModal({ open: true, editing: p });
  }

  async function handleSave() {
    setError("");
    const body = { name: form.name, description: form.description || undefined, price: parseFloat(form.price), stock: parseInt(form.stock) };
    try {
      if (modal.editing) {
        await api.put(`/api/products/${modal.editing.id}`, body);
        setSuccess("Product updated.");
      } else {
        await api.post("/api/products", body);
        setSuccess("Product created.");
      }
      setModal({ open: false, editing: null });
      fetchProducts();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "Failed to save product.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setSuccess("Product deleted.");
      fetchProducts();
      setTimeout(() => setSuccess(""), 2000);
    } catch { setError("Failed to delete product."); }
  }

  async function handleInventoryUpdate(productId: number) {
    const stock = parseInt(stockInputs[productId] ?? "0");
    if (isNaN(stock) || stock < 0) { setError("Stock must be a non-negative number."); return; }
    try {
      await api.patch(`/api/inventory/${productId}`, { stock });
      setSuccess("Stock updated.");
      fetchProducts();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "Failed to update stock.");
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <ErrorMessage message={error} />
      {success && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded text-sm" data-testid="success-message">{success}</div>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "products" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`} data-testid="tab-products">Products</button>
        <button onClick={() => setTab("inventory")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "inventory" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`} data-testid="tab-inventory">Inventory</button>
      </div>

      {tab === "products" && (
        <div>
          <button onClick={openCreate} className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700" data-testid="create-product-btn">
            + New Product
          </button>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400" data-testid="no-products">No products yet.</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100" data-testid="product-row">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-indigo-600 hover:underline text-xs" data-testid="edit-product-btn">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs" data-testid="delete-product-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">New Stock</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100" data-testid="inventory-row">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={stockInputs[p.id] ?? p.stock}
                      onChange={(e) => setStockInputs({ ...stockInputs, [p.id]: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      data-testid="stock-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleInventoryUpdate(p.id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700" data-testid="update-stock-btn">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="product-modal">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{modal.editing ? "Edit Product" : "New Product"}</h2>
            <div className="flex flex-col gap-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" data-testid="form-name" />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" data-testid="form-description" />
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price *" min="0" step="0.01" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" data-testid="form-price" />
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock" min="0" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" data-testid="form-stock" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700" data-testid="modal-save-btn">Save</button>
              <button onClick={() => setModal({ open: false, editing: null })} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" data-testid="modal-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
