"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        localStorage.setItem("token", data.session.access_token);
        router.push("/predict");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (authError) setError(authError.message);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to access the Prediction Studio and your history.</p>
        </div>

        {error && <div className="mb-4 text-red-500 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              required
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-white text-black font-bold py-3.5 rounded-xl transition-all hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-500">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C9.03,19.27 6.59,17.38 6.59,12.03C6.59,6.68 9.03,4.79 12.19,4.79C13.97,4.79 15.46,5.42 16.5,6.35L18.6,4.26C16.95,2.71 14.66,1.88 12.19,1.88C6.21,1.88 3.5,6.62 3.5,12.03C3.5,17.44 6.21,22.18 12.19,22.18C17.78,22.18 21.61,18.28 21.61,12.03C21.61,11.53 21.57,11.1 21.35,11.1V11.1Z"/></svg>
              Google
            </button>
            <button 
              type="button"
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"></path></svg>
              GitHub
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
           Don't have an account? <a href="/join-pilot" className="text-green-400 hover:underline hover:text-green-300">Join Pilot</a>
        </p>
      </div>
    </div>
  );
}
