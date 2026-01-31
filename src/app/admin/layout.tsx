"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Mark body as admin page for cursor styling
    document.body.setAttribute("data-admin", "true");
    document.documentElement.setAttribute("data-admin", "true");

    return () => {
      document.body.removeAttribute("data-admin");
      document.documentElement.removeAttribute("data-admin");
    };
  }, []);

  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 selection:bg-blue-500/30 selection:text-white`}>
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
