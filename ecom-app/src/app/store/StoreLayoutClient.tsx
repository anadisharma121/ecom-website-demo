"use client";

import StoreNavbar from "@/components/StoreNavbar";
import { CartProvider } from "@/context/CartContext";

export default function StoreLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50">
        <StoreNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </CartProvider>
  );
}
