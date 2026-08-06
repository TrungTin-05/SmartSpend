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

  function handleLogout() {
    logout();
    navigate("/login");
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-brand text-white px-6 pt-6 pb-5 rounded-b-3xl relative">
        <button
          onClick={handleLogout}
          className="absolute right-4 top-4 text-xs bg-white/10 px-3 py-2 rounded-full hover:bg-white/20"
        >
          Đăng xuất
        </button>
        <p className="text-white/80 text-sm">Xin chào, {user.name} 👋</p>
        <h1 className="text-lg font-semibold">Bảng điều khiển của bạn</h1>
        <div className="mt-5">
          <p className="text-white/70 text-xs">Tổng số dư</p>
          <p className="text-3xl font-bold">{formatVND(balance)}</p>
        </div>
      </header>

      <section className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow p-4 flex justify-between text-center">
          <div>
            <p className="text-xs text-gray-400">Thu nhập</p>
            <p className="text-green-600 font-semibold">{formatVND(monthlyIncome)}</p>
          </div>
          <div className="border-l" />
          <div>
            <p className="text-xs text-gray-400">Chi tiêu</p>
            <p className="text-red-500 font-semibold">{formatVND(monthlyExpense)}</p>
          </div>
        </div>
      </section>

      <section className="px-6 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Thêm giao dịch mới</h2>
        </div>
        <form onSubmit={handleAddTransaction} className="space-y-3 bg-white rounded-3xl p-4 shadow-sm">
          <div>
            <label className="text-sm text-gray-600">Tên giao dịch</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ví dụ: Mua cà phê"
              className="w-full mt-2 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full mt-2 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Loại</label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="w-full mt-2 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="expense">Chi tiêu</option>
                <option value="income">Thu nhập</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Số tiền</label>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="0"
                className="w-full mt-2 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full mt-2 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-brand text-white py-3 rounded-2xl font-medium hover:bg-brand-dark transition">
            Thêm giao dịch
          </button>
        </form>
      </section>

      <section className="px-6 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Giao dịch gần đây</h2>
        </div>
        <div className="space-y-3">
          {user.transactions.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-sm text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400">
                  {t.category} · {t.date}
                </p>
              </div>
              <p className={`font-semibold text-sm ${t.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                {t.amount < 0 ? "-" : "+"}
                {formatVND(Math.abs(t.amount))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
