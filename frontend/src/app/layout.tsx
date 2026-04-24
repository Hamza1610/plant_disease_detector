import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plant Disease Omnivax",
  description: "Deploy state-of-the-art agricultural models tailored for high-accuracy disease detection.",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />

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
