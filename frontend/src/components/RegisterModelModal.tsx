"use client";

import { useState, useRef } from 'react';
import { 
  X, Upload, Shield, Tag, Info, CheckCircle2, Loader2, 
  AlertCircle, FileText, ArrowRight, ArrowLeft, Layers, 
  Binary, FolderGit2, CloudDownload, Globe, Database, Cpu, Library
} from 'lucide-react';

interface RegisterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModelModal({ isOpen, onClose, onSuccess }: RegisterModelModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    model_id: '',
    name: '',
    description: '',
    class_names: '',
    tags: ''
  });
  const [framework, setFramework] = useState('pytorch');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [source, setSource] = useState<'local' | 'hub'>('local');
  const [hubSource, setHubSource] = useState<'huggingface' | 'kaggle' | 'url'>('huggingface');
  const [hubModelId, setHubModelId] = useState('');
  const [pulling, setPulling] = useState(false);
  const [remoteFilePath, setRemoteFilePath] = useState<string | null>(null);
  const [verificationLogs, setVerificationLogs] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
  const [checkingId, setCheckingId] = useState(false);
  
  const configInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const checkIdAvailability = async (id: string) => {
    if (!id.trim()) {
      setIsIdAvailable(null);
      return;
    }
    setCheckingId(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/check-id/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsIdAvailable(data.available);
      }
    } catch (err) {
      console.error("ID check failed", err);
    } finally {
      setCheckingId(false);
    }
  };

  const handleConfigSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProbing(true);
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('framework', framework);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/probe-upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.class_names && data.class_names.length > 0) {
            setFormData(prev => ({ ...prev, class_names: data.class_names.join(', ') }));
          }
        }
      } catch (err) {
        setError("Sync Failure: Could not parse config.json buffer.");
      } finally {
        setProbing(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (!formData.name) {
        const baseName = file.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, name: baseName || file.name }));
      }
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'h5') setFramework('keras');
      else if (ext === 'pkl' || ext === 'joblib') setFramework('sklearn');
      else if (ext === 'pt' || ext === 'pth') setFramework('pytorch');
      
      setValidationError(null);
    }
  };

  const validateCurrentStep = () => {
    setValidationError(null);
    if (step === 1) {
      if (!formData.model_id.trim()) {
        setValidationError("Verification Blocked: A unique Model Slug is required.");
        return false;
      }
      if (!formData.name.trim()) {
        setValidationError("Verification Blocked: Model display name is required.");
        return false;
      }
      if (!formData.description.trim()) {
        setValidationError("Verification Blocked: Product description cannot be empty.");
        return false;
      }
    }
    if (step === 2) {
      if (source === 'local' && !selectedFile) {
        setValidationError("Verification Blocked: Please select a model artifact binary file.");
        return false;
      }
      if (source === 'hub' && !remoteFilePath) {
        setValidationError("Verification Blocked: Please pull a remote model from the hub first.");
        return false;
      }
    }
    if (step === 3) {
      if (!formData.class_names.trim()) {
        setValidationError("Verification Blocked: Supply at least one target prediction label.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setStep(step - 1);
  };

  const handleRemotePull = async () => {
    if (!hubModelId.trim()) {
      setValidationError("Action Required: Please enter a Model ID or URL.");
      return;
    }
    
    setPulling(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source: hubSource,
          model_id: hubModelId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRemoteFilePath(data.path);
        
        // AUTO-PROBE METADATA
        if (data.metadata?.class_names) {
          setFormData(prev => ({ 
            ...prev, 
            class_names: data.metadata.class_names.join(', ')
          }));
        }
        
        if (data.metadata?.framework) {
          setFramework(data.metadata.framework);
        }
      } else {
        const err = await res.json();
        setError(err.detail || "Connection Failure: Model Hub timed out.");
      }
    } catch (err) {
      setError("Network Failure: Could not reach Model Hub Bridge.");
    } finally {
      setPulling(false);
    }
  };

  const handleProbe = async () => {
    if (!selectedFile && !remoteFilePath) return;
    
    setProbing(true);
    try {
      const token = localStorage.getItem('token');
      let res;
      
      if (source === 'local' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('framework', framework);
        
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/probe-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/probe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            file_path: remoteFilePath,
            framework: framework
          })
        });
      }
      
      if (res.ok) {
        const data = await res.json();
        if (data.class_names && data.class_names.length > 0) {
          setFormData(prev => ({ ...prev, class_names: data.class_names.join(', ') }));
        } else if (data.error) {
          setError(`Probe Warning: ${data.error}`);
        } else {
          setError("Probe Result: No metadata could be extracted from this artifact.");
        }
      }
    } catch (err) {
      console.error("Probe failed", err);
      setError("Sync Failure: Could not reach extraction engine.");
    } finally {
      setProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    setError(null);
    setVerificationLogs('');
    
    try {
      const token = localStorage.getItem('token');
      const bodyData = new FormData();
      
      if (source === 'local' && selectedFile) {
        bodyData.append('file', selectedFile);
      } else if (source === 'hub' && remoteFilePath) {
        // We'll need a different endpoint for hub-registration or modify backend to accept path
        // For now, let's assume we send a dummy file or the backend knows the path
        bodyData.append('remote_path', remoteFilePath);
      }

      bodyData.append('model_id', formData.model_id);
      bodyData.append('name', formData.name);
      bodyData.append('description', formData.description);
      bodyData.append('class_names', JSON.stringify(formData.class_names.split(',').map(s => s.trim())));
      bodyData.append('tags', JSON.stringify(formData.tags.split(',').map(s => s.trim())));
      bodyData.append('framework', framework);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyData
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationLogs(data.verification_logs || '');
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setStep(1);
          setFormData({ model_id: '', name: '', description: '', class_names: '', tags: '' });
          setSelectedFile(null);
          setRemoteFilePath(null);
          setFramework('pytorch');
        }, 3000);
      } else {
        setError(data.detail || "Inference validation failed during smoke test.");
        if (data.verification_logs) setVerificationLogs(data.verification_logs);
      }
    } catch (err) {
      setError("Sync Failure: Could not transmit data buffer to endpoint.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 💎 Semi-translucent backdrop to perfectly expose the blurred page background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px]" onClick={onClose} />
      
      {/* 💎 High-fidelity Glassmorphism Modal Shell */}
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0d0d0d]/85 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_0_60px_rgba(34,197,94,0.15)] animate-in fade-in zoom-in-95 duration-300 my-auto overflow-hidden">
        
        {/* Header Gradient Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Highly Visible Header Layout */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-[0.2em] bg-green-500/10 px-3 py-1 rounded-full mb-2.5 inline-block border border-green-500/20">
                Step {step} of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                {step === 1 && <FolderGit2 className="w-5 h-5 text-green-500" />}
                {step === 2 && <Binary className="w-5 h-5 text-green-500" />}
                {step === 3 && <Layers className="w-5 h-5 text-green-500" />}
                {step === 1 && "Information Discovery"}
                {step === 2 && "Binary Payload"}
                {step === 3 && "Label Allocations"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1.5 max-w-md">
                {step === 1 && "Assign unique model metadata and brief descriptors."}
                {step === 2 && "Browse weights artifacts and assign runtime target."}
                {step === 3 && "Determine classification mapping scopes and keywords."}
              </p>
            </div>
            {!loading && (
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs text-gray-300 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-16 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-green-500/25 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="relative w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Deployment Complete</h3>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
                Your model has cleared synthetic testing protocols and is now live!
              </p>
              
              {verificationLogs && (
                <div className="mt-6 mx-auto max-w-sm bg-black/40 border border-white/5 rounded-xl p-3 text-left overflow-hidden">
                   <p className="text-[8px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                     <Cpu className="w-2 h-2" /> Validation Gate Console
                   </p>
                   <pre className="text-[10px] text-green-400 font-mono leading-tight whitespace-pre-wrap">
                     {verificationLogs}
                   </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* STEP 1: Expanded Fully Visible Fields */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-gray-500" />
                      Model Identifier (Slug)
                    </label>
                    <div className="relative">
                      <input
                        required
                        autoFocus
                        value={formData.model_id}
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
                          setFormData({...formData, model_id: val});
                          if (val.length > 3) checkIdAvailability(val);
                        }}
                        placeholder="e.g. coffee-rust-v1"
                        className={`w-full bg-white/[0.03] border ${isIdAvailable === false ? 'border-red-500/50' : isIdAvailable === true ? 'border-green-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingId ? <Loader2 className="w-4 h-4 text-gray-500 animate-spin" /> : 
                         isIdAvailable === true ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                         isIdAvailable === false ? <AlertCircle className="w-4 h-4 text-red-500" title="ID already taken" /> : null}
                      </div>
                    </div>
                    {isIdAvailable === false && (
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight">This identifier is already reserved.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Display Title Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Coffee Rust Disease Engine"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Core Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe target crop, training constraints, and model intent..."
                      rows={2}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Elegant Browse Container */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-gray-500" />
                      Model Weights Artifact File
                    </label>
                    {/* Source Selection Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
                      <button
                        type="button"
                        onClick={() => setSource('local')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${source === 'local' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <Upload className="w-3 h-3" />
                        Local Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setSource('hub')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${source === 'hub' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <CloudDownload className="w-3 h-3" />
                        Model Hub
                      </button>
                    </div>

                    {source === 'local' ? (
                      <>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".h5,.pt,.pth,.pkl,.joblib"
                        />
                        
                        {selectedFile ? (
                          <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/25 p-4 rounded-2xl animate-in zoom-in-95 duration-200">
                            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-sm text-gray-200 truncate">{selectedFile.name}</p>
                              <p className="text-[10px] text-green-400 uppercase font-mono mt-0.5">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Pre-Load Buffer
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setSelectedFile(null); setFramework('pytorch'); }}
                              className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
                              title="Discard Artifact"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-white/10 hover:border-green-500/30 hover:bg-green-500/[0.02] rounded-2xl py-7 flex flex-col items-center justify-center gap-3 transition-all duration-300 group"
                          >
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-green-400 group-hover:scale-110 transition-all">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-300">Browse Local Computer</p>
                              <p className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase font-mono">Supports .H5 • .PKL • .PTH</p>
                            </div>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex gap-2">
                          <select
                            value={hubSource}
                            onChange={(e) => setHubSource(e.target.value as any)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-green-500/50"
                          >
                            <option value="huggingface" className="bg-[#0a0a0a]">Hugging Face</option>
                            <option value="kaggle" className="bg-[#0a0a0a]">Kaggle</option>
                            <option value="url" className="bg-[#0a0a0a]">Public URL</option>
                          </select>
                          <input
                            value={hubModelId}
                            onChange={(e) => setHubModelId(e.target.value)}
                            placeholder={hubSource === 'url' ? "Enter direct .h5/.pkl URL" : "Enter Model ID (e.g. user/model)"}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        
                        {remoteFilePath ? (
                          <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/25 p-4 rounded-2xl">
                             <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0">
                              <Library className="w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-sm text-gray-200 truncate">Remote Artifact Cached</p>
                              <p className="text-[10px] text-green-400 uppercase font-mono mt-0.5">READY FOR DEPLOYMENT</p>
                            </div>
                            <button 
                              onClick={() => setRemoteFilePath(null)}
                              className="p-2 bg-white/5 hover:bg-red-500/20 rounded-xl transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRemotePull}
                            disabled={pulling}
                            className="w-full bg-white/10 hover:bg-white/20 border border-white/5 rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                          >
                            {pulling ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Connecting to {hubSource === 'huggingface' ? 'HF Hub' : 'Kaggle'}...
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3" />
                                Pull Remote Asset
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Target Framework</label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors cursor-pointer"
                    >
                      <option value="pytorch" className="bg-[#0a0a0a]">PyTorch (.PT / .PTH Native Loader)</option>
                      <option value="keras" className="bg-[#0a0a0a]">Keras / TensorFlow (.H5 Artifact)</option>
                      <option value="sklearn" className="bg-[#0a0a0a]">Scikit-Learn (.PKL / .JOBLIB Adapter)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: Analytical Labels */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-gray-500" />
                      Target Prediction Classes
                    </label>
                    <div className="relative">
                      <input
                        required
                        autoFocus
                        value={formData.class_names}
                        onChange={e => setFormData({...formData, class_names: e.target.value})}
                        placeholder="e.g. Healthy, Leaf Rust, Miner..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-32 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <input 
                          type="file" 
                          ref={configInputRef} 
                          onChange={handleConfigSelect} 
                          className="hidden" 
                          accept=".json" 
                        />
                        <button
                          type="button"
                          onClick={() => configInputRef.current?.click()}
                          title="Upload config.json"
                          className="bg-white/5 hover:bg-white/10 text-gray-400 p-1.5 rounded-lg border border-white/5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleProbe}
                          disabled={probing || (!selectedFile && !remoteFilePath)}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-green-500/20 transition-all disabled:opacity-0"
                        >
                          {probing ? "..." : "Auto"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">Provide labels strictly separated by commas.</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Discovery Tag Indexing
                    </label>
                    <input
                      value={formData.tags}
                      onChange={e => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g. Coffee, Fungal, Tropical"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Validation Banner Overlay */}
              {validationError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold mt-3 animate-in slide-in-from-top-2">
                  {validationError}
                </div>
              )}

              {/* High-Contrast Navigation Anchors */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5 mt-6">
                {step > 1 ? (
                  <button 
                    disabled={loading}
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div /> 
                )}

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 sm:flex-none bg-white hover:bg-gray-100 text-black px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={loading || !selectedFile}
                    onClick={handleSubmit}
                    type="button"
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-400 disabled:opacity-30 text-black font-black px-7 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing Engine...
                      </>
                    ) : (
                      <>
                        Launch Engine
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
