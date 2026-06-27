"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { ShieldAlert, TrendingUp, Users, Activity, Loader2, ArrowRight, Database, Server } from 'lucide-react';
import SecuritySettings from '@/components/SecuritySettings';

export default function EnterpriseDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  // Dynamic Real-Time Data States
  const [stats, setStats] = useState<any>(null);
  const [geospatial, setGeospatial] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [health, setHealth] = useState('Offline');
  const [latency, setLatency] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'enterprise' && user.role !== 'developer'))) {
      router.push('/dashboard/predict');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRealTimeMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // 📡 Step A: Calculate Genuine API Latency during initial data-fetch
        const t0 = performance.now();
        
        const statsRes = await fetch(`${apiUrl}/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        const t1 = performance.now();
        setLatency(Math.round(t1 - t0));

        // 📡 Step B: Probe System Node Health Router
        const healthRes = await fetch(`${apiUrl}/system/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData.status === 'ok' ? 'Optimal' : 'Degraded');
        }

        // 📡 Step C: Count Authenticated Active Countries
        const geoRes = await fetch(`${apiUrl}/analytics/geospatial`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setGeospatial(geoData);
        }

        // 📡 Step D: Fetch Genuine Security Audit Event Streams
        const auditRes = await fetch(`${apiUrl}/system/audit`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (auditRes.ok) {
          const logs = await auditRes.json();
          setAuditLogs(logs);
        }

      } catch (err) {
        console.error('Real-time synchronization interrupted:', err);
        setHealth('Degraded');
      } finally {
        setIsFetching(false);
      }
    };

    if (user) fetchRealTimeMetrics();
  }, [user]);

  // 🕰️ Standard Time-Ago Formatting Utility for ISO timestamps
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

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-8 animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Enterprise Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Global Analytics
            </h1>
            <p className="text-gray-400 mt-4 text-lg max-w-2xl">
              Real-time insights across the Omnivax ecosystem. Monitor disease spread and model accuracy at scale.
            </p>
          </header>

          {/* 📊 Authentic Metrics Grid (Supporting True Zero States) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Platform Scans', value: (stats?.total_scans || 0).toLocaleString(), icon: Activity, color: 'text-green-400' },
              { label: 'Active Farm Partners', value: (stats?.total_users || 0).toLocaleString(), icon: Users, color: 'text-blue-400' },
              { label: 'Platform Accuracy', value: `${stats?.average_confidence || '0'}%`, icon: TrendingUp, color: 'text-purple-400' },
              { label: 'Regional Coverage', value: geospatial.length > 0 ? `${geospatial.length} Region${geospatial.length > 1 ? 's' : ''}` : '0 Regions', icon: ShieldAlert, color: 'text-red-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
                <stat.icon className={`w-8 h-8 ${stat.color} mb-6 group-hover:scale-110 transition-transform`} />
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Detected Pathogens Progress Graph */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2.5">
                <Database className="w-5 h-5 text-gray-500" />
                Top Detected Pathogens
              </h2>
              {stats?.top_diseases && stats.top_diseases.length > 0 ? (
                <div className="space-y-6">
                  {stats.top_diseases.map((disease: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">{disease.label}</span>
                        <span className="text-green-400 font-bold">{(disease.count || 0).toLocaleString()} Scans</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" 
                          style={{ width: `${stats.total_scans > 0 ? (disease.count / stats.total_scans) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                  <p className="text-sm text-gray-500">No pathogens detected across active models yet.</p>
                </div>
              )}
            </div>

            {/* 🛰️ Authentic Enterprise Health Widget */}
            <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/10 p-8 rounded-[2rem]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">
                <Server className="w-5 h-5 text-green-500" />
                Enterprise Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="text-sm text-gray-400">Node Status</span>
                  <span className={`text-sm font-bold ${health === 'Optimal' ? 'text-green-400' : 'text-yellow-400'}`}>{health}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="text-sm text-gray-400">API Latency</span>
                  <span className="text-sm text-gray-300 font-mono font-bold">{latency !== null ? `${latency}ms` : 'Probing...'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="text-sm text-gray-400">Data Pipeline</span>
                  <span className="text-sm text-blue-400 font-bold">Syncing</span>
                </div>
              </div>
              <button className="w-full mt-8 flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors shadow-lg">
                Export Global Report
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Security Settings decoupled */}
          <div id="security" className="mt-12">
            <SecuritySettings />
          </div>

          {/* 📜 Authentic Real-Time System Audit Logs */}
          <div id="audit" className="mt-12 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">System Audit Log</h2>
                <p className="text-sm text-gray-500 mt-1">Immutable history of platform operations and security changes.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase rounded-full">Real-time Log</span>
            </div>
            
            <div className="overflow-x-auto">
              {auditLogs && auditLogs.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs font-semibold uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4">Event Description</th>
                      <th className="pb-4">Initiated By</th>
                      <th className="pb-4">Origin IP</th>
                      <th className="pb-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log, i) => (
                      <tr key={i} className="text-sm hover:bg-white/[0.02] transition-all group/row">
                        <td className="py-4 text-white font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover/row:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all"></div>
                          {log.event}
                        </td>
                        <td className="py-4 text-gray-400 font-mono text-xs">{log.user}</td>
                        <td className="py-4 text-gray-500 text-xs font-mono">{log.ip}</td>
                        <td className="py-4 text-gray-500 text-right text-xs">{formatTimeAgo(log.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-400">Audit Ledger Empty</p>
                    <p className="text-[10px] text-gray-500 uppercase font-mono mt-1">No ecosystem operations recorded on this account yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
