import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { addTransaction, getCurrentUser, logout } from "../services/auth.js";

function formatVND(n) {
  return n.toLocaleString("vi-VN") + " đ";
}

const categories = ["Lương", "Ăn uống", "Di chuyển", "Giải trí", "Khác"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const currentUser = getCurrentUser();
    return currentUser
      ? { ...currentUser, transactions: currentUser.transactions || [] }
      : null;
  });
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: categories[0],
    amount: "",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
  });

  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const balance = useMemo(
    () => (user.transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0),
    [user.transactions]
  );

  const monthlyIncome = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [user.transactions]
  );

  const monthlyExpense = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [user.transactions]
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.name || !form.category || !amount || !form.date) {
      setError("Vui lòng điền tên, số tiền và ngày giao dịch.");
      return;
    }

    const transaction = {
      type: form.type,
      name: form.name.trim(),
      category: form.category,
      amount: form.type === "expense" ? -Math.abs(amount) : Math.abs(amount),
      note: "",
      date: form.date,
    };

    const result = await addTransaction(transaction);
    if (result.error) {
      setError(result.error);
      return;
    }

    setUser(result.user);
    setError("");
    setForm({
      name: "",
      category: categories[0],
      amount: "",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.8fr_0.9fr]">
          <section className="space-y-6">
            <header className="rounded-[32px] bg-brand text-white px-8 py-8 shadow-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">Xin chào, {user.name} 👋</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white/90">Bảng điều khiển SmartSpend</h1>
                </div>
              </div>

              <div className="mt-10 rounded-[28px] bg-white/10 p-8">
                <p className="text-sm text-white/80">Tổng số dư</p>
                <p className="mt-4 text-5xl font-bold">{formatVND(balance)}</p>
              </div>
            </header>

            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Thu nhập</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">{formatVND(monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Chi tiêu</p>
                  <p className="mt-2 text-3xl font-semibold text-red-500">{formatVND(monthlyExpense)}</p>
                </div>
              </div>
            </div>

            <section className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Thêm giao dịch mới</h2>
                  <p className="text-sm text-slate-500">Ghi chú thu nhập hoặc chi tiêu ngay trong dashboard.</p>
                </div>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-5">
                <div>
                  <label className="text-sm text-slate-600">Tên giao dịch</label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ví dụ: Mua cà phê"
                    className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Danh mục</label>
                    <select
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Loại</label>
                    <select
                      value={form.type}
                      onChange={(e) => update("type", e.target.value)}
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Số tiền</label>
                    <input
                      type="number"
                      min="1"
                      value={form.amount}
                      onChange={(e) => update("amount", e.target.value)}
                      placeholder="0"
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Ngày</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => update("date", e.target.value)}
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button className="w-full rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
                  Thêm giao dịch
                </button>
              </form>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Giao dịch gần đây</h2>
                <p className="text-sm text-slate-500">Xem lại lịch sử chi tiêu và thu nhập.</p>
              </div>
              <div className="space-y-4">
                {user.transactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên.
                  </div>
                ) : (
                  user.transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.category} · {t.date}</p>
                      </div>
                      <p className={`font-semibold text-sm ${t.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                        {t.amount < 0 ? "-" : "+"}
                        {formatVND(Math.abs(t.amount))}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Tổng quan nhanh</h2>
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Số dư hiện tại</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatVND(balance)}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Thu nhập</p>
                    <p className="mt-2 text-2xl font-semibold text-green-600">{formatVND(monthlyIncome)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Chi tiêu</p>
                    <p className="mt-2 text-2xl font-semibold text-red-500">{formatVND(monthlyExpense)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Mẹo nhanh</h2>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>• Cập nhật giao dịch ngay khi phát sinh.</li>
                <li>• Sử dụng danh mục để theo dõi tốt hơn.</li>
                <li>• Kiểm tra số dư trước khi chi tiêu.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

