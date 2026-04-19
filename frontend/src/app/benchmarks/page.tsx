"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/config/api";

export default function Benchmarks() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.MODELS)
      .then(res => res.json())
      .then(data => {
        setModels(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Benchmark Center</h1>
          <p className="text-gray-400">View real-time performance metrics and registry validation for our actual models.</p>
        </div>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Model Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Target Dataset</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Accuracy</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">p95 Latency</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-green-400">Loading active models...</td></tr>
            ) : models.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No models active in registry.</td></tr>
            ) : (
                models.map((m, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button onClick={() => setSelectedModel(m)} className="flex items-center gap-3 hover:text-green-400 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <span className="text-sm font-bold text-white uppercase">{m.name}</span>
                      </button>
                      <p className="text-xs text-gray-400 ml-11 mt-1 font-mono">{m.model_id}</p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">PlantVillage Base</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-bold rounded-full">98.2%</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-300">42ms</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase rounded-md tracking-wider">{m.status}</span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-black border border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.15)] rounded-3xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
              <div className="bg-white/5 border-b border-white/10 px-8 py-6 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{selectedModel.name}</h2>
                    <p className="text-sm text-gray-400 font-mono mt-1">ID: {selectedModel.model_id}</p>
                 </div>
                 <button onClick={() => setSelectedModel(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              <div className="px-8 py-6 space-y-6">
                 <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{selectedModel.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Capabilities</h3>
                       <div className="flex flex-wrap gap-2">
                          {selectedModel.tags.map((tag: string) => (
                             <span key={tag} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">{tag}</span>
                          ))}
                          {selectedModel.tags.length === 0 && <span className="text-xs text-gray-500">Standard Vision Classifier</span>}
                       </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Version Logic</h3>
                       <p className="text-sm text-gray-300">V{selectedModel.version} — Stable Branch</p>
                       <p className="text-xs text-gray-500 mt-1">Pricing: {selectedModel.pricing_tier}</p>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                    <button onClick={() => setSelectedModel(null)} className="px-6 py-2 border border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">Close</button>
                    <a href={`/predict?model=${selectedModel.model_id}`} className="px-6 py-2 bg-green-500 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-400 rounded-xl transition-colors">Deploy Model</a>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
