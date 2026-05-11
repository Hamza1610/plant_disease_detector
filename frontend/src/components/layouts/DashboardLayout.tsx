"use client";

import Sidebar from "@/components/Sidebar";
import { useUser } from "@/hooks/useUser";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, refreshUser } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      
      <Sidebar />
      
      <main className="flex-1 min-w-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
