"use client";

import { useState, useEffect } from 'react';
import { Key, Copy, Check, Trash2, Shield, Loader2, Plus, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function SecuritySettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/api-keys?name=${newKeyName}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.api_key);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (err) {
      console.error('Failed to create key:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently revoke this API key?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-500" />
            Security & Access
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage API keys for programmatic access via CLI or SDKs.</p>
        </div>
      </div>

      {generatedKey && (
        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 text-green-400 mb-2 font-bold text-sm">
            <Check className="w-4 h-4" />
            New API Key Generated
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Copy this key now. For your security, it will <span className="text-white font-bold underline">never be shown again</span>.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-white/10 px-4 py-3 rounded-xl font-mono text-green-400 break-all">
              {generatedKey}
            </div>
            <button 
              onClick={() => copyToClipboard(generatedKey)}
              className="bg-green-500 hover:bg-green-400 text-black px-4 rounded-xl transition-all"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button 
            onClick={() => setGeneratedKey(null)}
            className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline"
          >
            I have saved this key safely
          </button>
        </div>
      )}

      <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Key Name (e.g. Production CLI)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition-all"
        />
        <button 
          disabled={creating || !newKeyName}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Key
        </button>
      </form>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Prefix</th>
                <th className="px-6 py-4 font-medium">Last Used</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keys.map((key) => (
                <tr key={key.id} className="text-sm">
                  <td className="px-6 py-4 font-medium text-gray-200">{key.name}</td>
                  <td className="px-6 py-4 font-mono text-yellow-500/80">{key.prefix}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {keys.length === 0 && (
          <div className="py-12 text-center">
            <Key className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No active API keys found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
