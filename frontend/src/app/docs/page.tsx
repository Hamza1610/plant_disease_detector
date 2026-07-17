"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Tab = "architecture" | "api" | "cli" | "agent" | "schema";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("architecture");

  const tabClass = (tab: Tab) =>
    `w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 border ${
      activeTab === tab
        ? "bg-green-500/10 border-green-500/30 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-gray-300">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col md:flex-row gap-8 p-6 md:py-12">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <div className="px-4 py-2">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest text-green-400">Developer Portal</h2>
            <p className="text-[10px] text-gray-500 mt-1">Omnivax Core Architecture & Specs</p>
          </div>
          <nav className="flex flex-col gap-1.5 mt-4">
            <button onClick={() => setActiveTab("architecture")} className={tabClass("architecture")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Architecture Overview
            </button>
            <button onClick={() => setActiveTab("api")} className={tabClass("api")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Backend REST API
            </button>
            <button onClick={() => setActiveTab("cli")} className={tabClass("cli")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              Typer CLI Manual
            </button>
            <button onClick={() => setActiveTab("agent")} className={tabClass("agent")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Developer Helper Agent
            </button>
            <button onClick={() => setActiveTab("schema")} className={tabClass("schema")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Config.json Schema
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow glass-panel rounded-3xl p-8 bg-[#0a0a0a]/60 backdrop-blur-md border border-white/5 shadow-2xl overflow-hidden min-h-[70vh]">
          {activeTab === "architecture" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Architecture</h1>
              <p className="text-gray-400 leading-relaxed text-sm">
                Omnivax is built as a high-performance Model-as-a-Service (MaaS) platform designed for plant disease diagnostics. The system follows a modular domain-driven layout with an asynchronous distributed queue execution engine.
              </p>
              
              <div className="border-t border-white/5 my-4 pt-4">
                <h3 className="text-lg font-bold text-white mb-4">Core Deployment Pipeline</h3>
                <div className="p-5 bg-black/60 rounded-2xl border border-white/5 font-mono text-[11px] text-green-400 overflow-x-auto leading-relaxed">
                  {"[CLI/Client UI] ---> [FastAPI API Router] ---> [PostgreSQL (Pending)]"}
                  <br />
                  {"                           |"}
                  <br />
                  {"                           v"}
                  <br />
                  {"                  [Redis Job Broker]"}
                  <br />
                  {"                           |"}
                  <br />
                  {"                           v"}
                  <br />
                  {"               [Celery Background Workers]"}
                  <br />
                  {"              /                          \\"}
                  <br />
                  {"   [Download Model Weights]       [Run Smoke Validation]"}
                  <br />
                  {"             \\                            /"}
                  <br />
                  {"              v                          v"}
                  <br />
                  {"         [Storage Bucket]       [PostgreSQL (Active/Failed)]"}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                <h3 className="text-lg font-bold text-white">Domain Layout Details</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <li className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-green-400 block mb-1">app/domains/auth</span>
                    Supabase identity mapping, long-lived API key generation, and AES-256 Fernet credentials validation.
                  </li>
                  <li className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-green-400 block mb-1">app/domains/models</span>
                    Celery async task runners, Hugging Face / Kaggle Hub integration downloads, metadata parsing, and catalog directories verification.
                  </li>
                  <li className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-green-400 block mb-1">app/domains/inference</span>
                    Model loading runtime adapters (PyTorch, ONNX) with caching features to ensure low latency diagnostic requests.
                  </li>
                  <li className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-green-400 block mb-1">app/infrastructure</span>
                    Filesystem storage management, encryption key integration, and shared system-level tools.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="flex flex-col gap-6 animate-fade-in overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">REST API Reference</h1>
              <p className="text-gray-400 leading-relaxed text-sm">
                Integrate diagnostics directly into third-party apps using our developer API keys or User Bearer sessions.
              </p>

              <div className="border-t border-white/5 my-4 pt-4 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-green-500/10 text-green-400 border border-green-500/20">POST</span>
                    <span className="text-sm font-mono font-bold text-white">/predict</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Submit a leaf image to execute model diagnostic predictions.</p>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`// Header: X-API-Key: omni_abcdef12345
