import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  addMonthlyBudget,
  deleteMonthlyBudget,
  getMonthlyBudget,
  updateMonthlyBudget,
} from "../services/auth.js";

function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function MonthlyBudget() {
  const navigate = useNavigate();
  const initialPeriod = currentPeriod();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadBudget() {
    setLoading(true);
    const result = await getMonthlyBudget(month, year);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBudget(result.budget);
    setAmount(result.budget ? String(result.budget.amount) : "");
  }

  useEffect(() => {
    loadBudget();
  }, [month, year]);

  async function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError("Ngân sách tổng phải là số nguyên lớn hơn 0.");
      setMessage("");
      return;
    }

    setSaving(true);
    const payload = { month, year, amount: parsedAmount };
    const result = budget
      ? await updateMonthlyBudget(budget.id, payload)
      : await addMonthlyBudget(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setBudget(result.budget);
    setAmount(String(result.budget.amount));
    setError("");
    setMessage(budget ? "Đã cập nhật ngân sách tổng." : "Đã thêm ngân sách tổng.");
  }

  async function handleDelete() {
    if (!budget || !window.confirm(`Bạn có chắc muốn xóa ngân sách tổng tháng ${month}/${year} không?`)) {
      return;
    }

    const result = await deleteMonthlyBudget(budget.id);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setBudget(null);
    setAmount("");
    setError("");
    setMessage("Đã xóa ngân sách tổng.");
  }

  const yearOptions = Array.from({ length: 7 }, (_, index) => initialPeriod.year - 3 + index);

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sprint 2</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Ngân sách tổng theo tháng</h1>
              <p className="mt-2 text-sm text-slate-500">Theo dõi giới hạn chi tiêu chung cho từng tháng.</p>
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
                aria-label="Tháng"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Năm
              <select
                aria-label="Năm"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{budget ? "Chỉnh sửa ngân sách tổng" : "Thêm ngân sách tổng"}</h2>
            <input
              aria-label="Số tiền ngân sách tổng"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Số tiền ngân sách tổng"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                {saving ? "Đang lưu..." : budget ? "Lưu thay đổi" : "Thêm ngân sách"}
              </button>
              {budget && <button type="button" onClick={handleDelete} className="rounded-3xl bg-white px-6 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50">Xóa</button>}
            </div>
          </form>

          {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-8">
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải ngân sách tổng...</p>
            ) : !budget ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Chưa có ngân sách tổng cho tháng này.</p>
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Tháng {budget.month}/{budget.year}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <span>Ngân sách: <strong className="text-slate-900">{formatVND(budget.budgetAmount)}</strong></span>
                  <span>Đã chi: <strong className="text-rose-600">{formatVND(budget.spentAmount)}</strong></span>
                  <span>Còn lại: <strong className={budget.remainingAmount < 0 ? "text-rose-600" : "text-emerald-600"}>{formatVND(budget.remainingAmount)}</strong></span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
