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

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const links = [
    { name: 'Overview', href: '/developer', icon: LayoutDashboard, roles: ['developer'] },
    { name: 'Enterprise Home', href: '/enterprise', icon: Globe, roles: ['enterprise'] },
    { name: 'Model Registry', href: '/models', icon: Database, roles: ['developer', 'enterprise', 'standard'] },
    { name: 'Prediction Studio', href: '/predict', icon: Zap, roles: ['developer', 'enterprise', 'standard'] },
    { name: 'Global Heatmap', href: '/enterprise/heatmap', icon: Activity, roles: ['enterprise'] },
    { name: 'Performance', href: '/benchmarks', icon: BarChart3, roles: ['developer', 'enterprise'] },
    { name: 'Security & Keys', href: '/developer#security', icon: ShieldCheck, roles: ['developer', 'enterprise'] },
    { name: 'Audit Logs', href: '/enterprise#audit', icon: Layers, roles: ['enterprise'] },
  ];

  const filteredLinks = links.filter(link => 
    !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <aside className="w-72 bg-[#050505] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-y-auto">
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
        <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
            {user?.email?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.email}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
