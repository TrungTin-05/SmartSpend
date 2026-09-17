import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/auth.js";

const items = [
  { to: "/dashboard", label: "Trang chủ", icon: "🏠" },
  { to: "/income", label: "Thu nhập", icon: "💵" },
  { to: "/expense", label: "Chi tiêu", icon: "🧾" },
  { to: "/categories", label: "Danh mục", icon: "📁" },
  { to: "/wallets", label: "Ví", icon: "💳" },
  { to: "/budgets", label: "Ngân sách", icon: "🎯" },
  { to: "/monthly-budget", label: "Ngân sách tháng", icon: "📅" },
  { to: "/monthly-report", label: "Báo cáo", icon: "📊" },
  { to: "/profile", label: "Hồ sơ", icon: "👤" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-sidebar");
    return () => document.body.classList.remove("has-sidebar");
  }, []);

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-20 border-r border-slate-200/80 bg-white/80 px-3 py-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:w-64 lg:px-4">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-center gap-3 border-b border-slate-100 pb-6 lg:justify-start lg:px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-teal-500 to-violet-500 text-2xl text-white shadow-lg shadow-cyan-200/50">
            💰
          </div>
          <div className="hidden lg:block">
            <p className="text-lg font-semibold text-slate-900">SmartSpend</p>
            <p className="text-xs text-slate-500">Quản lý chi tiêu</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition lg:justify-start ${
                  isActive
                    ? "bg-gradient-to-r from-brand to-cyan-500 text-white shadow-lg shadow-cyan-200/60"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand"
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="relative border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            title="Tài khoản"
            className="flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-brand lg:justify-start"
          >
            <span className="text-lg leading-none">⚙️</span>
            <span className="hidden lg:block">Tài khoản</span>
          </button>
          {profileOpen && (
            <div className="absolute bottom-14 left-0 z-50 w-52 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl lg:left-2">
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
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
