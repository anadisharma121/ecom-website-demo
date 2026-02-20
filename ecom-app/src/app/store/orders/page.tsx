"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Order {
  id: number;
  total: number;
  status: string;
  deliveryAddress: string | null;
  poNumber: string | null;
  customerEmail: string | null;
  emailNotification: boolean;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: { name: string; image: string | null };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            No orders yet
          </h3>
          <p className="text-slate-400">
            Start shopping to place your first order!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              {/* Order Header */}
              <div className="p-5 bg-slate-50 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Order #{order.id}
                    </span>
                    <span className="text-sm text-slate-500 ml-3">
                      {new Date(order.createdAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      £{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* Order Meta Info */}
                <div className="flex flex-wrap gap-4 mt-2">
                  {order.deliveryAddress && (
                    <span className="text-xs text-slate-500">
                      📍 {order.deliveryAddress}
                    </span>
                  )}
                  {order.poNumber && (
                    <span className="text-xs text-slate-500">
                      📋 PO#: {order.poNumber}
                    </span>
                  )}
                  {order.emailNotification && order.customerEmail && (
                    <span className="text-xs text-emerald-600">
                      ✉️ Updates to {order.customerEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* Order Tracking */}
              {order.status !== "CANCELLED" && (
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center">
                    {STATUS_STEPS.map((step, index) => {
                      const currentIndex = STATUS_STEPS.indexOf(order.status);
                      const isComplete = index <= currentIndex;
                      const isCurrent = index === currentIndex;

                      return (
                        <div key={step} className="flex items-center flex-1 last:flex-initial">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isComplete
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-400"
                              } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                            >
                              {isComplete ? "✓" : index + 1}
                            </div>
                            <span
                              className={`text-xs mt-1 ${
                                isComplete ? "text-emerald-600 font-medium" : "text-slate-400"
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 ${
                                index < currentIndex ? "bg-emerald-500" : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-5">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="w-10 h-10 bg-slate-50 rounded overflow-hidden flex-shrink-0">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            📦
                          </div>
                        )}
                      </div>
                      <span className="flex-1 text-slate-700">
                        {item.product?.name || "Product"}
                      </span>
                      <span className="text-slate-500">x{item.quantity}</span>
                      <span className="font-medium text-slate-800">
                        £{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
