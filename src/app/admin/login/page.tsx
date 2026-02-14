"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { saveUserToSupabase } from "@/lib/user-utils";
import { saveContributorToSupabase } from "@/lib/contributor-utils";
import { Lock, User, UserCircle, Shield, Mail, Phone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"admin" | "contributor">("contributor");

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

    if (loginMode === "contributor" && (!email.trim() || !phone.trim())) {
      setError("As a contributor, please provide your email and phone number");
      setIsLoading(false);
      return;
    }

    const success = login(username, password, name, loginMode);
    
    if (success) {
      // Save user/contributor to Supabase (don't block login if this fails)
      try {
        if (loginMode === "contributor") {
          // Save as contributor (with email and phone)
          await saveContributorToSupabase(username, name, "contributor", email.trim(), phone.trim());
        } else {
          // Save as admin (existing logic)
          await saveUserToSupabase(username, name);
          await saveContributorToSupabase(username, name, "admin");
        }
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
            <h1 className="text-3xl font-bold text-[#ffe4be] mb-2">
              {loginMode === "admin" ? "Admin Login" : "Contributor Login"}
            </h1>
            <p className="text-[#ffe4be]/70 text-sm">
              {loginMode === "admin" 
                ? "Enter your credentials to access the dashboard" 
                : "Sign in as a contributor to add events"}
            </p>
          </div>

          {/* Login Mode Toggle */}
          <div className="mb-6 flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setLoginMode("contributor")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                loginMode === "contributor"
                  ? "bg-[#ffe4be]/20 text-[#ffe4be] border border-[#ffe4be]/40"
                  : "bg-[#14161a]/50 text-[#ffe4be]/60 border border-[#ffe4be]/20 hover:border-[#ffe4be]/30"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Contributor
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("admin")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                loginMode === "admin"
                  ? "bg-[#ffe4be]/20 text-[#ffe4be] border border-[#ffe4be]/40"
                  : "bg-[#14161a]/50 text-[#ffe4be]/60 border border-[#ffe4be]/20 hover:border-[#ffe4be]/30"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Admin
            </button>
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
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all"
                style={{ 
                  color: '#ffe4be',
                  backgroundColor: 'rgba(20, 22, 26, 0.5)',
                }}
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
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all"
                style={{ 
                  color: '#ffe4be',
                  backgroundColor: 'rgba(20, 22, 26, 0.5)',
                }}
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
                className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all"
                style={{ 
                  color: '#ffe4be',
                  backgroundColor: 'rgba(20, 22, 26, 0.5)',
                }}
                required
              />
            </div>

            {/* Email & Phone - only for contributors */}
            {loginMode === "contributor" && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#ffe4be]/80 mb-2">
                    <Mail className="w-4 h-4 inline mr-2 text-[#ffe4be]/70" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all"
                    style={{ 
                      color: '#ffe4be',
                      backgroundColor: 'rgba(20, 22, 26, 0.5)',
                    }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#ffe4be]/80 mb-2">
                    <Phone className="w-4 h-4 inline mr-2 text-[#ffe4be]/70" />
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-[#14161a]/50 border border-[#ffe4be]/20 rounded-lg text-[#ffe4be] placeholder-[#ffe4be]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe4be]/50 focus:border-[#ffe4be]/40 transition-all"
                    style={{ 
                      color: '#ffe4be',
                      backgroundColor: 'rgba(20, 22, 26, 0.5)',
                    }}
                    required
                  />
                </div>
              </>
            )}

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
          <div className="mt-6 text-center text-sm text-[#ffe4be]/50 space-y-1">
            <p>Protected Admin Area</p>
            {loginMode === "contributor" && (
              <p className="text-xs text-[#ffe4be]/40">
                Use password: <code className="px-1 py-0.5 bg-[#ffe4be]/10 rounded">contributor2024</code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
