import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:py-24 lg:py-32 overflow-hidden flex md:items-center md:min-h-[90vh]">
        
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full animate-fade-in-up">
          <div className="flex flex-col space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-fit">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Pilot Registration Now Open</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Deploy State-of-the-art <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400">
                Plant Intelligence
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Omnivax brings cutting-edge computer vision models to modern agriculture. Detect multi-class plant diseases, analyze confidence correlations, and receive instant AI-driven agronomic recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 w-full">
              <Link href="/join-pilot" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-gradient-to-r from-green-500 to-emerald-400 px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-bold text-black shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] hover:scale-105 transition-all duration-300">
                Join the Pilot Program
              </Link>
              <Link href="/models" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-white/5 border border-white/10 px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-all duration-300">
                Explore Model Catalog
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

      {/* Mission / Vision Section */}
      <section className="py-24 bg-black relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Empowering Agriculture with AI</h2>
            <p className="text-gray-400">Our mission is to democratize access to high-performance computer vision systems for farmers, researchers, and ag-tech startups globally.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Model Registry</h3>
               <p className="text-gray-400 text-sm">A centralized, organized database of specialized agricultural models with complete metadata, input specs, and versioning.</p>
             </div>
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/10 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
               <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Prediction Studio</h3>
               <p className="text-gray-400 text-sm">Interactive, drag-and-drop inference workspace. View beautiful correlation badges and real-time confidence bars for every prediction.</p>
             </div>
             <div className="glass-panel p-8 rounded-2xl hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Gemini AI Assistant</h3>
               <p className="text-gray-400 text-sm">Beyond simple classification. Our integrated AI analyzes your results and provides actionable steps, "What do I do next?" answers directly in-studio.</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
