import { prisma } from "@/lib/prisma";
import { Trophy, Star, Award, Coins } from "lucide-react";

export default async function KidLeaderboard() {
  const kids = await prisma.user.findMany({
    where: { role: "KID" },
    orderBy: [
      { coins: "desc" },
      { totalEarned: "desc" },
    ],
  });

  const getBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_#ffea00]" />;
      case 1:
        return <Award className="w-8 h-8 text-slate-300 drop-shadow-[0_0_10px_#cccccc]" />;
      case 2:
        return <Award className="w-8 h-8 text-amber-600 drop-shadow-[0_0_10px_#b45309]" />;
      default:
        return <Star className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 0: return "border-yellow-400 bg-yellow-950/20 text-yellow-300 shadow-[0_0_15px_rgba(254,240,138,0.2)]";
      case 1: return "border-slate-400 bg-slate-900/20 text-slate-300";
      case 2: return "border-amber-600 bg-amber-950/20 text-amber-500";
      default: return "border-gray-800 bg-black/30 text-gray-300";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 border-b-2 border-yellow-400">
        <h1 className="text-3xl font-bold uppercase text-neon-yellow font-arcade flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400" /> Leaderboard
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {kids.map((kid, idx) => (
          <div
            key={kid.id}
            className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${getRankClass(idx)}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 flex justify-center">{getBadge(idx)}</div>
              <div>
                <h3 className="text-2xl font-black font-arcade tracking-wider uppercase">
                  {kid.name}
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
                  LEVEL {Math.floor(kid.totalEarned / 100) + 1} • {kid.tasksCompleted} Quests Clear
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-gray-400 uppercase tracking-wider block">CURRENT</span>
                <span className="text-2xl font-black font-arcade text-yellow-400 flex items-center gap-1.5 justify-end">
                  {kid.coins} <Coins className="w-5 h-5 text-yellow-400 animate-coin" />
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs text-gray-400 uppercase tracking-wider block">ALL-TIME</span>
                <span className="text-xl font-black font-arcade text-purple-400">
                  {kid.totalEarned}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