// Form Data:
//   image: <File>
//   model_id: "resnet50_leaf_v1" (Optional)

{
  "model_id": "resnet50_leaf_v1",
  "top_prediction": {
    "label": "Corn_Common_Rust",
    "confidence": 0.942
  },
  "predictions": [
    { "label": "Corn_Common_Rust", "confidence": 0.942 },
    { "label": "Corn_Healthy", "confidence": 0.058 }
  ],
  "latency_ms": 14.2
}`}
                  </pre>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-green-500/10 text-green-400 border border-green-500/20">POST</span>
                    <span className="text-sm font-mono font-bold text-white">/models/deploy-hub</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Enqueues a Celery task to import model weights asynchronously from Kaggle or Hugging Face.</p>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`{
  "model_id": "resnet50_leaf",
  "name": "ResNet50 Leaf Blight",
  "source": "huggingface",
  "repo_id": "org/resnet50-leaf-rust"
}

// Response (202 Accepted):
{
  "task_id": "task-uuid-12345",
  "status": "queued",
  "message": "Deployment job dispatched to background worker."
}`}
                  </pre>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-green-500/10 text-green-400 border border-green-500/20">POST</span>
                    <span className="text-sm font-mono font-bold text-white">/auth/credentials</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Configures encrypted Hugging Face/Kaggle access keys in the User Integration vault.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cli" && (
            <div className="flex flex-col gap-6 animate-fade-in overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Typer CLI Reference Manual</h1>
              <p className="text-gray-400 leading-relaxed text-sm">
                Install the `omnivax` terminal utility globally or inside a local virtual environment:
              </p>
              <pre className="bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-xs text-green-450">
                {"pip install -e cli/"}
              </pre>

              <div className="border-t border-white/5 my-4 pt-4 flex flex-col gap-8">
                {/* Auth Group */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Authentication Commands (`omnivax auth`)
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax auth login</div>
                      <p className="text-gray-450 mb-2">Authenticate terminal session with your Supabase credentials.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --url &lt;url&gt; (Supabase Url), --key &lt;key&gt; (Anon Key)</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax auth logout</div>
                      <p className="text-gray-450">Clears current session details and access tokens from local configurations.</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax auth whoami</div>
                      <p className="text-gray-450">Prints current active logged-in email and User identifier.</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax auth keys [create|list|revoke]</div>
                      <p className="text-gray-450 mb-2">Generate and manage long-lived API keys (`omni_*`) for programmatic SDK pipelines.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Arguments: name (for key creation), key_id (for key revocation)</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax auth credentials [set|list|delete]</div>
                      <p className="text-gray-450 mb-2">Securely register third-party tokens in the AES-256 credentials vault.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --source &lt;huggingface|kaggle&gt;</p>
                    </div>
                  </div>
                </div>

                {/* Models Group */}
                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Model Catalog Commands (`omnivax models`)
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models list</div>
                      <p className="text-gray-450">Query and print all active agricultural models inside the catalog registry in a formatted table.</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models info &lt;model_id&gt;</div>
                      <p className="text-gray-450">Displays detailed parameters of a model, including description, framework, tags, and classification classes.</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models push</div>
                      <p className="text-gray-450 mb-2">Upload weights and configurations to the registry database.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --file (-f) &lt;path&gt;, --id &lt;id&gt;, --name &lt;name&gt;, --classes &lt;classes_json&gt;, --config (-c) &lt;config_json&gt;, --dir (-d) &lt;directory&gt;</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models register</div>
                      <p className="text-gray-450 mb-2">Validate and register a new model layout directly using a configuration path.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --config (-c) &lt;config.json_path&gt; (Required)</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models deploy-hub</div>
                      <p className="text-gray-450 mb-2">Triggers background Celery tasks to fetch pre-trained weights from Hugging Face or Kaggle.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --model-id &lt;id&gt;, --name &lt;name&gt;, --source &lt;hf|kaggle&gt;, --repo-id &lt;repo&gt; (Required)</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax models batch-deploy</div>
                      <p className="text-gray-450 mb-2">Runs parallel hub imports using a JSON array config, providing a live watcher console dashboard.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --config (-c) &lt;batch_config_path&gt; (Required)</p>
                    </div>
                  </div>
                </div>

                {/* Diagnostics Group */}
                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Diagnostics Executions (`omnivax run`)
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax run predict &lt;model_id&gt; &lt;image_path&gt;</div>
                      <p className="text-gray-400 leading-relaxed mb-2">
                        Classify plant leaf disease on a local image. Submits image bytes to the inference pipeline and prints formatted panel diagnostics reports.
                      </p>
                      <pre className="bg-black/60 p-2.5 rounded-lg border border-white/5 font-mono text-[10px] text-gray-450">
                        {"omnivax run predict resnet50_tomato ./leaf.jpg"}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Agent Group */}
                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Local Agent Workspace Commands (`omnivax agent`)
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax agent start</div>
                      <p className="text-gray-400 mb-2">Runs the offline local helper agent server (serves the HTML dashboard and WebSocket channel).</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --port &lt;8088&gt;, --host &lt;127.0.0.1&gt;, --open-browser/--no-open-browser</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax agent chat</div>
                      <p className="text-gray-400 mb-2">Starts the interactive console chat to execute workspace scans, generate configs, and perform testing.</p>
                      <p className="text-[10px] text-gray-500 font-mono">Options: --server-url &lt;url&gt;, --session-id &lt;id&gt; (to resume past chats)</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="font-mono text-green-400 font-bold mb-1">omnivax agent history</div>
                      <p className="text-gray-450">Fetches and displays a rich table of all local conversation sessions, keys, and timestamps.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "agent" && (
            <div className="flex flex-col gap-6 animate-fade-in overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Helper Agent</h1>
              <p className="text-gray-400 leading-relaxed text-sm">
                Omnivax bundles an offline workspace agent that scans local directories, generates models configs, and runs validation scripts.
              </p>

              <div className="border-t border-white/5 my-4 pt-4 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">WebSocket Logging Framing</h3>
                  <p className="text-xs text-gray-450 mb-3">
                    The local server logs all outputs, user inputs, and background tools execution traces. Restoring logs triggers historical payloads:
                  </p>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`[Session ID]: session_20260717_152340
