import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030303]">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:py-24 lg:py-32 overflow-hidden flex md:items-center md:min-h-[90vh]">
        
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full animate-fade-in-up">
          <div className="flex flex-col space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-fit">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Developer & Platform Updates Active</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Deploy State-of-the-art <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400">
                Plant Intelligence
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Omnivax is an enterprise-grade, model-first plant disease AI platform. Register pre-trained weights, manage local developers sessions via offline helper agents, and run scale-out asynchronous hub deployments.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 w-full">
              <Link href="/join-pilot" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-gradient-to-r from-green-500 to-emerald-400 px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-bold text-black shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] hover:scale-105 transition-all duration-300">
                Join the Pilot Program
              </Link>
              <Link href="/docs" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-white/5 border border-white/10 px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                Developer Docs
              </Link>
            </div>
          </div>
          
          <div className="relative w-full aspect-square max-w-[450px] mx-auto md:ml-auto perspective-1000 mt-12 md:mt-0">
             <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-transparent rounded-3xl blur-2xl transform -rotate-6"></div>
             <div className="relative glass-panel rounded-3xl overflow-hidden shadow-2xl p-2 transform rotate-1 hover:rotate-0 transition-transform duration-500 hover:scale-[1.02]">
                <Image 
                  src="/hero.png" 
                  alt="Omnivax Plant Intelligence Dashboard" 
                  width={800} 
                  height={800} 
                  className="rounded-2xl object-cover w-full h-full"
                  priority
                />
             </div>
             
             {/* Floating UI Elements for dynamic feel */}
             <div className="absolute -bottom-6 -left-6 glass-panel rounded-xl p-4 shadow-xl flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Prediction</p>
                  <p className="text-sm font-bold text-white">Omni Leaf Blight v1</p>
                </div>
             </div>
             <div className="absolute -top-6 -right-6 glass-panel rounded-xl p-4 shadow-xl flex items-center gap-4 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Confidence</p>
                  <p className="text-xl font-bold text-green-400">98.7%</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Catalog Grid */}
      <section className="py-24 bg-black relative border-t border-white/5" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight sm:text-4xl">
              Production-Ready Plant Disease Diagnostics
            </h2>
            <p className="text-gray-450 leading-relaxed">
              Equipped with declarative architectures, secure integrations, and interactive toolsets for professional researchers and enterprise engineers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* 1. Model Registry */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
               <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 text-green-400 border border-green-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Declarative Model Engine</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Standardized model configuration metadata (`config.json`) defining channel mean, standard deviation normalizations, target task structures, and classes.
               </p>
             </div>

             {/* 2. Asynchronous Deployments */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 border border-emerald-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17m-.001-4v4h-.01"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Distributed Async Deployments</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Leverages Celery tasks and Redis message brokers to download large weight models asynchronously from Hugging Face and Kaggle in the background.
               </p>
             </div>

             {/* 3. Interactive Developer Agent */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
               <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 border border-purple-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Interactive Workspace Agent</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Local WebSocket agent that scans code paths, writes configurations, lists session history logs, and executes validation checks directly in browser or terminal.
               </p>
             </div>

             {/* 4. Prediction Studio */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
               <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400 border border-cyan-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Prediction Studio</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Interactive diagnostics dashboard. Upload custom plant disease leaf imagery and receive multi-class confidence metrics and model performance analytics.
               </p>
             </div>

             {/* 5. Secure Credentials */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
               <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 text-teal-400 border border-teal-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Encrypted Integration Vault</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Store access tokens securely utilizing AES-256 Fernet symmetric cryptography, verified on the fly against remote hub verification endpoints.
               </p>
             </div>

             {/* 6. Universal CLI */}
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 border border-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-3">Universal CLI Pack</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Control model registry, start agent servers, resume saved chat histories, and check validation logs in real-time right from your terminal console.
               </p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
