"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { ShieldAlert, TrendingUp, Users, Activity, Loader2, ArrowRight } from 'lucide-react';

export default function EnterpriseDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'enterprise' && user.role !== 'developer'))) {
      router.push('/predict');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsFetching(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Enterprise Intelligence</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
            Global Analytics
          </h1>
          <p className="text-gray-400 mt-4 text-lg max-w-2xl">
            Real-time insights across the Omnivax ecosystem. Monitor disease spread and model accuracy at scale.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Platform Scans', value: stats?.total_scans || '0', icon: Activity, color: 'text-green-400' },
            { label: 'Active Farm Partners', value: stats?.total_users || '0', icon: Users, color: 'text-blue-400' },
            { label: 'Platform Accuracy', value: `${stats?.average_confidence || '0'}%`, icon: TrendingUp, color: 'text-purple-400' },
            { label: 'Regional Coverage', value: 'High', icon: ShieldAlert, color: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-6 group-hover:scale-110 transition-transform`} />
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Diseases Chart Placeholder */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
            <h2 className="text-xl font-bold mb-8">Top Detected Pathogens</h2>
            <div className="space-y-6">
              {stats?.top_diseases?.map((disease: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{disease.label}</span>
                    <span className="text-green-400 font-bold">{disease.count} Scans</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" 
                      style={{ width: `${(disease.count / stats.total_scans) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions / Status */}
          <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/10 p-8 rounded-[2rem]">
            <h2 className="text-xl font-bold mb-6">Enterprise Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-sm text-gray-400">Node Status</span>
                <span className="text-sm text-green-400 font-bold">Optimal</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-sm text-gray-400">API Latency</span>
                <span className="text-sm text-gray-400 font-bold">124ms</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-sm text-gray-400">Data Pipeline</span>
                <span className="text-sm text-blue-400 font-bold">Syncing</span>
              </div>
            </div>
            <button className="w-full mt-8 flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
              Export Global Report
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