[History user]: Scan my current directory
[History agent]: [Agent Status]: Invoking tool 'list_directory'...
[History system]: Tool 'list_directory' returned: ['resnet.pth', 'config.json']
[History End]`}
                  </pre>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-sm font-bold text-white mb-2">Local Session JSON Schema</h3>
                  <p className="text-xs text-gray-450 mb-3">Saved in `agent/history/session_*.json` for local tracking.</p>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`{
  "session_id": "session_20260717_152340",
  "title": "Tomato Disease Scan",
  "created_at": "2026-07-17T15:23:40.000Z",
  "updated_at": "2026-07-17T15:24:10.000Z",
  "messages": [
    { "sender": "user", "text": "Scan my workspace" },
    { "sender": "agent", "text": "[Agent Status]: Scanning..." }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="flex flex-col gap-6 animate-fade-in overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Declarative Config Schema</h1>
              <p className="text-gray-400 leading-relaxed text-sm">
                Create a `config.json` inside your model folder before uploading. The platform uses this file to configure image preprocessing normalizations and prediction labels.
              </p>

              <div className="border-t border-white/5 my-4 pt-4">
                <pre className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`{
  "model_id": "resnet50_leaf_v1",
  "name": "ResNet50 Tomato Leaf Blight Classifier",
  "framework": "pytorch", // pytorch | onnx | tensorflow
  "task_type": "classification", // classification | regression
  "input_shape": [1, 3, 224, 224], // [batch, channels, height, width]
  "normalization": {
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "scale": 255.0
  },
  "classes": [
    "Tomato_Blight",
    "Tomato_Leaf_Mold",
    "Tomato_Healthy"
  ],
  "tags": ["resnet", "tomato"]
}`}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
