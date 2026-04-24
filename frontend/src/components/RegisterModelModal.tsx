"use client";

import { useState } from 'react';
import { X, Upload, Shield, Tag, Info, CheckCircle2 } from 'lucide-react';

interface RegisterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModelModal({ isOpen, onClose, onSuccess }: RegisterModelModalProps) {
  const [formData, setFormData] = useState({
    model_id: '',
    name: '',
    description: '',
    artifact_path: '',
    class_names: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        class_names: formData.class_names.split(',').map(s => s.trim()),
        tags: formData.tags.split(',').map(s => s.trim()),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setFormData({ model_id: '', name: '', description: '', artifact_path: '', class_names: '', tags: '' });
        }, 2000);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-500" />
                Register New Model
              </h2>
              <p className="text-gray-400 mt-1">Deploy your trained artifact to the Omnivax ecosystem.</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {success ? (
            <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">Registration Successful</h3>
              <p className="text-gray-400 mt-2">Your model is being indexed in the global catalog.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Model ID (unique slug)</label>
                  <input
                    required
                    value={formData.model_id}
                    onChange={e => setFormData({...formData, model_id: e.target.value})}
                    placeholder="e.g. coffee-leaf-rust-v2"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Display Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Coffee Rust Detector"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Explain what this model does..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Artifact Path (URL or local path)</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={formData.artifact_path}
                    onChange={e => setFormData({...formData, artifact_path: e.target.value})}
                    placeholder="/models/artifacts/model.h5"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                  <button type="button" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-gray-500" />
                    Class Names (comma separated)
                  </label>
                  <input
                    required
                    value={formData.class_names}
                    onChange={e => setFormData({...formData, class_names: e.target.value})}
                    placeholder="Healthy, Rust, Miner..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-gray-500" />
                    Tags
                  </label>
                  <input
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="Coffee, Fungal, Tropical..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Deployment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
