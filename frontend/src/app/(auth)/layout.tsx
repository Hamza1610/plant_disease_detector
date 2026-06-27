import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center relative">
      {/* Centered Logo for Auth Pages */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            Ox
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Omnivax</span>
        </Link>
      </div>

      <main className="w-full relative z-10 py-20">
        {children}
      </main>
    </div>
  );
}
