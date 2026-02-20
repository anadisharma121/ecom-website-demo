"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineTrash, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi";
import { getPlaceholderImage } from "@/lib/placeholder";

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const router = useRouter();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "UK",
    isDefault: false,
  });

  // PO Number state
  const [poNumber, setPoNumber] = useState("");

  // Email state
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      setAddresses(data);
      // Auto-select default address
      const defaultAddr = data.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch (error) {
      console.error("Failed to fetch addresses");
    }
  };

  const saveNewAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip) {
      toast.error("Please fill in all address fields");
      return;
    }
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) throw new Error("Failed to save address");
      const saved = await res.json();
      setAddresses((prev) => [...prev, saved]);
      setSelectedAddressId(saved.id);
      setShowNewAddress(false);
      setNewAddress({ label: "", street: "", city: "", state: "", zip: "", country: "UK", isDefault: false });
      toast.success("Address saved!");
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success("Address deleted");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const formatAddress = (addr: Address) =>
    `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;

  const placeOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    if (!customerEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      toast.error("Please select a valid delivery address");
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
          deliveryAddress: formatAddress(selectedAddr),
          poNumber: poNumber.trim() || null,
          customerEmail: customerEmail.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place order");
      }

      const order = await res.json();
      clearCart();
      setPoNumber("");
      setCustomerEmail("");
      toast.success(`Order #${order.id} placed! Confirmation email sent to ${customerEmail.trim()}`);
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
                    £{item.price.toFixed(2)}
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
                  £{(item.price * item.quantity).toFixed(2)}
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
          <div className="lg:col-span-1 space-y-4">
            {/* Delivery Address */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                📍 Delivery Address
              </h2>
              {addresses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-800">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatAddress(addr)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteAddress(addr.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </label>
                  ))}
                </div>
              )}
              {!showNewAddress ? (
                <button
                  onClick={() => setShowNewAddress(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Add New Address
                </button>
              ) : (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Home, Office)"
                    value={newAddress.label}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, label: e.target.value })
                    }
                    className="input-field text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Street address"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    className="input-field text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      placeholder="County"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Postcode"
                      value={newAddress.zip}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, zip: e.target.value })
                      }
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, country: e.target.value })
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, isDefault: e.target.checked })
                      }
                      className="accent-emerald-600"
                    />
                    Set as default address
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveNewAddress} className="btn-primary text-sm flex-1">
                      Save Address
                    </button>
                    <button
                      onClick={() => setShowNewAddress(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PO Number & Email */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                📋 Order Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="input-field text-sm"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Order confirmation and status updates will be sent here
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    PO Number <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter purchase order number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Price Summary */}
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
                      £{(item.price * item.quantity).toFixed(2)}
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
                    £{totalPrice.toFixed(2)}
                  </span>
                </div>
                {poNumber.trim() && (
                  <p className="text-xs text-slate-500 mt-2">
                    PO#: {poNumber.trim()}
                  </p>
                )}
                {selectedAddressId && (
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {addresses.find((a) => a.id === selectedAddressId)?.label}
                  </p>
                )}
                {customerEmail.trim() && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✉️ {customerEmail.trim()}
                  </p>
                )}
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
