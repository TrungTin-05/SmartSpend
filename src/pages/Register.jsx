import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, registerUser } from "../services/auth.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    const result = await registerUser(form);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError("");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white">
      <h1 className="text-2xl font-bold text-brand-dark mb-1">Tạo tài khoản</h1>
      <p className="text-gray-500 text-sm mb-6">Bắt đầu quản lý chi tiêu thông minh hơn</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Họ và tên</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="ban@gmail.com"
            className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Mật khẩu</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand text-white py-2.5 rounded-xl font-medium hover:bg-brand-dark transition"
        >
          Đăng ký
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-brand font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
