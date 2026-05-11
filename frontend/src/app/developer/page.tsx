"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Plus, BarChart3, Database, Globe, ArrowUpRight, Loader2 } from 'lucide-react';
import RegisterModelModal from '@/components/RegisterModelModal';
import SecuritySettings from '@/components/SecuritySettings';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DeveloperDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'developer')) {
      router.push('/predict');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchModels();
  }, [user]);

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
        <RegisterModelModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchModels} 
        />
        
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Developer Hub
              </h1>
              <p className="text-gray-400 mt-2">Manage your diagnostic models and view performance metrics.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              <Plus className="w-5 h-5" />
              Deploy New Model
            </button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Inferences', value: '1.2k', icon: BarChart3, color: 'text-blue-400' },
              { label: 'Active Models', value: models.length, icon: Database, color: 'text-green-400' },
              { label: 'Average Accuracy', value: '94.2%', icon: Globe, color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">+12%</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          {/* Models List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden h-fit">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-200">Your Model Catalog</h2>
                <button className="text-sm text-gray-400 hover:text-white transition-colors font-medium">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Model Name</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {models.map((model) => (
                      <tr key={model.model_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                              <Database className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-200">{model.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{model.model_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-400/10 text-green-400 uppercase tracking-wider">
                            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                            {model.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all">
                            <ArrowUpRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {models.length === 0 && (
                <div className="py-20 text-center">
                  <Database className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500">No models deployed yet.</p>
                </div>
              )}
            </div>

            {/* Security & Access Section */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 h-fit">
              <SecuritySettings />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
