"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Users, Code, Building2, CheckCircle2 } from "lucide-react";

export default function JoinPilot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'standard' | 'developer' | 'enterprise'>('standard');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Store role selection locally so it can be synced during first load/verification
      localStorage.setItem('pending_role', role);

      // 1. Supabase Auth Signup
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        // 2. Sync to local DB with selected role
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });
        
        if (!regRes.ok) {
          const errorData = await regRes.json();
          throw new Error(errorData.detail || "Failed to sync user profile");
        }

        localStorage.setItem("token", data.session.access_token);
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
      } else {
        setError("Registration successful! Please check your email for the confirmation link.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    // Note: The selected role is saved in localStorage so the callback can register it if needed
    localStorage.setItem('pending_role', role);
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get("redirect") || "/dashboard";
    const redirectToUrl = new URL(`${window.location.origin}/auth/callback`);
    redirectToUrl.searchParams.set("redirect", redirect);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectToUrl.toString(),
      }
    });
    if (authError) setError(authError.message);
  };

  const roles = [
    { id: 'standard', title: 'Farmer', desc: 'Individual diagnostics', icon: Users },
    { id: 'developer', title: 'Developer', desc: 'API & Model access', icon: Code },
    { id: 'enterprise', title: 'Enterprise', desc: 'Global surveillance', icon: Building2 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join Omnivax Pilot</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Create your enterprise or farmer account to start deploying AI.</p>
        </div>

        {error && <div className="mb-4 text-red-500 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id as any)}
              className={`flex sm:flex-col items-center justify-start sm:justify-center gap-3 p-3 rounded-xl border transition-all ${
                role === r.id 
                ? 'bg-green-500/10 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'
              }`}
            >
              <r.icon className={`w-5 h-5 shrink-0 ${role === r.id ? 'text-green-400' : 'text-gray-600'}`} />
              <div className="text-left sm:text-center flex-1">
                <p className="font-bold text-sm sm:text-[11px] leading-tight">{r.title}</p>
                <p className="text-[10px] sm:text-[9px] text-gray-500 mt-0.5 sm:hidden md:block">{r.desc}</p>
              </div>
              {role === r.id && <CheckCircle2 className="w-4 h-4 sm:w-3 sm:h-3 text-green-500 shrink-0" />}
            </button>
          ))}
        </div>

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
            className="mt-2 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 text-sm"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-500">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C9.03,19.27 6.59,17.38 6.59,12.03C6.59,6.68 9.03,4.79 12.19,4.79C13.97,4.79 15.46,5.42 16.5,6.35L18.6,4.26C16.95,2.71 14.66,1.88 12.19,1.88C6.21,1.88 3.5,6.62 3.5,12.03C3.5,17.44 6.21,22.18 12.19,22.18C17.78,22.18 21.61,18.28 21.61,12.03C21.61,11.53 21.57,11.1 21.35,11.1V11.1Z"/></svg>
              Google
            </button>
            <button 
              type="button"
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"></path></svg>
              GitHub
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
           Already a pilot member? <a href="/login" className="text-green-400 font-medium hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
