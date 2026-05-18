import ArcadeLogin from "@/components/ArcadeLogin";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/40 via-purple-900/40 to-transparent"></div>
      
      <div className="relative z-10 w-full">
        <ArcadeLogin />
        
        <div className="mt-12 text-center">
          <Link 
            href="/admin/login" 
            className="text-xs text-purple-400 opacity-50 uppercase tracking-widest hover:opacity-100 hover:text-pink-400 transition-all"
          >
            Admin Access
          </Link>
        </div>
      </div>
    </main>
  );
}
