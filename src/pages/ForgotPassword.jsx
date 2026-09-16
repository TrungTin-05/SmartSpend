import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/auth.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      setMessage("");
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setMessage("");
      setResetUrl("");
      return;
    }

    setError("");
    setMessage(result.message);
    setResetUrl(result.developmentResetUrl || "");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Khôi phục mật khẩu</h1>
        <p className="text-gray-500 text-sm mb-8">Nhập email tài khoản để tạo liên kết đặt lại mật khẩu.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@gmail.com"
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {resetUrl && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Development mode</p>
              <p className="mt-1">Chưa cấu hình email provider. Dùng liên kết test bên dưới:</p>
              <Link to={resetUrl.replace(window.location.origin, "")} className="mt-2 block break-all underline">
                {resetUrl}
              </Link>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2.5 rounded-xl font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            {loading ? "Đang tạo liên kết..." : "Tạo liên kết khôi phục"}
          </button>
        </form>

        <Link to="/login" className="mt-6 block text-center text-sm font-medium text-brand hover:text-brand-dark">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
