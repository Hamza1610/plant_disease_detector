import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plant Disease Omnivax",
  description: "Deploy state-of-the-art agricultural models tailored for high-accuracy disease detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
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
                  <Link href="/models" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Catalog</Link>
                  <Link href="/predict" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Studio</Link>
                  <Link href="/benchmarks" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Benchmarks</Link>
                  <Link href="/pricing" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors hidden sm:block">Pricing</Link>
                  <div className="flex items-center gap-3 ml-2">
                    <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
                      Sign In
                    </Link>
                    <Link href="/join-pilot" className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
                      Join Pilot
                    </Link>
                  </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 w-full relative">
          {children}
        </main>

        <footer className="bg-black border-t border-white/10 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1">
                 <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black text-xs">
                    Ox
                  </div>
                  <span className="font-bold text-lg text-white">Omnivax</span>
                </div>
                <p className="text-sm text-gray-400">Pioneering AI-driven agricultural diagnostics for the modern farmer and enterprise.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Platform</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/models" className="hover:text-green-400">Model Registry</Link></li>
                  <li><Link href="/predict" className="hover:text-green-400">Prediction Studio</Link></li>
                  <li><Link href="/benchmarks" className="hover:text-green-400">Benchmarks</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-green-400">About Us</Link></li>
                  <li><Link href="/pricing" className="hover:text-green-400">Pricing & Access</Link></li>
                  <li><Link href="#" className="hover:text-green-400">Contact Sales</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-green-400">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-green-400">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-white/10 pt-8 flex text-sm text-gray-500 justify-between items-center">
              <p>&copy; {new Date().getFullYear()} Plant Disease Omnivax. All rights reserved.</p>
              <div className="flex gap-4">
                <span>Enterprise Grade</span>
                <span>•</span>
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
