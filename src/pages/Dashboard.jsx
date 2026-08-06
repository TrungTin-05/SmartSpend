import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { addTransaction, getCurrentUser, logout } from "../services/auth.js";

function formatVND(n) {
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
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
  const [selectedRange, setSelectedRange] = useState("last30Days");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const year = new Date().getFullYear();
    return `${year}-01-01`;
  });
  const [yearRangeEnd, setYearRangeEnd] = useState(() => {
    const year = new Date().getFullYear();
    return `${year}-12-31`;
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

  const today = useMemo(() => {
    const now = new Date();
    const current = new Date(now);
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);

  const effectiveToday = useMemo(() => {
    if (selectedRange !== "year") {
      return today;
    }
    const anchored = new Date(today);
    anchored.setFullYear(selectedYear);
    const month = anchored.getMonth();
    const day = anchored.getDate();
    const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
    anchored.setDate(Math.min(day, daysInMonth));
    anchored.setHours(0, 0, 0, 0);
    return anchored;
  }, [selectedRange, selectedYear, today]);

  const yearRangeStartObj = useMemo(() => {
    const date = new Date(yearRangeStart);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [yearRangeStart]);

  const yearRangeEndObj = useMemo(() => {
    const date = new Date(yearRangeEnd);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [yearRangeEnd]);

  const [normalizedYearStart, normalizedYearEnd] = useMemo(() => {
    if (yearRangeStartObj <= yearRangeEndObj) {
      return [yearRangeStartObj, yearRangeEndObj];
    }
    return [yearRangeEndObj, yearRangeStartObj];
  }, [yearRangeStartObj, yearRangeEndObj]);

  useEffect(() => {
    const startOfYear = `${selectedYear}-01-01`;
    const endOfYear = `${selectedYear}-12-31`;
    setYearRangeStart(startOfYear);
    setYearRangeEnd(endOfYear);
  }, [selectedYear]);

  const sameDay = useMemo(
    () => (date) => {
      const parsed = new Date(date);
      return (
        parsed.getFullYear() === effectiveToday.getFullYear() &&
        parsed.getMonth() === effectiveToday.getMonth() &&
        parsed.getDate() === effectiveToday.getDate()
      );
    },
    [effectiveToday]
  );

  const startOfWeek = useMemo(() => {
    const current = new Date(effectiveToday);
    const dayIndex = (current.getDay() + 6) % 7;
    current.setDate(current.getDate() - dayIndex);
    current.setHours(0, 0, 0, 0);
    return current;
  }, [effectiveToday]);

  const startOfNextWeek = useMemo(() => {
    const next = new Date(startOfWeek);
    next.setDate(next.getDate() + 7);
    return next;
  }, [startOfWeek]);

  const startOfLast7Days = useMemo(() => {
    const date = new Date(effectiveToday);
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [effectiveToday]);

  const startOfLast30Days = useMemo(() => {
    const date = new Date(effectiveToday);
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [effectiveToday]);

  const startOfYear = useMemo(() => {
    const date = new Date(effectiveToday);
    date.setMonth(0, 0);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [effectiveToday]);

  const selectedYearRangeLabel = useMemo(() => {
    if (selectedRange !== "year") return null;
    return `${selectedYear}`;
  }, [selectedRange, selectedYear]);

  const yearOptions = useMemo(() => {
    const years = new Set([today.getFullYear()]);
    (user.transactions || []).forEach((t) => {
      const parsed = new Date(t.date);
      if (!Number.isNaN(parsed.getFullYear())) {
        years.add(parsed.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [user.transactions, today]);

  const startOfSelectedYear = useMemo(() => {
    const date = new Date(selectedYear, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedYear]);

  const endOfSelectedYear = useMemo(() => {
    const date = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    return date;
  }, [selectedYear]);

  const inLast7Days = useMemo(
    () => (date) => {
      const parsed = new Date(date);
      return parsed >= startOfLast7Days && parsed <= effectiveToday;
    },
    [startOfLast7Days, effectiveToday]
  );

  const inLast30Days = useMemo(
    () => (date) => {
      const parsed = new Date(date);
      return parsed >= startOfLast30Days && parsed <= effectiveToday;
    },
    [startOfLast30Days, effectiveToday]
  );

  const inSelectedYear = useMemo(
    () => (date) => {
      const parsed = new Date(date);
      return parsed >= normalizedYearStart && parsed <= normalizedYearEnd;
    },
    [normalizedYearStart, normalizedYearEnd]
  );

  const rangeOptions = useMemo(
    () => [
      {
        key: "today",
        label: "Hôm nay",
        filter: sameDay,
        rangeLabel: formatDate(effectiveToday.toISOString()),
      },
      {
        key: "last7Days",
        label: "7 ngày",
        filter: inLast7Days,
        rangeLabel: formatDateRange(startOfLast7Days.toISOString(), effectiveToday.toISOString()),
      },
      {
        key: "last30Days",
        label: "30 ngày",
        filter: inLast30Days,
        rangeLabel: formatDateRange(startOfLast30Days.toISOString(), effectiveToday.toISOString()),
      },
      {
        key: "year",
        label: "Năm",
        filter: inSelectedYear,
        rangeLabel: formatDateRange(normalizedYearStart.toISOString(), normalizedYearEnd.toISOString()),
      },
    ],
    [
      effectiveToday,
      startOfLast7Days,
      startOfLast30Days,
      normalizedYearStart,
      normalizedYearEnd,
      sameDay,
      inLast7Days,
      inLast30Days,
      inSelectedYear,
    ]
  );

  const selectedRangeConfig = useMemo(
    () => rangeOptions.find((option) => option.key === selectedRange) || rangeOptions[2],
    [rangeOptions, selectedRange]
  );

  const selectedSummary = useMemo(() => {
    const selectedTransactions = (user.transactions || []).filter((transaction) => {
      return selectedRangeConfig.filter(transaction.date);
    });

    const income = selectedTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = selectedTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = income - expense;

    const expenseTotals = {};
    const incomeTotals = {};
    selectedTransactions.forEach((t) => {
      if (t.type === "expense") {
        expenseTotals[t.category] = (expenseTotals[t.category] || 0) + Math.abs(t.amount);
      } else if (t.type === "income") {
        incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount;
      }
    });

    const topExpense = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chưa có";
    const topIncome = Object.entries(incomeTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chưa có";

    return {
      label:
        selectedRangeConfig.key === "year"
          ? `${selectedRangeConfig.label} ${selectedYear}`
          : selectedRangeConfig.label,
      rangeLabel: selectedRangeConfig.rangeLabel,
      income,
      expense,
      net,
      topExpense,
      topIncome,
    };
  }, [selectedRangeConfig, selectedYear, user.transactions]);

  const sortedTransactions = useMemo(
    () => [...(user.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [user.transactions]
  );

  const dailyIncome = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount > 0 && sameDay(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [user.transactions, sameDay]
  );

  const dailyExpense = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount < 0 && sameDay(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [user.transactions, sameDay]
  );

  const weeklyIncome = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount > 0 && inLast7Days(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [user.transactions, inLast7Days]
  );

  const weeklyExpense = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount < 0 && inLast7Days(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [user.transactions, inLast7Days]
  );

  const monthlyIncome = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount > 0 && inLast30Days(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [user.transactions, inLast30Days]
  );

  const monthlyExpense = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount < 0 && inLast30Days(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [user.transactions, inLast30Days]
  );

  const yearIncome = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount > 0 && inSelectedYear(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [user.transactions, inSelectedYear]
  );

  const yearExpense = useMemo(
    () =>
      (user.transactions || [])
        .filter((t) => t.amount < 0 && inSelectedYear(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [user.transactions, inSelectedYear]
  );

  const dailyNet = dailyIncome - dailyExpense;
  const weeklyNet = weeklyIncome - weeklyExpense;
  const monthlyNet = monthlyIncome - monthlyExpense;
  const yearNet = yearIncome - yearExpense;

  const topCategoryData = useMemo(() => {
    const expenseTotals = {};
    const incomeTotals = {};

    (user.transactions || []).forEach((t) => {
      if (t.type === "expense") {
        expenseTotals[t.category] = (expenseTotals[t.category] || 0) + Math.abs(t.amount);
      } else if (t.type === "income") {
        incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount;
      }
    });

    const findTop = (totals) => {
      const entries = Object.entries(totals);
      if (entries.length === 0) return null;
      return entries.sort((a, b) => b[1] - a[1])[0][0];
    };

    return {
      topExpense: findTop(expenseTotals) || "Chưa có",
      topIncome: findTop(incomeTotals) || "Chưa có",
    };
  }, [user.transactions]);

  const smartMessage = monthlyNet >= 0 ? "Bạn đang kiểm soát chi tiêu tốt." : "Cảnh báo: chi tiêu đang vượt thu nhập.";

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
                      className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t.type === "income" ? "Thu nhập" : "Chi tiêu"} · {t.category} · {formatDate(t.date)}
                          </p>
                        </div>
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                            t.amount < 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {t.amount < 0 ? "-" : "+"}
                          {formatVND(Math.abs(t.amount))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Tổng quan nhanh</h2>
              <p className="mb-6 text-sm text-slate-500">Tóm tắt thu chi thông minh theo khung thời gian để bạn dễ dàng theo dõi.</p>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                {rangeOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedRange(option.key)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedRange === option.key
                        ? "bg-brand text-white shadow"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedRange === "year" && (
                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Năm xem
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bắt đầu
                    </label>
                    <input
                      type="date"
                      min={`${selectedYear}-01-01`}
                      max={`${selectedYear}-12-31`}
                      value={yearRangeStart}
                      onChange={(e) => setYearRangeStart(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kết thúc
                    </label>
                    <input
                      type="date"
                      min={`${selectedYear}-01-01`}
                      max={`${selectedYear}-12-31`}
                      value={yearRangeEnd}
                      onChange={(e) => setYearRangeEnd(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{selectedSummary.label}</p>
                      <p className="mt-2 text-xs text-slate-500">{selectedSummary.rangeLabel}</p>
                      <p className="mt-2 text-xs text-slate-500">{selectedSummary.net >= 0 ? "Dư dả" : "Cần tiết kiệm hơn"}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedSummary.net >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {selectedSummary.net >= 0 ? "Tốt" : "Cảnh báo"}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Thu nhập</p>
                      <p className="mt-3 text-xl font-semibold text-emerald-600">{formatVND(selectedSummary.income)}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Chi tiêu</p>
                      <p className="mt-3 text-xl font-semibold text-rose-600">{formatVND(selectedSummary.expense)}</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-3xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Dư còn lại</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedSummary.net >= 0 ? "+" : "-"}{formatVND(Math.abs(selectedSummary.net))}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Gợi ý thông minh</h2>
                  <p className="text-sm text-slate-500">Những điểm cần chú ý và tham khảo.</p>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                  {smartMessage.includes("Cảnh báo") ? "Quan sát" : "Ổn định"}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Ngân sách hiện tại</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{smartMessage}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Danh mục chi tiêu nhiều nhất</p>
                  <p className="mt-2 text-lg font-semibold text-rose-600">{topCategoryData.topExpense}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Danh mục thu nhập chính</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-600">{topCategoryData.topIncome}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

