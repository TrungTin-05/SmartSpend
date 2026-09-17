import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  addBudget,
  deleteBudget,
  getBudgets,
  getCategories,
  updateBudget,
} from "../services/auth.js";

function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

function getCurrentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

const emptyForm = { categoryId: "", amount: "" };

export default function Budgets() {
  const navigate = useNavigate();
  const currentPeriod = getCurrentPeriod();
  const [month, setMonth] = useState(currentPeriod.month);
  const [year, setYear] = useState(currentPeriod.year);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    const [budgetResult, categoryResult] = await Promise.all([
      getBudgets(month, year),
      getCategories("expense"),
    ]);
    setLoading(false);

    if (budgetResult.error) {
      setError(budgetResult.error);
      return;
    }
    if (categoryResult.error) {
      setError(categoryResult.error);
      return;
    }

    setBudgets(budgetResult.budgets || []);
    setCategories(categoryResult.categories || []);
  }

  useEffect(() => {
    loadPage();
  }, [month, year]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(budget) {
    setEditingId(budget.id);
    setForm({ categoryId: String(budget.categoryId), amount: String(budget.amount) });
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.categoryId || !Number.isInteger(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Vui lòng chọn danh mục và nhập ngân sách lớn hơn 0.");
      setMessage("");
      return;
    }

    setSaving(true);
    const payload = {
      categoryId: Number(form.categoryId),
      month,
      year,
      amount: Number(form.amount),
    };
    const result = editingId
      ? await updateBudget(editingId, payload)
      : await addBudget(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setMessage(editingId ? "Đã cập nhật ngân sách." : "Đã thêm ngân sách.");
    setError("");
    resetForm();
    await loadPage();
  }

  async function handleDelete(budget) {
    if (!window.confirm(`Bạn có chắc muốn xóa ngân sách cho "${budget.category?.name}" không?`)) {
      return;
    }

    const result = await deleteBudget(budget.id);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setBudgets((current) => current.filter((item) => item.id !== budget.id));
    if (editingId === budget.id) resetForm();
    setError("");
    setMessage("Đã xóa ngân sách.");
  }

  const yearOptions = Array.from({ length: 7 }, (_, index) => currentPeriod.year - 3 + index);
  const availableCategories = categories.filter(
    (category) => !budgets.some((budget) => budget.categoryId === category.id && budget.id !== editingId)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sprint 2</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Ngân sách</h1>
              <p className="mt-2 text-sm text-slate-500">Thiết lập ngân sách chi tiêu theo danh mục và tháng.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Về Dashboard
            </button>
          </div>

          <div className="mt-8 grid gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Tháng
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Năm
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Chỉnh sửa ngân sách" : "Thêm ngân sách"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={form.categoryId}
                onChange={(event) => updateForm("categoryId", event.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Chọn danh mục chi tiêu</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="Số tiền ngân sách"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm ngân sách"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-3xl bg-white px-6 py-3 text-sm text-slate-700">
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-8 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải ngân sách...</p>
            ) : budgets.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Chưa có ngân sách cho tháng này.
              </p>
            ) : (
              budgets.map((budget) => (
                <div key={budget.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{budget.category?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Tháng {budget.month}/{budget.year}</p>
                      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                        <span>Ngân sách: <strong className="text-slate-900">{formatVND(budget.amount)}</strong></span>
                        <span>Đã chi: <strong className="text-rose-600">{formatVND(budget.spentAmount)}</strong></span>
                        <span>Còn lại: <strong className={budget.remainingAmount < 0 ? "text-rose-600" : "text-emerald-600"}>{formatVND(budget.remainingAmount)}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditing(budget)} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 hover:text-brand">Sửa</button>
                      <button type="button" onClick={() => handleDelete(budget)} className="rounded-2xl bg-white px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Xóa</button>
                    </div>
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
