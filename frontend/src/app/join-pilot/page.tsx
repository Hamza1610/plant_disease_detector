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
        router.push("/predict");
      } else {
        setError("Registration successful! Please check your email for the confirmation link.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'standard', title: 'Farmer', desc: 'Individual diagnostics', icon: Users },
    { id: 'developer', title: 'Developer', desc: 'API & Model access', icon: Code },
    { id: 'enterprise', title: 'Enterprise', desc: 'Global surveillance', icon: Building2 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-12">
      <div className="w-full max-w-xl glass-panel p-10 rounded-[2.5rem] relative overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="text-center mb-10 relative z-10">
          <h1 className="text-4xl font-bold text-white mb-3">Join Omnivax Pilot</h1>
          <p className="text-gray-400">Select your role to begin your high-accuracy diagnostic journey.</p>
        </div>

        {error && <div className="mb-6 text-red-500 text-sm p-4 bg-red-500/10 rounded-2xl border border-red-500/20">{error}</div>}

        <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id as any)}
              className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all ${
                role === r.id 
                ? 'bg-green-500/10 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'
              }`}
            >
              <r.icon className={`w-8 h-8 ${role === r.id ? 'text-green-400' : 'text-gray-600'}`} />
              <div className="text-center">
                <p className="font-bold text-sm">{r.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
              </div>
              {role === r.id && <CheckCircle2 className="w-4 h-4 text-green-500 absolute top-3 right-3" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enterprise@farm.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-5 rounded-2xl transition-all shadow-[0_10px_25px_rgba(34,197,94,0.3)] disabled:opacity-50 text-lg"
          >
            {loading ? "Initializing..." : "Create Account"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
           Already a pilot member? <a href="/login" className="text-green-400 font-bold hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
