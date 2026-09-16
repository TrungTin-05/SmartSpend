import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/auth.js";

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryType, setCategoryType] = useState("expense");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCategories() {
    setLoading(true);
    const result = await getCategories(categoryType);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCategories(result.categories);
  }

  useEffect(() => {
    loadCategories();
  }, [categoryType]);

  function showMessage(nextMessage) {
    setMessage(nextMessage);
    setError("");
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên danh mục không được để trống.");
      setMessage("");
      return;
    }

    const result = await addCategory(name.trim(), categoryType);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    showMessage("Đã thêm danh mục.");
  }

  function startEditing(category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError("");
    setMessage("");
  }

  async function handleUpdate(categoryId) {
    if (!editingName.trim()) {
      setError("Tên danh mục không được để trống.");
      setMessage("");
      return;
    }

    const result = await updateCategory(categoryId, editingName.trim());
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setCategories((current) =>
      current
        .map((category) => (category.id === categoryId ? result.category : category))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingId(null);
    setEditingName("");
    showMessage("Đã cập nhật danh mục và các giao dịch liên quan.");
  }

  async function handleDelete(category) {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}" không?`)) {
      return;
    }

    const result = await deleteCategory(category.id);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== category.id));
    showMessage("Đã xóa danh mục.");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sprint 1</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Danh mục {categoryType === "expense" ? "chi tiêu" : "thu nhập"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">Quản lý danh mục dùng khi ghi nhận giao dịch.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Về Dashboard
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCategoryType("expense")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${categoryType === "expense" ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setCategoryType("income")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${categoryType === "income" ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Thu nhập
            </button>
          </div>

          <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên danh mục mới"
              className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button className="rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Thêm danh mục
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-8 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải danh mục...</p>
            ) : categories.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Chưa có danh mục chi tiêu.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {editingId === category.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <span className="font-medium text-slate-900">{category.name}</span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {editingId === category.id ? (
                      <>
                        <button type="button" onClick={() => handleUpdate(category.id)} className="rounded-2xl bg-brand px-3 py-2 text-sm font-medium text-white">
                          Lưu
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700">
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startEditing(category)} className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand">
                        Sửa
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(category)} className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
