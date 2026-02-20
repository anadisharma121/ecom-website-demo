"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from "react-icons/hi";

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  categories: { category: Category }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    categoryIds: [] as number[],
  });

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const openAddModal = () => {
    setForm({ username: "", password: "", confirmPassword: "", categoryIds: [] });
    setShowModal(true);
  };

  const toggleCategory = (catId: number) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      toast.error("Username and password are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    if (form.categoryIds.length === 0) {
      toast.error("Please assign at least one category");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          categoryIds: form.categoryIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? All their orders will also be deleted.")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("User deleted!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">ID</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Username</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Role</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Categories</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Created</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-600">#{user.id}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-800">{user.username}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      user.role === "ADMIN" ? "badge-purple" : "badge-blue"
                    }
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs text-slate-400">All Access</span>
                    ) : user.categories?.length > 0 ? (
                      user.categories.map((uc) => (
                        <span
                          key={uc.category.id}
                          className="text-xs bg-slate-100 px-2 py-0.5 rounded-full"
                        >
                          {uc.category.emoji} {uc.category.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-3">
                  {user.role !== "ADMIN" && (
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-12 text-center text-slate-400">No users yet</div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field"
                  placeholder="e.g. john_doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Min 4 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Confirm password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Category Access *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        form.categoryIds.includes(cat.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="sr-only"
                      />
                      <span>{cat.emoji}</span>
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-success flex-1">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
