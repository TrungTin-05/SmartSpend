import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/auth.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      setError("Liên kết khôi phục không có token.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setMessage("");
      return;
    }

    setError("");
    setMessage(result.message);
    setPassword("");
    setConfirmation("");
    setTimeout(() => navigate("/login"), 1200);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Đặt lại mật khẩu</h1>
        <p className="text-gray-500 text-sm mb-8">Tạo mật khẩu mới cho tài khoản của bạn.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Mật khẩu mới</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ít nhất 8 ký tự"
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2.5 rounded-xl font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </button>
        </form>

        <Link to="/login" className="mt-6 block text-center text-sm font-medium text-brand hover:text-brand-dark">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
