"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiOutlineTrash, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi";
import { getPlaceholderImage } from "@/lib/placeholder";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const router = useRouter();

  const placeOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place order");
      }

      const order = await res.json();
      clearCart();
      toast.success(`Order #${order.id} placed successfully!`);
      router.push("/store/orders");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Your cart is empty
          </h3>
          <p className="text-slate-400 mb-4">
            Add some products to get started!
          </p>
          <button
            onClick={() => router.push("/store")}
            className="btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="card p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          getPlaceholderImage(item.name);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 truncate">
                    {item.name}
                  </h3>
                  <p className="text-emerald-600 font-semibold">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    <HiOutlineMinus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-right font-semibold text-slate-800 w-20">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-slate-600 truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-slate-800 font-medium flex-shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-800">
                    Total
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                className="btn-success w-full text-lg py-3"
              >
                Place Order
              </button>
              <button
                onClick={clearCart}
                className="btn-secondary w-full mt-2 text-sm"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
