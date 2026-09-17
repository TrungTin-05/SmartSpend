import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { getMonthlyExpenseReport } from "../services/auth.js";

function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function MonthlyReport() {
  const navigate = useNavigate();
  const initialPeriod = currentPeriod();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMonthlyExpenseReport(month, year).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setReport(null);
        return;
      }
      setError("");
      setReport(result.report);
    });
    return () => {
      active = false;
    };
  }, [month, year]);

  const yearOptions = Array.from({ length: 7 }, (_, index) => initialPeriod.year - 3 + index);
  const hasTransactions = report?.transactionCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sprint 2</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Báo cáo chi tiêu theo tháng</h1>
              <p className="mt-2 text-sm text-slate-500">Tổng hợp giao dịch của bạn theo tháng và danh mục.</p>
            </div>
            <button type="button" onClick={() => navigate("/dashboard")} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              Về Dashboard
            </button>
          </div>

          <div className="mt-8 grid gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Tháng
              <select aria-label="Tháng" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Năm
              <select aria-label="Năm" value={year} onChange={(event) => setYear(Number(event.target.value))} className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                {yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-slate-500">Đang tải báo cáo...</p>
          ) : error ? (
            <p className="mt-8 rounded-3xl bg-rose-50 p-5 text-sm text-rose-600">{error}</p>
          ) : !hasTransactions ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Chưa có giao dịch trong tháng {month}/{year}.
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-rose-50 p-5"><p className="text-xs uppercase tracking-wide text-rose-500">Tổng chi tiêu</p><p className="mt-3 text-2xl font-semibold text-rose-700">{formatVND(report.totalExpense)}</p></div>
                <div className="rounded-3xl bg-emerald-50 p-5"><p className="text-xs uppercase tracking-wide text-emerald-600">Tổng thu nhập</p><p className="mt-3 text-2xl font-semibold text-emerald-700">{formatVND(report.totalIncome)}</p></div>
                <div className="rounded-3xl bg-slate-50 p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Chênh lệch</p><p className={`mt-3 text-2xl font-semibold ${report.difference >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatVND(report.difference)}</p></div>
              </div>
              <div className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">Theo danh mục</h2>
                {report.categories.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Tháng này chưa có khoản chi tiêu.
                  </p>
                ) : report.categories.map((item) => (
                  <div key={item.category} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4"><span className="font-medium text-slate-900">{item.category}</span><span className="font-semibold text-rose-600">{formatVND(item.amount)}</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(item.percentage, 100)}%` }} /></div>
                    <p className="mt-2 text-xs text-slate-500">{item.percentage}% tổng chi tiêu</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
