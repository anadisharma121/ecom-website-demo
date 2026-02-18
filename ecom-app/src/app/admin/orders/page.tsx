"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  user: { username: string };
  items: {
    id: number;
    quantity: number;
    price: number;
    product: { name: string };
  }[];
}

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-yellow",
  CONFIRMED: "badge-blue",
  PROCESSING: "badge-blue",
  SHIPPED: "badge-purple",
  DELIVERED: "badge-green",
  CANCELLED: "badge-red",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?admin=true");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const clearAllOrders = async () => {
    if (!confirm("Delete ALL orders? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/orders?clearAll=true", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("All orders cleared!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to clear orders");
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <button onClick={clearAllOrders} className="btn-danger text-sm">
          Clear All Orders
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Order ID</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Customer</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Items</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Total</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Status</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Date</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm font-medium text-slate-800">
                    #{order.id}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {order.user?.username}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    <div className="max-w-xs">
                      {order.items?.map((item) => (
                        <div key={item.id} className="text-xs text-slate-500">
                          {item.product?.name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-emerald-600">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={STATUS_COLORS[order.status] || "badge-blue"}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
