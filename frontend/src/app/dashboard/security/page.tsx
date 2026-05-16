"use client";

import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SecuritySettings from '@/components/SecuritySettings';

export default function SecurityPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'developer' && user.role !== 'enterprise'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Security & Credentials
          </h1>
          <p className="text-gray-400 mt-2">Configure tokens and programmatic credentials safely.</p>
        </header>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
          <SecuritySettings />
        </div>
      </div>
    </div>
  );
}
