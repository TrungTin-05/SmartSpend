import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { addWallet, deleteWallet, getWallets, updateWallet } from "../services/auth.js";

const walletTypes = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e_wallet", label: "Ví điện tử" },
  { value: "card", label: "Thẻ" },
  { value: "other", label: "Tài khoản khác" },
];

function walletTypeLabel(type) {
  return walletTypes.find((item) => item.value === type)?.label || "Tài khoản khác";
}

function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

const emptyForm = { name: "", type: "cash", initialBalance: "0" };

export default function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadWallets() {
    setLoading(true);
    const result = await getWallets();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setWallets(result.wallets || []);
  }

  useEffect(() => {
    loadWallets();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(wallet) {
    setEditingId(wallet.id);
    setForm({
      name: wallet.name,
      type: wallet.type,
      initialBalance: String(wallet.initialBalance ?? 0),
    });
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Tên ví không được để trống.");
      setMessage("");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      initialBalance: Number(form.initialBalance),
    };
    const result = editingId
      ? await updateWallet(editingId, payload)
      : await addWallet(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    if (editingId) {
      setMessage("Đã cập nhật ví.");
    } else {
      setMessage("Đã thêm ví.");
    }
    await loadWallets();
    setError("");
    resetForm();
  }

  async function handleDelete(wallet) {
    if (!window.confirm(`Bạn có chắc muốn xóa ví "${wallet.name}" không?`)) {
      return;
    }

    const result = await deleteWallet(wallet.id);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setWallets((current) => current.filter((item) => item.id !== wallet.id));
    if (editingId === wallet.id) {
      resetForm();
    }
    setError("");
    setMessage("Đã xóa ví.");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sprint 2</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Ví và tài khoản</h1>
              <p className="mt-2 text-sm text-slate-500">Quản lý các nơi bạn lưu trữ tiền.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Về Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Chỉnh sửa ví" : "Thêm ví mới"}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Tên ví, ví dụ: Tiền mặt"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 md:col-span-1"
              />
              <select
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {walletTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="1"
                value={form.initialBalance}
                onChange={(event) => updateForm("initialBalance", event.target.value)}
                placeholder="Số dư ban đầu"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-3xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm ví"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-3xl bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-8 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải ví...</p>
            ) : wallets.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Chưa có ví nào. Hãy thêm ví đầu tiên.
              </p>
            ) : (
              wallets.map((wallet) => (
                <div key={wallet.id} className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{wallet.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {walletTypeLabel(wallet.type)}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <span>Số dư: <strong className="text-slate-900">{formatVND(wallet.balance)}</strong></span>
                      <span>Tổng thu: <strong className="text-emerald-600">{formatVND(wallet.incomeTotal)}</strong></span>
                      <span>Tổng chi: <strong className="text-rose-600">{formatVND(wallet.expenseTotal)}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(wallet)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(wallet)}
                      className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
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
