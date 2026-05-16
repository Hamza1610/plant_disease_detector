"use client";

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Trash2, AlertTriangle, Loader2, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError("Confirmation text does not match.");
      return;
    }
    setError(null);
    setIsSubmittingDeletion(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Your account has been successfully deleted. Hope to see you again!");
        logout();
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Account Profile
          </h1>
          <p className="text-gray-400 mt-2">Manage your identity preferences and system permissions.</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* User Meta Panel */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center text-3xl font-black text-black shadow-[0_0_30px_rgba(34,197,94,0.3)] uppercase shrink-0">
              {user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 text-center md:text-left overflow-hidden w-full">
              <h2 className="text-2xl font-bold text-gray-100 truncate">{user.email}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider border border-green-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  {user.role} Tier
                </span>
                {user.onboarding_completed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                    Verified Profile
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all px-5 py-3 rounded-xl font-bold text-sm w-full md:w-auto justify-center shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* General Information Settings */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-200 mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              User Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Primary Email Address</label>
                <div className="mt-2 flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl font-medium text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">System Identifier</label>
                <div className="mt-2 bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-xs text-gray-400 truncate">
                  {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-6 md:p-8 mt-4">
            <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Permanently delete your Omnivax account and all associated data including inference logs, models, and keys. This action is absolute and cannot be reversed.
            </p>

            {isDeleting ? (
              <form onSubmit={handleDeleteAccount} className="bg-black/40 border border-red-500/20 p-6 rounded-2xl animate-in fade-in duration-300">
                <label className="block text-sm text-gray-300 font-medium mb-3">
                  To verify, please type <span className="font-extrabold text-white font-mono">DELETE MY ACCOUNT</span> below:
                </label>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-bold mb-4">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    required
                    autoFocus
                    type="text" 
                    placeholder="DELETE MY ACCOUNT"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="flex-1 bg-black border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 focus:outline-none text-white font-mono text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={isSubmittingDeletion || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="bg-red-500 hover:bg-red-400 disabled:opacity-30 text-black px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all justify-center"
                  >
                    {isSubmittingDeletion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Confirm Destruction
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => { setIsDeleting(false); setError(null); }}
                  className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline"
                >
                  Cancel and exit
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setIsDeleting(true)}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-black text-red-400 px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
