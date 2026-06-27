"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { API_BASE_URL } from '@/config/api';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState({
    identity: '',
    goal: '',
    discovery: '',
    region: ''
  });

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling behind modal
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/onboarding`, {
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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md overflow-y-auto">
      <div className="max-w-2xl w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.1)] my-auto">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-in-out"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-[0.2em] bg-green-500/10 px-3 py-1.5 rounded-full mb-4 inline-block">
            Step {step} of {steps.length}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">{currentStep.title}</h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">{currentStep.desc}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {currentStep.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setData({ ...data, [currentStep.field]: opt.id })}
              className={`flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl border transition-all text-left group ${
                data[currentStep.field as keyof typeof data] === opt.id
                  ? 'bg-green-500/10 border-green-500/40 text-white shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                  : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04] hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                 data[currentStep.field as keyof typeof data] === opt.id
                 ? 'bg-green-500 text-black'
                 : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
              }`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm leading-snug">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          )}
          <button
            disabled={!data[currentStep.field as keyof typeof data] || loading}
            onClick={step === steps.length ? handleSubmit : nextStep}
            className="flex-1 bg-white hover:bg-gray-100 text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{step === steps.length ? 'Finalize Setup' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Subtle decorative ambient lighting */}
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>,
    document.body
  );
}
