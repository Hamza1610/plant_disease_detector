"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Tag, Info, CheckCircle2, Loader2, 
  AlertCircle, FileText, ArrowRight, ArrowLeft, Layers, 
  Binary, CloudDownload, Globe, Cpu, Library, Sliders
} from 'lucide-react';

interface RegisterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModelModal({ isOpen, onClose, onSuccess }: RegisterModelModalProps) {
  const [step, setStep] = useState(1);
  
  // Wizard form state
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('pytorch');
  const [modelFormat, setModelFormat] = useState('safetensors');
  
  // Source selection state
  const [source, setSource] = useState<'local' | 'hub'>('local');
  const [hubSource, setHubSource] = useState<'huggingface' | 'kaggle'>('huggingface');
  const [hubRepoId, setHubRepoId] = useState('');
  const [hubFilename, setHubFilename] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Modality & Preprocessing state
  const [modality, setModality] = useState('image');
  const [imgH, setImgH] = useState(224);
  const [imgW, setImgW] = useState(224);
  const [imgC, setImgC] = useState(3);
  const [normalization, setNormalization] = useState('none');
  
  const [audioSampleRate, setAudioSampleRate] = useState(16000);
  const [audioChannels, setAudioChannels] = useState(1);
  const [audioFormat, setAudioFormat] = useState('wav');
  
  const [textMaxLength, setTextMaxLength] = useState(512);

  // Output & Tags state
  const [taskType, setTaskType] = useState('classification');
  const [classNames, setClassNames] = useState('');
  const [tags, setTags] = useState('');

