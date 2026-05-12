"use client";

import Sidebar from "@/components/Sidebar";
import { useUser } from "@/hooks/useUser";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useState, useEffect } from "react";
import { Loader2, Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, refreshUser } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020202]">
      {showOnboarding && (
        <OnboardingWizard onComplete={async () => {
          await refreshUser();
          setShowOnboarding(false);
        }} />
      )}
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#050505] border-b border-white/5 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black text-sm">
              Ox
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Omnivax</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
