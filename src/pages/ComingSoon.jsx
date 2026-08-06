import React from "react";
import BottomNav from "../components/BottomNav.jsx";

export default function ComingSoon({ title }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20">
        <div className="w-full rounded-[32px] bg-white p-16 shadow-lg">
          <div className="text-7xl mb-6 flex justify-center">🚧</div>
          <h1 className="text-4xl font-semibold text-slate-900 text-center">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-500">
            Chức năng này vẫn đang hoàn thiện. Hãy quay lại sau để xem các công cụ quản lý thu nhập, chi tiêu và hồ sơ cá nhân.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <span className="rounded-full bg-brand-light px-5 py-3 text-sm font-semibold text-brand">
              Coming Soon
            </span>
            <a
              href="/dashboard"
              className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Quay lại Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
