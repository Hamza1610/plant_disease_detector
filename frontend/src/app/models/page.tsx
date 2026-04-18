"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ModelSummary {
  model_id: string;
  name: string;
  version: string;
  status: string;
  description: string;
  tags: string[];
  pricing_tier: string;
}

export default function ModelsCatalog() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Omnivax Model Registry</h1>
        <p className="text-gray-400">Discover and deploy the right agricultural models for your crops.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-green-400">Loading registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div key={model.model_id} className="glass-panel rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-gray-300 uppercase tracking-wider">
                  {model.pricing_tier}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{model.name}</h3>
              <p className="text-sm text-gray-400 mb-6 flex-grow">{model.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {model.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-md border border-green-500/20">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                 <Link href={`/predict?model=${model.model_id}`} className="w-full text-center py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors">
                    Deploy in Studio
                 </Link>
                 <Link href={`/benchmarks`} className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors">
                    View Benchmarks
                 </Link>
              </div>
            </div>
          ))}
          {models.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
               No models found in the database. Ensure backend seeding has run.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
