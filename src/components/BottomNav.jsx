import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/auth.js";

const items = [
  { to: "/dashboard", label: "Trang chủ", icon: "🏠" },
  { to: "/income", label: "Thu nhập", icon: "💵" },
  { to: "/expense", label: "Chi tiêu", icon: "🧾" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand text-2xl text-white shadow-lg shadow-emerald-200/40">
            💰
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">SmartSpend</p>
            <p className="text-xs text-slate-500">Quản lý chi tiêu thông minh</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
            >
              <span>👤</span>
              Hồ sơ
            </button>
            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-44 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full rounded-2xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  Xem hồ sơ
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
