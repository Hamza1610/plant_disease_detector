"use client";

import { useState } from 'react';
import { 
  Users, 
  Target, 
  Search, 
  Globe, 
  ChevronRight, 
  CheckCircle2,
  Loader2,
  ArrowRight,
  Database,
  Activity,
  Zap
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    identity: '',
    goal: '',
    discovery: '',
    region: ''
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/onboarding`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        onComplete();
      }
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Identify Your Role",
      desc: "Help us tailor your experience based on how you'll use Omnivax.",
      options: [
        { id: 'farmer', label: 'Farmer / Ag-Tech User', icon: Users },
        { id: 'developer', label: 'Software Developer / AI Engineer', icon: Target },
        { id: 'researcher', label: 'Researcher / Academic', icon: Search },
        { id: 'enterprise', label: 'Enterprise Administrator', icon: Globe }
      ],
      field: 'identity'
    },
    {
      title: "What is your primary goal?",
      desc: "Knowing your objectives helps us prioritize the right tools for you.",
      options: [
        { id: 'health', label: 'Improving Crop Health & Yield', icon: CheckCircle2 },
        { id: 'research', label: 'Training & Validating Models', icon: Database },
        { id: 'surveillance', label: 'Regional Disease Surveillance', icon: Activity },
        { id: 'commercial', label: 'Building Commercial Ag-Services', icon: Zap }
      ],
      field: 'goal'
    },
    {
      title: "How did you hear about us?",
      desc: "We're curious how you found your way to the Omnivax ecosystem.",
      options: [
        { id: 'social', label: 'Social Media (Twitter, LinkedIn)', icon: Globe },
        { id: 'research_paper', label: 'Scientific / Research Papers', icon: Search },
        { id: 'referral', label: 'Personal / Professional Referral', icon: Users },
        { id: 'search', label: 'Search Engines (Google, Bing)', icon: Search }
      ],
      field: 'discovery'
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="max-w-3xl w-full bg-[#050505] border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.15)]">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-in-out"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <div className="text-center mb-12">
          <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-4 py-2 rounded-full mb-6 inline-block">
            Step {step} of {steps.length}
          </span>
          <h2 className="text-4xl font-bold text-white mb-4">{currentStep.title}</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{currentStep.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {currentStep.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setData({ ...data, [currentStep.field]: opt.id })}
              className={`flex items-center gap-4 p-6 rounded-3xl border transition-all text-left group ${
                data[currentStep.field as keyof typeof data] === opt.id
                  ? 'bg-green-500/10 border-green-500/50 text-white'
                  : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04] hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                 data[currentStep.field as keyof typeof data] === opt.id
                 ? 'bg-green-500 text-black'
                 : 'bg-white/5 text-gray-500 group-hover:text-white'
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-6">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
          )}
          <button
            disabled={!data[currentStep.field as keyof typeof data] || loading}
            onClick={step === steps.length ? handleSubmit : nextStep}
            className="flex-1 bg-white text-black py-5 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 shadow-[0_10px_40px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {step === steps.length ? 'Finalize Setup' : 'Continue'}
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-[100px]" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
