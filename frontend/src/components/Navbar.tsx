"use client";

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function MobileNavLink({ href, label, active, onClick, accent }: {
  href: string; label: string; active: boolean; onClick: () => void; accent?: string;
}) {
  const activeColor = accent === 'blue' ? 'text-blue-400 bg-blue-500/10' : 'text-green-400 bg-green-500/10';
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
        active ? activeColor : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );
}

function MobileMenu({ isOpen, onClose, user, loading, logout, pathname }: {
  isOpen: boolean; onClose: () => void; user: any; loading: boolean; logout: () => void; pathname: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-[#0a0a0a] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black text-xs">Ox</div>
            <span className="font-bold text-lg text-white">Omnivax</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-1">
          <MobileNavLink href="/" label="Home" active={pathname === '/'} onClick={onClose} />
          <MobileNavLink href="/#features" label="Features" active={pathname === '/#features'} onClick={onClose} />
          <MobileNavLink href="/pricing" label="Pricing" active={pathname === '/pricing'} onClick={onClose} />
        </nav>

        {/* Auth Footer */}
        <div className="p-5 border-t border-white/10 shrink-0 space-y-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-sm font-bold text-black uppercase">
                      {user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="block w-full text-center bg-green-500 text-black py-3 rounded-xl text-sm font-bold hover:bg-green-400 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/join-pilot" onClick={onClose} className="block w-full text-center bg-green-500 text-black py-3.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    Join Pilot
                  </Link>
                  <Link href="/login" onClick={onClose} className="block w-full text-center border border-white/20 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
                    Sign In
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function Navbar() {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  return (
    <>
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black">Ox</div>
              <Link href="/" className="font-bold text-xl tracking-tight text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Omnivax</span>
              </Link>
            </div>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-x-4">
              <Link href="/" className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${pathname === '/' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}>Home</Link>
              <Link href="/#features" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Features</Link>
              <Link href="/pricing" className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${pathname === '/pricing' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}>Pricing</Link>

              <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4">
                {!loading && (
                  <>
                    {user ? (
                      <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">Go to Dashboard</Link>
                    ) : (
                      <>
                        <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-all">Sign In</Link>
                        <Link href="/join-pilot" className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">Join Pilot</Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} loading={loading} logout={logout} pathname={pathname} />
    </>
  );
}
