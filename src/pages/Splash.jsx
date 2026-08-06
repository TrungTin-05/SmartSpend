import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand text-white">
      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl mb-4">
        💰
      </div>
      <h1 className="text-2xl font-bold tracking-wide">SmartSpend</h1>
      <p className="text-sm text-white/80 mt-1">Quản lý chi tiêu cá nhân</p>
      <div className="mt-10 w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}
