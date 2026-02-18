"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import {
  HiOutlineShoppingCart,
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineKey,
  HiOutlineLogout,
} from "react-icons/hi";

export default function StoreNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { totalItems } = useCart();

  const navLinks = [
    { href: "/store", label: "Shop", icon: HiOutlineHome },
    { href: "/store/cart", label: "Cart", icon: HiOutlineShoppingCart, badge: totalItems },
    { href: "/store/orders", label: "My Orders", icon: HiOutlineClipboardList },
    { href: "/store/change-password", label: "Password", icon: HiOutlineKey },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/store" className="text-xl font-bold text-blue-600">
            E-Commerce Store
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">
              Welcome, <strong className="text-slate-700">{session?.user?.name}</strong>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <HiOutlineLogout className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
