"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  X, 
  Terminal, 
  FileCode, 
  Play, 
  CheckCircle, 
  CloudLightning,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface Message {
  sender: "user" | "agent" | "system";
  text: string;
}

export default function AgentAssistPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusText]);

  // Connect to Local Agent WebSocket
  const connectToAgent = () => {
    if (socket) {
      socket.close();
    }
    
    setIsConnecting(true);
    const ws = new WebSocket("ws://localhost:8088/ws");
    
    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setStatusText(null);
      setMessages([
        { 
          sender: "agent", 
          text: "Hello! I am your offline workspace assistant. I can scan your directories, draft declarative `config.json` specifications, validate model inputs, and deploy them directly." 
        }
      ]);
    };
    
    ws.onmessage = (event) => {
      const msg = event.data as string;
      
      if (msg.startsWith("[Agent Status]:")) {
        setStatusText(msg.replace("[Agent Status]:", "").trim());
      } else {
        setStatusText(null);
        setMessages(prev => [...prev, { sender: "agent", text: msg }]);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setStatusText(null);
    };
    
    ws.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };
    
    setSocket(ws);
  };

  useEffect(() => {
    if (isOpen) {
      connectToAgent();
    } else if (socket) {
      socket.close();
    }
    return () => {
      socket?.close();
    };
  }, [isOpen]);

  const handleSend = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !socket || wsReadyState(socket) !== WebSocket.OPEN) return;
    
    setMessages(prev => [...prev, { sender: "user", text }]);
    socket.send(text);
    setInput("");
  };

  const wsReadyState = (ws: WebSocket) => ws.readyState;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#050505]/95 border-l border-white/5 shadow-2xl flex flex-col z-[45] backdrop-blur-xl animate-slide-in-right">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-purple-500/10 text-purple-400 ${isConnected ? 'animate-pulse' : ''}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              Agent Assist
              {isConnected && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              )}
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Local workspace co-pilot</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Offline state overlay */}
      {!isConnected ? (
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
            <CloudLightning className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Agent Host Server Offline</h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[280px]">
              Start the agent locally in your terminal to enable interactive directory scanning, test runner validation, and direct deployment.
            </p>
          </div>
          
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono text-[11px] text-gray-400">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1.5">Launch command</p>
            <div className="flex items-center justify-between">
              <span>omnivax agent start</span>
            </div>
          </div>

          <button
            onClick={connectToAgent}
            disabled={isConnecting}
            className="w-full py-3 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Chat log */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] flex flex-col gap-1 ${
                  m.sender === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed border ${
                  m.sender === "user" 
                    ? "bg-purple-500/10 text-purple-200 border-purple-500/20 rounded-tr-sm" 
                    : "bg-white/5 text-gray-300 border-white/5 rounded-tl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[9px] text-gray-600 uppercase tracking-widest font-semibold px-1">
                  {m.sender === "user" ? "Developer" : "Agent"}
                </span>
              </div>
            ))}
            
            {/* Live tool running status */}
            {statusText && (
              <div className="self-start max-w-[85%]">
                <div className="px-4 py-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 rounded-tl-sm flex gap-2.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
                  <p className="text-[11px] text-purple-300 italic">{statusText}</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Quick Action suggestions */}
          <div className="px-6 py-3 border-t border-white/5 flex gap-2 flex-wrap">
            <button 
              onClick={() => handleSend("Scan my workspace directory")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-[10px] text-gray-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Terminal className="w-3 h-3 text-purple-400" />
              Scan workspace
            </button>
            <button 
              onClick={() => handleSend("Run validation test on real_resnet_config.json")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-[10px] text-gray-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              Test Config
            </button>
            <button 
              onClick={() => handleSend("Register my model")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-[10px] text-gray-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              Deploy Model
            </button>
          </div>

          {/* Chat input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="p-4 border-t border-white/5 bg-[#070707]"
          >
            <div className="flex bg-white/5 border border-white/5 rounded-xl overflow-hidden focus-within:border-purple-500/40 transition-colors">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask agent to write config, run tests..."
                className="flex-grow bg-transparent px-4 py-3 text-xs text-white focus:outline-none placeholder-gray-600"
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                className="px-4 text-purple-400 hover:bg-white/5 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
