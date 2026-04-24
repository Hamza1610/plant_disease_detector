import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from "@/config/api";

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionContext: any;
}

export default function AiChatModal({ isOpen, onClose, predictionContext }: AiChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize auto-chat if empty and freshly opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && predictionContext) {
      handleSend("What are the immediate next steps?", predictionContext);
    }
  }, [isOpen, predictionContext]);

  // Smooth scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string, contextOverride: any = null) => {
    if (!text.trim()) return;
    
    // Optimistic UI insert
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let contextStr = "";
      if (contextOverride || predictionContext) {
        const pred = contextOverride || predictionContext;
        if (pred?.top_prediction?.label) {
           contextStr = `The model predicted ${pred.top_prediction.label} with ${(pred.top_prediction.confidence * 100).toFixed(2)}% confidence.`;
        }
      }

      const bodyPayload = {
        message: text,
        prediction_context: contextStr,
        history: messages 
      };

      const res = await fetch(API_ENDPOINTS.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
         throw new Error(data.detail || "Server error from Gemini API.");
      }
      
      const aiMsg: ChatMessage = { role: 'model', content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: `⚠️ AI Engine Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/80 transition-opacity">
      <div className="w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden relative animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
             <div>
               <h3 className="text-white font-semibold">Omnivax AI Agronomist</h3>
               <p className="text-xs text-gray-400">Continuous Evaluation Session</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Chat Log */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 flex flex-col gap-6 custom-scrollbar">
          {messages.map((m, idx) => (
             <div key={idx} className={`max-w-[90%] sm:max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/30 rounded-tr-sm' : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-sm'}`}>
                   <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                </div>
                <span className={`text-[10px] text-gray-500 mt-1.5 block px-1 uppercase tracking-wider font-semibold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.role === 'user' ? 'You' : 'AI Agronomist'}
                </span>
             </div>
          ))}
          {loading && (
             <div className="self-start max-w-[85%]">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex gap-2 items-center h-12">
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-4 sm:p-6 border-t border-white/10 bg-[#0a0a0a]">
           <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors shadow-inner">
              <input 
                type="text" 
                className="flex-grow bg-transparent px-5 py-4 text-white focus:outline-none text-sm placeholder-gray-500"
                placeholder="Ask follow-up questions about the diagnosed crop..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button disabled={loading || !input.trim()} type="submit" className="px-6 flex items-center justify-center text-cyan-400 hover:bg-white/5 transition-colors disabled:opacity-50">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
