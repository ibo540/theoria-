"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { saveUserToSupabase } from "@/lib/user-utils";
import { Lock, User, UserCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username.trim() || !password.trim() || !name.trim()) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    const success = login(username, password, name);
    
    if (success) {
      // Save user to Supabase (don't block login if this fails)
      try {
        await saveUserToSupabase(username, name);
      } catch (error) {
        console.warn("Failed to save user to Supabase, but login continues:", error);
        // Login still succeeds even if Supabase save fails
      }
      
      router.push("/admin");
    } else {
      setError("Invalid credentials. Please check your username and password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1114] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#14161a]/90 to-[#0f1114]/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#ffe4be]/20 p-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#ffe4be]/20 to-[#ffe4be]/10 rounded-xl shadow-lg shadow-[#ffe4be]/20 mb-4 border border-[#ffe4be]/30">
              <Lock className="w-8 h-8 text-[#ffe4be]" />
            </div>
            <h1 className="text-3xl font-bold text-[#ffe4be] mb-2">Admin Login</h1>
            <p className="text-[#ffe4be]/70 text-sm">Enter your credentials to access the dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#ffe4be]/80 mb-2">
                <UserCircle className="w-4 h-4 inline mr-2 text-[#ffe4be]/70" />
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all autofill:bg-[#14161a]/50 autofill:text-[#ffe4be]"
                style={{ color: '#ffe4be' }}
                required
              />
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#ffe4be]/80 mb-2">
                <User className="w-4 h-4 inline mr-2 text-[#ffe4be]/70" />
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all autofill:bg-[#14161a]/50 autofill:text-[#ffe4be]"
                style={{ color: '#ffe4be' }}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#ffe4be]/80 mb-2">
                <Lock className="w-4 h-4 inline mr-2 text-[#ffe4be]/70" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all autofill:bg-[#14161a]/50 autofill:text-[#ffe4be]"
                style={{ color: '#ffe4be' }}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#ffe4be]/20 to-[#ffe4be]/10 text-[#ffe4be] rounded-lg font-semibold border border-[#ffe4be]/30 hover:from-[#ffe4be]/30 hover:to-[#ffe4be]/20 hover:border-[#ffe4be]/50 transition-all duration-300 shadow-lg shadow-[#ffe4be]/20 hover:shadow-xl hover:shadow-[#ffe4be]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-[#ffe4be]/50">
            <p>Protected Admin Area</p>
          </div>
        </div>
      </div>
    </div>
  );
}
