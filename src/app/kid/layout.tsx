import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Coins, LogOut, Home, ListTodo, Gift, Activity, Trophy } from "lucide-react";
import { logout } from "@/app/actions/auth";
import KidAvatarHeader from "@/components/KidAvatarHeader";

export default async function KidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const kid = await prisma.user.findUnique({
    where: { id: session?.userId as string },
  });

  if (!kid) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 p-4 border-b-2 bg-arcade-panel border-cyan-500 box-neon-blue">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <KidAvatarHeader kid={{ id: kid.id, name: kid.name, profilePic: kid.profilePic }} />
            <span className="hidden text-xl font-bold uppercase sm:inline font-arcade text-neon-pink mr-4">
              {kid.name}
            </span>

            {/* Desktop Navbar Links */}
            <div className="hidden sm:flex items-center gap-6 border-l border-gray-800 pl-6">
              <DesktopNavLinks />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-black border-2 rounded-full border-yellow-400 shadow-[0_0_10px_#ffea00]">
              <Coins className="text-yellow-400 animate-coin w-6 h-6" />
              <span className="text-2xl font-bold tracking-widest text-white font-arcade">
                {kid.coins}
              </span>
            </div>

            <form action={logout}>
              <button className="p-2 text-red-400 transition-colors bg-black border border-red-500 rounded-lg hover:bg-red-500 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 mx-auto sm:p-6 pb-24 sm:pb-6">
        {children}
      </main>

      {/* Sticky Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 p-2 border-t-2 bg-arcade-panel border-cyan-500 box-neon-blue sm:hidden">
        <div className="flex justify-around max-w-md mx-auto">
          <MobileNavLinks />
        </div>
      </nav>
    </div>
  );
}

function DesktopNavLinks() {
  return (
    <>
      <Link href="/kid/dashboard" className="text-xs uppercase font-arcade text-cyan-400 hover:text-white transition-colors">
        Home
      </Link>
      <Link href="/kid/tasks" className="text-xs uppercase font-arcade text-green-400 hover:text-white transition-colors">
        Tasks
      </Link>
      <Link href="/kid/rewards" className="text-xs uppercase font-arcade text-pink-400 hover:text-white transition-colors">
        Rewards
      </Link>
      <Link href="/kid/leaderboard" className="text-xs uppercase font-arcade text-yellow-400 hover:text-white transition-colors">
        Rank
      </Link>
      <Link href="/kid/activity" className="text-xs uppercase font-arcade text-purple-400 hover:text-white transition-colors">
        History
      </Link>
    </>
  );
}

function MobileNavLinks() {
  return (
    <>
      <Link href="/kid/dashboard" className="flex flex-col items-center p-2 text-cyan-400 hover:text-white">
        <Home className="w-6 h-6 mb-1" />
        <span className="text-xs uppercase font-arcade">Home</span>
      </Link>
      <Link href="/kid/tasks" className="flex flex-col items-center p-2 text-green-400 hover:text-white">
        <ListTodo className="w-6 h-6 mb-1" />
        <span className="text-xs uppercase font-arcade">Tasks</span>
      </Link>
      <Link href="/kid/rewards" className="flex flex-col items-center p-2 text-pink-400 hover:text-white">
        <Gift className="w-6 h-6 mb-1" />
        <span className="text-xs uppercase font-arcade">Rewards</span>
      </Link>
      <Link href="/kid/leaderboard" className="flex flex-col items-center p-2 text-yellow-400 hover:text-white">
        <Trophy className="w-6 h-6 mb-1" />
        <span className="text-xs uppercase font-arcade">Rank</span>
      </Link>
      <Link href="/kid/activity" className="flex flex-col items-center p-2 text-purple-400 hover:text-white">
        <Activity className="w-6 h-6 mb-1" />
        <span className="text-xs uppercase font-arcade">History</span>
      </Link>
    </>
  );
}
