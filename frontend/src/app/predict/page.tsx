"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  // AI Chat state
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/predict");
      return;
    }

    fetch("http://localhost:8000/models")
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(err => console.error(err));
  }, [router]);

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
    setAiResponse(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("model_id", selectedModel);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/predict", {
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
      
      // Auto-trigger initial AI context
      triggerAiRecommendation(data);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAiRecommendation = async (predData: any) => {
      setAiLoading(true);
      try {
        const contextStr = `The model predicted ${predData.top_prediction.label} with ${(predData.top_prediction.confidence * 100).toFixed(2)}% confidence.`;
        const res = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "What are the immediate next steps?",
                prediction_context: contextStr
            })
        });
        const data = await res.json();
        setAiResponse(data.reply);
      } catch (err) {
        console.error("AI Error:", err);
      } finally {
        setAiLoading(false);
      }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiMessage) return;
      setAiLoading(true);
      const userMessage = aiMessage;
      setAiMessage("");
      
      try {
        const contextStr = `The model predicted ${prediction.top_prediction.label} with ${(prediction.top_prediction.confidence * 100).toFixed(2)}% confidence.`;
        const res = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userMessage,
                prediction_context: contextStr
            })
        });
        const data = await res.json();
        setAiResponse(data.reply); // Just replacing for simple UI
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Prediction Studio</h1>
        <p className="text-gray-400">Run secure, high-accuracy inference bounds on your crop imagery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Model Configuration</h3>
            <select 
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 mb-6"
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
                <div className="w-full aspect-square border-2 border-dashed border-green-500/50 rounded-2xl flex flex-col items-center justify-center bg-green-500/5 p-6 text-center">
                   <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4 animate-pulse">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                   </div>
                   <p className="text-green-400 font-semibold mb-1">Live Video Mode</p>
                   <p className="text-xs text-gray-400">Premium feature. Connect your field cameras directly to Omnivax.</p>
                </div>
            ) : (
                <label 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="w-full aspect-square border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 relative overflow-hidden"
                >
                  <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  {preview ? (
                    <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <p className="text-sm font-medium text-white">Drag & drop or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
            )}

            <button 
              onClick={handlePredict}
              disabled={loading || isLiveVideo || !file}
              className="mt-6 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
            >
              {loading ? "Running Inference..." : "Run Prediction"}
            </button>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-2xl min-h-[400px]">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Analysis Results
            </h3>

            {!prediction ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p>Upload an image and run inference to see visual correlations.</p>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-4 mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <div className="flex-grow">
                      <p className="text-sm text-green-400 uppercase tracking-wider mb-1">Primary Classification</p>
                      <h2 className="text-3xl font-bold text-white capitalize">{prediction.top_prediction.label.replace(/_/g, ' ')}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Confidence</p>
                      <p className="text-3xl font-bold text-green-400">{(prediction.top_prediction.confidence * 100).toFixed(2)}%</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase">Top Correlated Classes</h4>
                  {prediction.predictions.map((p: any, idx: number) => (
                    <div key={idx} className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block uppercase text-white capitalize">
                            {p.label.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-gray-400">
                            {(p.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-white/10">
                        <div style={{ width: `${p.confidence * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${idx === 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAiChat ? (
                   <button onClick={() => setShowAiChat(true)} className="w-full py-4 border border-white/20 rounded-xl text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                      Continue with AI Actions
                   </button>
                ) : (
                   <div className="border border-white/10 bg-black/50 rounded-xl overflow-hidden mt-6 animate-fade-in-up">
                      <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                         <span className="text-sm font-semibold text-white">Omnivax AI Agronomist</span>
                      </div>
                      <div className="p-6 text-gray-300 text-sm leading-relaxed min-h-[100px]">
                         {aiLoading ? (
                            <div className="flex items-center gap-2 text-cyan-400">Analyzing context...</div>
                         ) : (
                            <div className="prose prose-invert max-w-none">{aiResponse}</div>
                         )}
                      </div>
                      <form onSubmit={handleChatSubmit} className="border-t border-white/10 flex bg-black">
                         <input 
                           type="text" 
                           className="flex-grow bg-transparent px-4 py-3 text-white focus:outline-none text-sm"
                           placeholder="Ask what to do next..."
                           value={aiMessage}
                           onChange={e => setAiMessage(e.target.value)}
                         />
                         <button type="submit" className="px-6 text-cyan-400 font-semibold hover:bg-white/5 transition-colors">Send</button>
                      </form>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PredictionStudio() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-green-400">Loading Studio Interface...</div>}>
      <PredictionStudioContent />
    </Suspense>
  );
}
