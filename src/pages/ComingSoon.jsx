import React from "react";
import BottomNav from "../components/BottomNav.jsx";

export default function ComingSoon({ title }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h1 className="text-lg font-semibold text-gray-700">{title}</h1>
      <p className="text-gray-400 text-sm mt-1">
        Chức năng đang được phát triển ở Sprint tiếp theo.
      </p>
      <span className="mt-4 inline-block bg-brand-light text-brand text-xs font-medium px-3 py-1 rounded-full">
        Coming Soon
      </span>
      <BottomNav />
    </div>
  );
}
