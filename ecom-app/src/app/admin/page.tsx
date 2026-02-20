"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineShoppingBag,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineTag,
  HiOutlineCurrencyPound,
} from "react-icons/hi";

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalCategories: number;
  totalRevenue: number;
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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

  const statCards = [
    {
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: HiOutlineShoppingBag,
      color: "bg-blue-500",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: HiOutlineUsers,
      color: "bg-emerald-500",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: HiOutlineClipboardList,
      color: "bg-amber-500",
    },
    {
      label: "Categories",
      value: stats?.totalCategories || 0,
      icon: HiOutlineTag,
      color: "bg-purple-500",
    },
    {
      label: "Total Revenue",
      value: `£${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: HiOutlineCurrencyPound,
      color: "bg-rose-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`${stat.color} p-3 rounded-lg text-white`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Order ID
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Customer
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Items
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Total
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">
                      #{order.id}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {order.user?.username}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {order._count?.items || 0} items
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-emerald-600">
                      £{order.total.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "badge-yellow",
    CONFIRMED: "badge-blue",
    PROCESSING: "badge-blue",
    SHIPPED: "badge-purple",
    DELIVERED: "badge-green",
    CANCELLED: "badge-red",
  };

  return (
    <span className={styles[status] || "badge-blue"}>
      {status}
    </span>
  );
}
