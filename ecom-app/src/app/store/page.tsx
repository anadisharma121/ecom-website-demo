"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { getPlaceholderImage } from "@/lib/placeholder";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: { id: number; name: string; emoji: string };
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState<{ id: number; name: string; emoji: string }[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?userView=true");
      const data = await res.json();
      setProducts(data);

      // Extract unique categories
      const cats = data.reduce((acc: any[], product: Product) => {
        if (!acc.find((c: any) => c.id === product.category.id)) {
          acc.push(product.category);
        }
        return acc;
      }, []);
      setCategories(cats);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success(`${product.name} added to cart`);
  };

  const filteredProducts =
    filterCategory === "all"
      ? products
      : products.filter((p) => p.category.id.toString() === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Shop</h1>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id.toString())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterCategory === cat.id.toString()
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card p-16 text-center">
          <HiOutlineShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            No products available
          </h3>
          <p className="text-slate-400">
            You don&apos;t have access to any products yet. Contact your admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card group hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden rounded-t-lg">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        getPlaceholderImage(product.name);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {product.category?.emoji || "📦"}
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-slate-600">
                  {product.category?.emoji} {product.category?.name}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-600">
                    £{product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                  >
                    <HiOutlineShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
