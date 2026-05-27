"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight" data-testid="nav-logo">
          ShopAPI
        </Link>
        {!loading && (
          <div className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link href="/cart" className="hover:underline" data-testid="nav-cart">
                  Cart
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:underline" data-testid="nav-admin">
                    Admin
                  </Link>
                )}
                <span className="opacity-80 text-xs" data-testid="nav-email">{user.email}</span>
                <button
                  onClick={logout}
                  className="bg-white text-indigo-600 px-3 py-1 rounded hover:bg-indigo-50"
                  data-testid="nav-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline" data-testid="nav-login">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-indigo-600 px-3 py-1 rounded hover:bg-indigo-50"
                  data-testid="nav-register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
