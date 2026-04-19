"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config/api";

export default function JoinPilot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Registration failed");
      }

      // Auto login after reg
      const loginParams = new URLSearchParams();
      loginParams.append("username", email);
      loginParams.append("password", password);

      const loginRes = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginParams,
      });

      if (loginRes.ok) {
        const tokenData = await loginRes.json();
        localStorage.setItem("token", tokenData.access_token);
        router.push("/predict");
      } else {
         router.push("/login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Join Omnivax Pilot</h1>
          <p className="text-gray-400 text-sm">Create your enterprise or farmer account to start deploying AI.</p>
        </div>

        {error && <div className="mb-4 text-red-500 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              required
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enterprise@farm.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              required
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
           Already have an account? <a href="/login" className="text-green-400 hover:underline hover:text-green-300">Sign in</a>
        </p>
      </div>
    </div>
  );
}
