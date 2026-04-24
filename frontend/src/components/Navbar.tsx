"use client";

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black">
              Ox
            </div>
            <Link href="/" className="font-bold text-xl tracking-tight text-white flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Omnivax</span>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-3">
            <Link href="/models" className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${pathname === '/models' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}>Catalog</Link>
            <Link href="/predict" className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${pathname === '/predict' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}>Studio</Link>
            
            {user?.role === 'developer' && (
              <Link href="/developer" className={`px-2 py-1 rounded-md text-sm font-medium border border-green-500/30 bg-green-500/5 transition-colors ${pathname === '/developer' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}>
                Dev Hub
              </Link>
            )}

            <Link href="/benchmarks" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Benchmarks</Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors hidden sm:block">Pricing</Link>
            
            <div className="flex items-center gap-3 ml-2">
              {!loading && (
                <>
                  {user ? (
                    <button 
                      onClick={() => logout()}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <>
                      <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
                        Sign In
                      </Link>
                      <Link href="/join-pilot" className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
                        Join Pilot
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
