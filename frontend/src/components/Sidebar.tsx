"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Globe, 
  Layers,
  ChevronRight,
  LogOut,
  Zap
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const links = [
    { name: 'Overview', href: '/dashboard/developer', icon: LayoutDashboard, roles: ['developer'] },
    { name: 'Enterprise Home', href: '/dashboard/enterprise', icon: Globe, roles: ['enterprise'] },
    { name: 'Model Registry', href: '/dashboard/models', icon: Database, roles: ['developer', 'enterprise', 'standard'] },
    { name: 'Prediction Studio', href: '/dashboard/predict', icon: Zap, roles: ['developer', 'enterprise', 'standard'] },
    { name: 'Global Heatmap', href: '/dashboard/heatmap', icon: Activity, roles: ['enterprise'] },
    { name: 'Performance', href: '/dashboard/benchmarks', icon: BarChart3, roles: ['developer', 'enterprise', 'standard'] },
    { name: 'Security & Keys', href: '/dashboard/security', icon: ShieldCheck, roles: ['developer', 'enterprise'] },
    { name: 'Audit Logs', href: '/dashboard/audit', icon: Layers, roles: ['enterprise'] },
  ];

  const filteredLinks = links.filter(link => 
    !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#050505] border-r border-white/5 flex flex-col h-screen overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black text-sm shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            Ox
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Omnivax</span>
        </Link>

        <nav className="space-y-1.5">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className={`w-5 h-5 ${isActive ? 'text-green-400' : 'group-hover:text-white'}`} />
                  {link.name}
                </div>
                {isActive && <div className="w-1 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5">
        <Link href="/dashboard/profile" className="flex items-center gap-3 mb-6 p-3 bg-white/5 hover:bg-white/[0.08] hover:border-green-500/20 rounded-2xl border border-white/5 transition-all group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 uppercase group-hover:text-green-400 transition-colors">
            {user?.email?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate group-hover:text-green-400 transition-colors">{user?.email}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.role}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transform group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