  // Status/Loading state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [verificationLogs, setVerificationLogs] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate model ID slug based on name
  useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '_');
      setModelId(`${slug}_v1`);
    } else {
      setModelId('');
    }
  }, [name]);

  if (!isOpen) return null;

  const validateCurrentStep = () => {
    setValidationError(null);
    if (step === 1) {
      if (!name.trim()) {
        setValidationError("Model display name is required.");
        return false;
      }
      if (!description.trim()) {
        setValidationError("Model description cannot be empty.");
        return false;
      }
    }
    if (step === 2) {
      if (source === 'local' && !selectedFile) {
        setValidationError("Please select a local weights artifact file.");
        return false;
      }
      if (source === 'hub' && !hubRepoId.trim()) {
        setValidationError("Please enter a Repository ID.");
        return false;
      }
    }
    if (step === 3) {
      if (modality === 'image') {
        if (imgH <= 0 || imgW <= 0 || imgC <= 0) {
          setValidationError("Image dimensions must be valid positive integers.");
          return false;
        }
      }
    }
    if (step === 4) {
      if (taskType === 'classification' && !classNames.trim()) {
        setValidationError("At least one classification class name label is required.");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'h5') {
        setFramework('keras');
        setModelFormat('keras_h5');
      } else if (ext === 'pkl' || ext === 'joblib') {
        setFramework('sklearn');
        setModelFormat('pickle');
      } else if (ext === 'pt' || ext === 'pth') {
        setFramework('pytorch');
        setModelFormat('safetensors');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    setError(null);
    setVerificationLogs('');

    // Compile form data to declarative ModelConfig structure
    const configPayload: any = {
      model_id: modelId,
      name: name,
      framework: framework,
      model_format: modelFormat,
      description: description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      model_source: {
        hub: source === 'hub' ? hubSource : 'local',
        repo_id: source === 'hub' ? hubRepoId : 'local',
        filename: source === 'hub' ? hubFilename || null : selectedFile?.name || null
      },
      input_schema: {
        modality: modality,
        parameters: {}
      },
      output_schema: {
        task_type: taskType,
        parameters: {}
      }
    };

    if (modality === 'image') {
      configPayload.input_schema.parameters.image = {
        dimensions: [imgH, imgW, imgC],
        normalization: normalization
      };
    } else if (modality === 'audio') {
      configPayload.input_schema.parameters.audio = {
        sample_rate: audioSampleRate,
        channels: audioChannels,
        format: audioFormat
      };
    } else if (modality === 'text') {
      configPayload.input_schema.parameters.text = {
        max_length: textMaxLength
      };
    }

    const classesList = classNames.split(',').map(c => c.trim()).filter(Boolean);
    if (taskType === 'classification') {
      configPayload.output_schema.parameters.classification = {
        class_names: classesList
      };
    } else if (taskType === 'object_detection') {
      configPayload.output_schema.parameters.object_detection = {
        class_names: classesList,
        confidence_threshold: 0.5
      };
    }

    try {
      const token = localStorage.getItem('token');
      const bodyData = new FormData();
      
      bodyData.append('model_id', modelId);
      bodyData.append('name', name);
      bodyData.append('description', description);
      bodyData.append('framework', framework);
      bodyData.append('class_names', JSON.stringify(classesList));
      bodyData.append('tags', JSON.stringify(configPayload.tags));
      bodyData.append('config_json', JSON.stringify(configPayload));

      if (source === 'local' && selectedFile) {
        bodyData.append('file', selectedFile);
      } else {
        bodyData.append('remote_path', `mock/hub/${hubRepoId}`);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/models/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyData
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationLogs(data.verification_logs || 'Verification complete. Model active.');
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setStep(1);
          setName('');
          setDescription('');
          setSelectedFile(null);
          setHubRepoId('');
          setHubFilename('');
          setClassNames('');
          setTags('');
        }, 3000);
      } else {
        setError(data.detail || "Validation check failed.");
        if (data.verification_logs) setVerificationLogs(data.verification_logs);
      }
    } catch (err) {
      setError("Network error sending model payload.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 4;
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[8px]" onClick={onClose} />
      
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#0b0c0e]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_0_80px_rgba(34,197,94,0.12)] animate-in fade-in zoom-in-95 duration-250 my-auto overflow-hidden">
        
        {/* Top Progress Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-[0.2em] bg-green-500/10 px-3 py-1 rounded-full mb-2.5 inline-block border border-green-500/20">
                Wizard Step {step} of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                {step === 1 && <Cpu className="w-5 h-5 text-green-500" />}
                {step === 2 && <Binary className="w-5 h-5 text-green-500" />}
                {step === 3 && <Sliders className="w-5 h-5 text-green-500" />}
                {step === 4 && <Layers className="w-5 h-5 text-green-500" />}
                
                {step === 1 && "Engine Setup"}
                {step === 2 && "Weights Artifact"}
                {step === 3 && "Input Modality"}
                {step === 4 && "Output Schema"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1.5 max-w-md">
                {step === 1 && "Define model parameters and target framework metadata."}
                {step === 2 && "Provide weights binaries locally or select a remote model hub repo."}
                {step === 3 && "Specify input specifications, shape layouts, and normalization presets."}
                {step === 4 && "Configure inference task output targets, class lists, and tagging."}
              </p>
            </div>
            {!loading && (
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/25 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs text-gray-300 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-12 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-green-500/25 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="relative w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Ingestion complete!</h3>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
                The model is compiled and registered successfully.
              </p>
              
              {verificationLogs && (
                <div className="mt-6 mx-auto max-w-sm bg-black/40 border border-white/5 rounded-xl p-3 text-left">
                   <p className="text-[8px] font-bold text-gray-500 uppercase mb-2">Validation Output Console</p>
                   <pre className="text-[10px] text-green-400 font-mono leading-tight whitespace-pre-wrap max-h-36 overflow-y-auto">
                     {verificationLogs}
                   </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* STEP 1: Engine Details */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Model Title Name</label>
                    <input
                      required
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Tomato Early Blight Classifier"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Slug</label>
                    <input
                      disabled
                      value={modelId}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Framework</label>
                    <select
                      value={framework}
                      onChange={e => setFramework(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all cursor-pointer"
                    >
                      <option value="pytorch" className="bg-[#0b0c0e]">PyTorch</option>
                      <option value="tensorflow" className="bg-[#0b0c0e]">TensorFlow / Keras</option>
                      <option value="sklearn" className="bg-[#0b0c0e]">Scikit-Learn</option>
                      <option value="onnx" className="bg-[#0b0c0e]">ONNX Runtime</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Model Serialization Format</label>
                    <select
                      value={modelFormat}
                      onChange={e => setModelFormat(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all cursor-pointer"
                    >
                      <option value="safetensors" className="bg-[#0b0c0e]">safetensors (PyTorch)</option>
                      <option value="keras_h5" className="bg-[#0b0c0e]">Keras H5 (.h5)</option>
                      <option value="onnx" className="bg-[#0b0c0e]">ONNX (.onnx)</option>
                      <option value="pickle" className="bg-[#0b0c0e]">Pickle / Joblib (.pkl)</option>
                      <option value="savedmodel" className="bg-[#0b0c0e]">TensorFlow SavedModel</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe target crop diseases, training datasets used..."
                      rows={2}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Weights Artifact Payload */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
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
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".h5,.pt,.pth,.pkl,.joblib,.onnx,.safetensors"
                      />
                      
                      {selectedFile ? (
                        <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/25 p-4 rounded-2xl animate-in zoom-in-95 duration-200">
                          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm text-gray-200 truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-green-400 uppercase font-mono mt-0.5">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-white/10 hover:border-green-500/30 hover:bg-green-500/[0.02] rounded-2xl py-8 flex flex-col items-center justify-center gap-3 transition-all duration-300 group"
                        >
                          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-green-400 group-hover:scale-110 transition-all">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-300">Choose weights file</p>
                            <p className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase font-mono">Supports H5, PKL, PTH, ONNX, SAFETENSORS</p>
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Model Repository Hub</label>
                        <select
                          value={hubSource}
                          onChange={(e) => setHubSource(e.target.value as any)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50"
                        >
                          <option value="huggingface" className="bg-[#0b0c0e]">Hugging Face</option>
                          <option value="kaggle" className="bg-[#0b0c0e]">Kaggle</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Repository ID</label>
                        <input
                          value={hubRepoId}
                          onChange={(e) => setHubRepoId(e.target.value)}
                          placeholder="e.g. google/vit-base-patch16-224"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Specific weights filename (Optional)</label>
                        <input
                          value={hubFilename}
                          onChange={(e) => setHubFilename(e.target.value)}
                          placeholder="e.g. pytorch_model.bin"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Modality and Preprocessing Presets */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Input Modality</label>
                    <select
                      value={modality}
                      onChange={e => setModality(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all cursor-pointer"
                    >
                      <option value="image" className="bg-[#0b0c0e]">Image Vision Model</option>
                      <option value="audio" className="bg-[#0b0c0e]">Audio / Speech Acoustic Model</option>
                      <option value="text" className="bg-[#0b0c0e]">NLP Text / Token Sequence Model</option>
                      <option value="tabular" className="bg-[#0b0c0e]">Tabular Numeric Dataset Model</option>
                    </select>
                  </div>

                  {modality === 'image' && (
                    <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Image Preprocessing Preset</p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Height (px)</label>
                          <input
                            type="number"
                            value={imgH}
                            onChange={e => setImgH(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Width (px)</label>
                          <input
                            type="number"
                            value={imgW}
                            onChange={e => setImgW(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Channels</label>
                          <input
                            type="number"
                            value={imgC}
                            onChange={e => setImgC(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Normalization standard</label>
                        <select
                          value={normalization}
                          onChange={e => setNormalization(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="none" className="bg-[#0b0c0e]">None (Raw pixel range [0, 255])</option>
                          <option value="rescale_only" className="bg-[#0b0c0e]">Rescale Only (Scale to [0, 1])</option>
                          <option value="imagenet" className="bg-[#0b0c0e]">ImageNet presets (Mean & Std Shift)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {modality === 'audio' && (
                    <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Acoustic Properties</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Sample Rate (Hz)</label>
                          <input
                            type="number"
                            value={audioSampleRate}
                            onChange={e => setAudioSampleRate(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Channels</label>
                          <input
                            type="number"
                            value={audioChannels}
                            onChange={e => setAudioChannels(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Audio Format</label>
                        <input
                          value={audioFormat}
                          onChange={e => setAudioFormat(e.target.value)}
                          placeholder="e.g. wav, mp3"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {modality === 'text' && (
                    <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Text Properties</p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Max Sequence Length</label>
                        <input
                          type="number"
                          value={textMaxLength}
                          onChange={e => setTextMaxLength(Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {modality === 'tabular' && (
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-xs text-gray-400">Tabular properties will parse input shapes matching numeric dataframe dimensions directly.</p>
                    </div>
                  )}

                </div>
              )}

              {/* STEP 4: Output Class Assignments */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Task Type</label>
                    <select
                      value={taskType}
                      onChange={e => setTaskType(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all cursor-pointer"
                    >
                      <option value="classification" className="bg-[#0b0c0e]">classification (Image / Class probability)</option>
                      <option value="regression" className="bg-[#0b0c0e]">regression (Continuous numeric mapping)</option>
                      <option value="object_detection" className="bg-[#0b0c0e]">object_detection (Bounding Boxes)</option>
                    </select>
                  </div>

                  {taskType !== 'regression' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-gray-500" />
                        Target Class Labels (Separated by Commas)
                      </label>
                      <input
                        required
                        autoFocus
                        value={classNames}
                        onChange={e => setClassNames(e.target.value)}
                        placeholder="e.g. Healthy, Leaf Rust, Coffee Miner..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                      />
                      <p className="text-[10px] text-gray-500">Provide labels strictly separated by commas.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Index Search Tags (Separated by Commas)
                    </label>
                    <input
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      placeholder="e.g. Coffee, Fungal, Tropical"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {validationError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold mt-3 animate-in slide-in-from-top-2">
                  {validationError}
                </div>
              )}

              {/* Step Controls */}
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
                    disabled={loading || (source === 'local' && !selectedFile)}
                    onClick={handleSubmit}
                    type="button"
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-400 disabled:opacity-30 text-black font-black px-7 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        Deploy Model
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
