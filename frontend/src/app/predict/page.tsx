"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AiChatModal from "@/components/AiChatModal";

function PredictionStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultModel = searchParams.get("model") || "efficientnet_b0_v1";

  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState("");

  const [isLiveVideo, setIsLiveVideo] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/predict");
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/models`)
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(err => console.error(err));
  }, [router]);

  const stopVideo = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isLiveVideo) {
      setPrediction(null);
      setError("");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
           streamRef.current = stream;
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
           }
           
           intervalRef.current = setInterval(() => {
             if (videoRef.current && streamRef.current?.active) {
                 const canvas = document.createElement("canvas");
                 canvas.width = videoRef.current.videoWidth;
                 canvas.height = videoRef.current.videoHeight;
                 const ctx = canvas.getContext("2d");
                 if (ctx && canvas.width > 0) {
                     ctx.drawImage(videoRef.current, 0, 0);
                     canvas.toBlob((blob) => {
                         if (blob) {
                             const formData = new FormData();
                             formData.append("image", blob, `live_frame_${Date.now()}.jpg`);
                             formData.append("model_id", selectedModel);
                             const token = localStorage.getItem("token");
                             const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                             fetch(`${API_URL}/predict`, {
                                method: "POST",
                                headers: { "Authorization": `Bearer ${token}` },
                                body: formData
                             })
                             .then(res => res.json())
                             .then(data => {
                                 if (!data.detail) {
                                     setPrediction(data);
                                     setError("");
                                 }
                             }).catch(e => console.error(e));
                         }
                     }, "image/jpeg", 0.7);
                 }
             }
           }, 2000);
        })
        .catch(err => {
           setError("Camera permission denied or camera not found.");
           setIsLiveVideo(false);
        });
    } else {
        stopVideo();
    }
    return () => stopVideo();
  }, [isLiveVideo, selectedModel]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handlePredict = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }
    
    setLoading(true);
    setError("");
    setPrediction(null);
    setShowAiChat(false);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("model_id", selectedModel);

      const token = localStorage.getItem("token");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Prediction failed");
      }

      const data = await res.json();
      setPrediction(data);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Prediction Studio</h1>
        <p className="text-gray-400">Run secure, high-accuracy inference bounds on your crop imagery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Panel */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Model Configuration</h3>
            <select 
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 mb-6 transition-colors"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m.model_id} value={m.model_id}>{m.name}</option>
              ))}
            </select>

            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Input Source</h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isLiveVideo} onChange={() => setIsLiveVideo(!isLiveVideo)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${isLiveVideo ? 'bg-green-500' : 'bg-white/20'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isLiveVideo ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm text-gray-300">Live Video</div>
                </label>
            </div>
            
            {isLiveVideo ? (
                <div className="w-full h-80 sm:h-96 min-h-[300px] border-2 border-dashed border-green-500/50 rounded-2xl flex flex-col items-center justify-center bg-black overflow-hidden relative group transition-all">
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                   <div className="absolute top-4 right-4 bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-full font-bold tracking-wider animate-pulse flex items-center gap-2 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
                   </div>
                </div>
            ) : (
                <label 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="w-full h-80 sm:h-96 min-h-[300px] border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white/5 relative overflow-hidden"
                >
                  <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  {preview ? (
                     // Changed object-cover to object-contain so wide/tall images natively fit perfectly
                    <img src={preview} alt="Upload preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-6 transition-transform hover:scale-105">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto text-cyan-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <p className="text-base font-semibold text-white">Drag & drop or click to upload</p>
                      <p className="text-sm text-gray-400 mt-2">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
            )}

            <button 
              onClick={handlePredict}
              disabled={loading || isLiveVideo || !file}
              className="mt-6 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
            >
              {loading ? "Running Inference..." : isLiveVideo ? "Monitoring Stream..." : "Run Prediction"}
            </button>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl h-full flex flex-col">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Analysis Results
            </h3>

            {!prediction ? (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-400 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 opacity-50">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <p>Upload an image or toggle Live Video to initialize optical bounds.</p>
              </div>
            ) : (
              <div className="animate-fade-in-up flex flex-col flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl shadow-inner">
                    <div className="flex-grow">
                      <p className="text-xs sm:text-sm text-green-400 uppercase tracking-wider mb-1 font-semibold">Primary Classification</p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize">{prediction.top_prediction.label.replace(/_/g, ' ')}</h2>
                    </div>
                    <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-green-500/20 pt-4 sm:pt-0 sm:pl-4">
                      <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-1 font-semibold">Confidence</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-400">{(prediction.top_prediction.confidence * 100).toFixed(2)}%</p>
                    </div>
                </div>

                <div className="space-y-4 mb-auto">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase">Top Correlated Classes</h4>
                  {prediction.predictions.map((p: any, idx: number) => (
                    <div key={idx} className="relative pt-1 group">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block uppercase text-white capitalize tracking-wide transition-colors group-hover:text-cyan-300">
                            {p.label.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold inline-block text-gray-400">
                            {(p.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-black/50 border border-white/5 shadow-inner">
                        <div style={{ width: `${p.confidence * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${idx === 0 ? 'bg-gradient-to-r from-green-600 to-green-400' : 'bg-gray-600'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setShowAiChat(true)} className="mt-8 w-full py-4 border-2 border-cyan-500/30 hover:border-cyan-500 rounded-xl text-cyan-50 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-3 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Consult AI Agronomist
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <AiChatModal 
        isOpen={showAiChat} 
        onClose={() => setShowAiChat(false)} 
        predictionContext={prediction} 
      />
    </div>
  );
}

export default function PredictionStudio() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-green-400 font-semibold tracking-widest uppercase">Initializing Studio...</div>}>
      <PredictionStudioContent />
    </Suspense>
  );
}
