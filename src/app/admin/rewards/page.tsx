import { prisma } from "@/lib/prisma";
import AdminRewardsConsole from "@/components/AdminRewardsConsole";

export default async function AdminRewardsPage() {
  const rewards = await prisma.reward.findMany({
    orderBy: { cost: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b-2 border-pink-500 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase text-neon-pink font-arcade">Prize Configurator</h1>
          <p className="text-xs text-gray-400 uppercase mt-1">Configure shop prizes and coordinate claims</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-pink-500/50 rounded-lg bg-pink-950/20 text-xs font-arcade font-bold text-pink-400">
          Conversion Rule: 50 🪙 = $1.00 = 10 Min Screen Time
        </div>
      </div>

      <AdminRewardsConsole rewards={rewards} />
    </div>
  );
}
