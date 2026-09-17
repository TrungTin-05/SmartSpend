import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { getCurrentUser, getProfile, updateProfile } from "../services/auth.js";

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    const user = getCurrentUser();
    return {
      name: user?.name || "",
      email: user?.email || "",
      currency: user?.currency || "VND",
    };
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProfile().then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setForm({
        name: result.user.name || "",
        email: result.user.email || "",
        currency: result.user.currency || "VND",
      });
    });
    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const result = await updateProfile(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm({
      name: result.user.name || "",
      email: result.user.email || "",
      currency: result.user.currency || "VND",
    });
    setMessage("Thông tin cá nhân đã được cập nhật.");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Tài khoản</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hồ sơ cá nhân</h1>
              <p className="mt-2 text-sm text-slate-500">Cập nhật thông tin tài khoản của bạn.</p>
            </div>
            <button type="button" onClick={() => navigate("/dashboard")} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              Về Dashboard
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-slate-500">Đang tải thông tin cá nhân...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm text-slate-600">
                Họ tên
                <input name="name" value={form.name} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </label>
              <label className="block text-sm text-slate-600">
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </label>
              <label className="block text-sm text-slate-600">
                Đơn vị tiền tệ
                <select name="currency" value={form.currency} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                  <option value="VND">VND - Việt Nam đồng</option>
                  <option value="USD">USD - Đô la Mỹ</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </label>

              {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-600">{error}</p>}
              {message && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}

              <button type="submit" disabled={saving} className="w-full rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
