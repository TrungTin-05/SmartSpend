import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  addTransaction,
  deleteTransaction,
  getCategories,
  getCurrentUser,
  getTransactions,
  getWallets,
  logout,
  updateTransaction,
} from "../services/auth.js";

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

const defaultExpenseCategories = ["Ăn uống", "Di chuyển", "Giải trí", "Khác"];
const ALL_WALLETS = "all";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const currentUser = getCurrentUser();
    return currentUser
      ? { ...currentUser, transactions: currentUser.transactions || [] }
      : null;
  });
  const [expenseCategories, setExpenseCategories] = useState(
    defaultExpenseCategories.map((name) => ({ id: name, name }))
  );
  const [incomeCategories, setIncomeCategories] = useState([{ id: "salary", name: "Lương" }]);
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(ALL_WALLETS);
  const [error, setError] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("all");
  const [transactionDateFrom, setTransactionDateFrom] = useState("");
  const [transactionDateTo, setTransactionDateTo] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: defaultExpenseCategories[0],
    amount: "",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
    walletId: "",
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

  useEffect(() => {
    if (!user) return;

    Promise.all([getCategories("expense"), getCategories("income")]).then(([expenseResult, incomeResult]) => {
      if (!expenseResult.error && expenseResult.categories.length > 0) {
        setExpenseCategories(expenseResult.categories);
      }
      if (!incomeResult.error && incomeResult.categories.length > 0) {
        setIncomeCategories(incomeResult.categories);
      }
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    getWallets().then((result) => {
      if (result.error) {
        setError(result.error);
        return;
      }

      const nextWallets = result.wallets || [];
      setWallets(nextWallets);
      const savedWalletId = localStorage.getItem(`smartspend-dashboard-wallet-${user.id}`);
      const hasSavedWallet = nextWallets.some((wallet) => String(wallet.id) === savedWalletId);
      setSelectedWalletId(hasSavedWallet ? savedWalletId : ALL_WALLETS);
      setForm((current) => ({
        ...current,
        walletId: current.walletId || String(nextWallets[0]?.id || ""),
      }));
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const selectedWalletExists = selectedWalletId === ALL_WALLETS
      || wallets.some((wallet) => String(wallet.id) === selectedWalletId);
    if (!selectedWalletExists) {
      setSelectedWalletId(ALL_WALLETS);
      localStorage.removeItem(`smartspend-dashboard-wallet-${user.id}`);
    }
  }, [wallets, selectedWalletId, user]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    getTransactions().then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        return;
      }

      const nextUser = { ...user, transactions: result.transactions || [] };
      setUser(nextUser);
    });

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const categoryOptions = form.type === "expense" ? expenseCategories : incomeCategories;
  const displayedCategoryOptions = categoryOptions.some((category) => category.name === form.category)
    ? categoryOptions
    : [{ id: form.category, name: form.category }, ...categoryOptions];

  const transactionCategoryOptions = useMemo(() => {
    const categories = transactionTypeFilter === "expense"
      ? expenseCategories
      : transactionTypeFilter === "income"
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];
    const uniqueCategories = new Map(categories.map((category) => [category.name, category]));
    return Array.from(uniqueCategories.values());
  }, [transactionTypeFilter, expenseCategories, incomeCategories]);

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => String(wallet.id) === selectedWalletId) || null,
    [wallets, selectedWalletId]
  );

  const scopedTransactions = useMemo(
    () => selectedWallet
      ? (user.transactions || []).filter((transaction) => String(transaction.walletId) === String(selectedWallet.id))
      : user.transactions || [],
    [selectedWallet, user.transactions]
  );

  const transactionDateFilterError = transactionDateFrom && transactionDateTo && transactionDateFrom > transactionDateTo
    ? "Ngày bắt đầu không được sau ngày kết thúc."
    : "";

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = transactionSearch.trim().toLocaleLowerCase();
    if (transactionDateFilterError) {
      return [];
    }

    return scopedTransactions.filter((transaction) => {
      const matchesSearch = !normalizedSearch || transaction.name.toLocaleLowerCase().includes(normalizedSearch);
      const matchesType = transactionTypeFilter === "all" || transaction.type === transactionTypeFilter;
      const matchesCategory = transactionCategoryFilter === "all" || transaction.category === transactionCategoryFilter;
      const matchesDateFrom = !transactionDateFrom || transaction.date >= transactionDateFrom;
      const matchesDateTo = !transactionDateTo || transaction.date <= transactionDateTo;
      return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [
    scopedTransactions,
    transactionSearch,
    transactionTypeFilter,
    transactionCategoryFilter,
    transactionDateFrom,
    transactionDateTo,
    transactionDateFilterError,
  ]);

  function clearTransactionFilters() {
    setTransactionSearch("");
    setTransactionTypeFilter("all");
    setTransactionCategoryFilter("all");
    setTransactionDateFrom("");
    setTransactionDateTo("");
  }

  const totalWalletBalance = useMemo(
    () => (wallets || []).reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0),
    [wallets]
  );

  const totalWalletIncome = useMemo(
    () => (wallets || []).reduce((sum, wallet) => sum + Number(wallet.incomeTotal || 0), 0),
    [wallets]
  );

  const totalWalletExpense = useMemo(
    () => (wallets || []).reduce((sum, wallet) => sum + Number(wallet.expenseTotal || 0), 0),
    [wallets]
  );

  const selectedWalletTotals = useMemo(() => {
    if (!selectedWallet) {
      return {
        balance: totalWalletBalance,
        income: totalWalletIncome,
        expense: totalWalletExpense,
      };
    }

    return {
      balance: Number(selectedWallet.balance || 0),
      income: Number(selectedWallet.incomeTotal || 0),
      expense: Number(selectedWallet.expenseTotal || 0),
    };
  }, [selectedWallet, totalWalletBalance, totalWalletIncome, totalWalletExpense]);

  const balance = selectedWalletTotals.balance;

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
    scopedTransactions.forEach((t) => {
      const parsed = new Date(t.date);
      if (!Number.isNaN(parsed.getFullYear())) {
        years.add(parsed.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [scopedTransactions, today]);

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
    const selectedTransactions = scopedTransactions.filter((transaction) => {
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
  }, [selectedRangeConfig, selectedYear, scopedTransactions]);

  const sortedTransactions = useMemo(
    () => [...scopedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [scopedTransactions]
  );

  const dailyIncome = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount > 0 && sameDay(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTransactions, sameDay]
  );

  const dailyExpense = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount < 0 && sameDay(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [scopedTransactions, sameDay]
  );

  const weeklyIncome = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount > 0 && inLast7Days(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTransactions, inLast7Days]
  );

  const weeklyExpense = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount < 0 && inLast7Days(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [scopedTransactions, inLast7Days]
  );

  const monthlyIncome = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount > 0 && inLast30Days(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTransactions, inLast30Days]
  );

  const monthlyExpense = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount < 0 && inLast30Days(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [scopedTransactions, inLast30Days]
  );

  const yearIncome = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount > 0 && inSelectedYear(t.date))
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTransactions, inSelectedYear]
  );

  const yearExpense = useMemo(
    () =>
      scopedTransactions
        .filter((t) => t.amount < 0 && inSelectedYear(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [scopedTransactions, inSelectedYear]
  );

  const dailyNet = dailyIncome - dailyExpense;
  const weeklyNet = weeklyIncome - weeklyExpense;
  const monthlyNet = monthlyIncome - monthlyExpense;
  const yearNet = yearIncome - yearExpense;

  const topCategoryData = useMemo(() => {
    const expenseTotals = {};
    const incomeTotals = {};

    scopedTransactions.forEach((t) => {
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
  }, [scopedTransactions]);

  const smartMessage = monthlyNet >= 0 ? "Bạn đang kiểm soát chi tiêu tốt." : "Cảnh báo: chi tiêu đang vượt thu nhập.";

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleWalletChange(event) {
    const nextWalletId = event.target.value;
    setSelectedWalletId(nextWalletId);
    if (nextWalletId === ALL_WALLETS) {
      localStorage.removeItem(`smartspend-dashboard-wallet-${user.id}`);
    } else {
      localStorage.setItem(`smartspend-dashboard-wallet-${user.id}`, nextWalletId);
    }
  }

  function resetTransactionForm() {
    setEditingTransactionId(null);
    setForm({
      name: "",
      category: defaultExpenseCategories[0],
      amount: "",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
      walletId: String(wallets[0]?.id || ""),
    });
  }

  function startEditingTransaction(transaction) {
    setEditingTransactionId(transaction.id);
    setForm({
      name: transaction.name,
      category: transaction.category,
      amount: Math.abs(transaction.amount),
      type: transaction.type,
      date: transaction.date,
      walletId: String(transaction.walletId || wallets[0]?.id || ""),
    });
    setError("");
  }

  async function handleSaveTransaction(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.name.trim() || !form.category || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setError("Vui lòng nhập tên, danh mục, số tiền lớn hơn 0 và ngày giao dịch.");
      return;
    }

    const transaction = {
      type: form.type,
      name: form.name.trim(),
      category: form.category,
      amount: Math.abs(amount),
      note: "",
      date: form.date,
      walletId: form.walletId || undefined,
    };

    setSavingTransaction(true);
    const result = editingTransactionId
      ? await updateTransaction(editingTransactionId, transaction)
      : await addTransaction(transaction);
    setSavingTransaction(false);
    if (result.error) {
      if (!getCurrentUser()) {
        setUser(null);
        return;
      }
      setError(result.error);
      return;
    }

    setUser(result.user);
    const walletResult = await getWallets();
    if (!walletResult.error) {
      setWallets(walletResult.wallets || []);
    }
    setError("");
    resetTransactionForm();
  }

  async function handleDeleteTransaction(transaction) {
    setPendingDeleteTransaction(transaction);
  }

  async function confirmDeleteTransaction() {
    if (!pendingDeleteTransaction) {
      return;
    }

    setSavingTransaction(true);
    const result = await deleteTransaction(pendingDeleteTransaction.id);
    setSavingTransaction(false);
    setPendingDeleteTransaction(null);
    if (result.error) {
      if (!getCurrentUser()) {
        setUser(null);
        return;
      }
      setError(result.error);
      return;
    }

    setUser(result.user);
    const walletResult = await getWallets();
    if (!walletResult.error) {
      setWallets(walletResult.wallets || []);
    }
    setError("");
    if (editingTransactionId === pendingDeleteTransaction.id) {
      resetTransactionForm();
    }
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/80">Số dư</p>
                  <select
                    aria-label="Chọn ví"
                    value={selectedWalletId}
                    onChange={handleWalletChange}
                    className="rounded-2xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 [&>option]:text-slate-900"
                  >
                    <option value={ALL_WALLETS}>Tất cả các ví</option>
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-4 text-5xl font-bold">{formatVND(balance)}</p>
              </div>
            </header>

            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Thu nhập</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">{formatVND(selectedWalletTotals.income)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Chi tiêu</p>
                  <p className="mt-2 text-3xl font-semibold text-red-500">{formatVND(selectedWalletTotals.expense)}</p>
                </div>
              </div>
            </div>

            {wallets.length > 0 && (
              <section className="rounded-[32px] bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Số dư theo ví</h2>
                <div className="mt-5 space-y-3">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{wallet.name}</p>
                        <p className="text-xs text-slate-500">Thu: {formatVND(wallet.incomeTotal || 0)} · Chi: {formatVND(wallet.expenseTotal || 0)}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{formatVND(wallet.balance || 0)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingTransactionId ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
                  </h2>
                  <p className="text-sm text-slate-500">Ghi chú thu nhập hoặc chi tiêu ngay trong dashboard.</p>
                </div>
                {editingTransactionId && (
                  <button
                    type="button"
                    onClick={resetTransactionForm}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveTransaction} className="space-y-5">
                <div>
                  <label className="text-sm text-slate-600">Tên giao dịch</label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ví dụ: Mua cà phê"
                    className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-slate-600">Danh mục</label>
                    <select
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {displayedCategoryOptions.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Loại</label>
                    <select
                      value={form.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        update("type", nextType);
                        update(
                          "category",
                          nextType === "expense"
                            ? expenseCategories[0]?.name || defaultExpenseCategories[0]
                            : incomeCategories[0]?.name || "Lương"
                        );
                      }}
                      className="w-full mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Ví</label>
                    <select
                      value={form.walletId}
                      onChange={(e) => update("walletId", e.target.value)}
                      disabled={wallets.length === 0}
                      className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {wallets.length === 0 ? (
                        <option value="">Chưa có ví</option>
                      ) : (
                        wallets.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </option>
                        ))
                      )}
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
                <button
                  type="submit"
                  disabled={savingTransaction}
                  className="w-full rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTransaction ? "Đang lưu..." : editingTransactionId ? "Lưu thay đổi" : "Thêm giao dịch"}
                </button>
              </form>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Giao dịch gần đây</h2>
                <p className="text-sm text-slate-500">Xem lại lịch sử chi tiêu và thu nhập.</p>
              </div>
              <div className="mb-6 grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2 xl:col-span-3">
                  <label className="text-sm text-slate-600">Tìm theo tên giao dịch</label>
                  <input
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    placeholder="Ví dụ: Ăn sáng"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Loại giao dịch</label>
                  <select
                    value={transactionTypeFilter}
                    onChange={(e) => {
                      setTransactionTypeFilter(e.target.value);
                      setTransactionCategoryFilter("all");
                    }}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="all">Tất cả</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi tiêu</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Danh mục</label>
                  <select
                    value={transactionCategoryFilter}
                    onChange={(e) => setTransactionCategoryFilter(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="all">Tất cả</option>
                    {transactionCategoryOptions.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Từ ngày</label>
                  <input
                    type="date"
                    value={transactionDateFrom}
                    onChange={(e) => setTransactionDateFrom(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Đến ngày</label>
                  <input
                    type="date"
                    value={transactionDateTo}
                    onChange={(e) => setTransactionDateTo(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearTransactionFilters}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
                {transactionDateFilterError && (
                  <p className="text-sm text-red-500 md:col-span-2 xl:col-span-3">{transactionDateFilterError}</p>
                )}
              </div>
              <div className="space-y-4">
                {scopedTransactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    {selectedWallet ? "Ví này chưa có giao dịch nào." : "Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên."}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Không tìm thấy giao dịch phù hợp.
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t.type === "income" ? "Thu nhập" : "Chi tiêu"} · {t.category} · {t.wallet?.name || "Chưa gán ví"} · {formatDate(t.date)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                              t.amount < 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {t.amount < 0 ? "-" : "+"}
                            {formatVND(Math.abs(t.amount))}
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditingTransaction(t)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t)}
                            disabled={savingTransaction}
                            className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xóa
                          </button>
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
      {pendingDeleteTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingTransaction) {
              setPendingDeleteTransaction(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-xl text-rose-600">
                !
              </div>
              <div>
                <h2 id="delete-transaction-title" className="text-lg font-semibold text-slate-900">
                  Xóa giao dịch?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Bạn có chắc muốn xóa giao dịch “{pendingDeleteTransaction.name}” không?
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={savingTransaction}
                onClick={() => setPendingDeleteTransaction(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingTransaction}
                onClick={confirmDeleteTransaction}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTransaction ? "Đang xóa..." : "Xóa giao dịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

