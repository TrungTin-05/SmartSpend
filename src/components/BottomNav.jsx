import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Trang chủ", icon: "🏠" },
  { to: "/income", label: "Thu nhập", icon: "💵" },
  { to: "/expense", label: "Chi tiêu", icon: "🧾" },
  { to: "/profile", label: "Hồ sơ", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto bg-white border-t flex justify-around py-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs px-3 py-1 rounded-lg ${
              isActive ? "text-brand font-semibold" : "text-gray-400"
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
