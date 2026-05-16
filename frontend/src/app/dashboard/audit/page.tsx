"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Layers, ShieldAlert, Search, Download, Loader2, ArrowLeft } from 'lucide-react';

export default function AuditLedgerPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userLoading && (!user || (user.role !== 'enterprise' && user.role !== 'developer'))) {
      router.push('/dashboard/predict');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const res = await fetch(`${apiUrl}/system/audit`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const logs = await res.json();
          setAuditLogs(logs);
        }
      } catch (err) {
        console.error('Audit fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchAuditLogs();
  }, [user]);

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = new Date().getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay === 1) return 'Yesterday';
      return `${diffDay}d ago`;
    } catch {
      return 'N/A';
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ip.includes(searchQuery)
  );

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Layers className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Enterprise Ledger</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              System Audit Logs
            </h1>
            <p className="text-gray-400 mt-3 text-base max-w-xl">
              Real-time immutable history of security events, administrative actions, and system protocols.
            </p>
          </div>
          
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all font-bold text-xs uppercase tracking-wider text-gray-300"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </header>

        {/* Audit Search & Filtering Bar */}
        <div className="mb-6 flex gap-4">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by event, identity, or origin IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 focus:border-green-500/50 rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none transition-all"
              />
           </div>
        </div>

        {/* Ledger Table Shell */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            {filteredLogs.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="p-8 pb-4">Event Logic</th>
                    <th className="py-8 pb-4">Initiated Identity</th>
                    <th className="py-8 pb-4">Network Origin</th>
                    <th className="p-8 pb-4 text-right">Sequence Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log, i) => (
                    <tr key={i} className="text-sm hover:bg-white/[0.02] transition-all group/row">
                      <td className="p-8 py-5 text-white font-bold flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        {log.event}
                      </td>
                      <td className="py-5 text-gray-400 font-mono text-xs">{log.user}</td>
                      <td className="py-5 text-gray-500 text-xs font-mono">{log.ip}</td>
                      <td className="p-8 py-5 text-gray-500 text-right text-xs font-medium">{formatTimeAgo(log.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center gap-4">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
                    <ShieldAlert className="w-8 h-8" />
                 </div>
                 <div className="text-center">
                    <p className="text-lg font-bold text-gray-400">Empty Ledger Stream</p>
                    <p className="text-xs text-gray-600 mt-1 max-w-xs uppercase font-mono tracking-widest">No matching security events were identified in the current buffer.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
