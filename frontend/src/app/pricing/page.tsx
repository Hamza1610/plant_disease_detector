"use client";

export default function Pricing() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Pricing & Access</h1>
        <p className="text-gray-400 text-lg">Scalable plant intelligence API for individual researchers up to global enterprise fleets.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Tier 1 */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-white mb-2">Researcher</h3>
          <p className="text-gray-400 text-sm mb-6">Perfect to test single inferences.</p>
          <div className="text-4xl font-bold text-white mb-8">Free</div>
          
          <ul className="text-gray-300 text-sm space-y-4 mb-8 text-left w-full">
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 100 API Calls / Month</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Base Models Access</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Support Community</li>
          </ul>
          
          <a href="/join-pilot" className="mt-auto w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Start Free</a>
        </div>

        {/* Tier 2 */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)] transform scale-105 relative z-10">
          <div className="absolute top-0 transform -translate-y-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
          <h3 className="text-xl font-bold text-white mb-2">Agri Startup</h3>
          <p className="text-green-200 text-sm mb-6">For growing platforms needing high throughput.</p>
          <div className="text-2xl font-bold text-emerald-400 mb-8 mt-2">Coming Soon</div>
          
          <ul className="text-gray-300 text-sm space-y-4 mb-8 text-left w-full">
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 50,000 API Calls / Month</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Priority Inference Queue</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Gemini AI Analyst Included</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Advanced API Dashboards</li>
          </ul>
          
          <a href="/join-pilot" className="mt-auto w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-colors">Start Pilot</a>
        </div>

        {/* Tier 3 */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
          <p className="text-gray-400 text-sm mb-6">Unlimited global deployments.</p>
          <div className="text-2xl font-bold text-emerald-400 mb-8 mt-2">Coming Soon</div>
          
          <ul className="text-gray-300 text-sm space-y-4 mb-8 text-left w-full">
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Real-time Video Inference</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Custom Model Hosting</li>
             <li className="flex gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> SLA Guarantees</li>
          </ul>
          
          <a href="#" className="mt-auto w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Contact Sales</a>
        </div>
      </div>
    </div>
  );
}
