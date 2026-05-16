"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardRoot() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'developer') {
        router.replace('/dashboard/developer');
      } else if (user.role === 'enterprise') {
        router.replace('/dashboard/enterprise');
      } else {
        router.replace('/dashboard/predict');
      }
    } else if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );
}
