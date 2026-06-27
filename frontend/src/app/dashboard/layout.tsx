"use client";

import Sidebar from "@/components/Sidebar";
import { useUser } from "@/hooks/useUser";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useState, useEffect } from "react";
import { Loader2, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, refreshUser } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  // Authorization check
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
      return;
    }

    if (!loading && user) {
      // Define allowed paths per role
      const allowedPaths: Record<string, string[]> = {
        developer: ["/dashboard/developer", "/dashboard/models", "/dashboard/predict", "/dashboard/benchmarks", "/dashboard/security", "/dashboard/profile"],
        enterprise: ["/dashboard/enterprise", "/dashboard/heatmap", "/dashboard/models", "/dashboard/predict", "/dashboard/benchmarks", "/dashboard/security", "/dashboard/profile"],
        standard: ["/dashboard/models", "/dashboard/predict", "/dashboard/benchmarks", "/dashboard/profile"],
      };

      // Extract base path (e.g., /dashboard/predict from /dashboard/predict/123)
      // For exact matching against allowed list
      const basePath = pathname; // Assuming simple routes for now
      
      const roleAllowedPaths = allowedPaths[user.role] || allowedPaths['standard'];
      
      // If they are on the root dashboard, dashboard/page.tsx will handle the redirect to their default
      if (basePath !== "/dashboard") {
        // If they try to access a specific feature they don't have access to
        const isAllowed = roleAllowedPaths.some(p => basePath.startsWith(p));
        if (!isAllowed) {
          // Redirect to their default
          const defaultPath = roleAllowedPaths[0];
          router.push(defaultPath);
        }
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
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
      
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
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
