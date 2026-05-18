import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RewardCard from "@/components/RewardCard";
import QuickExchangeTerminal from "@/components/QuickExchangeTerminal";

export default async function KidRewards() {
  const session = await getSession();
  const userId = session?.userId as string;

  const [kid, rewards, activeBalances] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    }),
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" },
    }),
    prisma.rewardRedemption.findMany({
      where: {
        userId,
        status: "PENDING",
        redemptionType: { in: ["CASH", "TIME"] },
      },
      include: { reward: true },
    }),
  ]);

  if (!kid) return null;

  const pendingCash = activeBalances
    .filter((b) => b.redemptionType === "CASH")
    .reduce((sum, b) => sum + (b.remainingAmount ?? 0), 0);

  const pendingTime = activeBalances
    .filter((b) => b.redemptionType === "TIME")
    .reduce((sum, b) => sum + (b.remainingAmount ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b-2 border-pink-500 gap-4">
        <h1 className="text-3xl font-bold uppercase text-neon-pink font-arcade">Prize Shop</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-pink-500/50 rounded-lg bg-pink-950/20 text-[10px] sm:text-xs font-arcade font-bold text-pink-400">
          Economy Rule: 50 🪙 = $1.00 Cash = 10 Min Screen Time
        </div>
      </div>

      {/* Active Balances Mainframe Card */}
      {(pendingCash > 0 || pendingTime > 0) && (
        <div className="p-4 bg-black border-2 border-pink-500/30 rounded-xl flex flex-col sm:flex-row gap-4 justify-around shadow-[0_0_15px_rgba(236,72,153,0.1)]">
          {pendingCash > 0 && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-400 text-2xl font-bold font-arcade animate-pulse">
                💵
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase font-arcade tracking-wider text-emerald-400">
                  Unpaid Cash Balance
                </h4>
                <p className="text-xl font-bold text-white font-arcade mt-0.5">
                  ${pendingCash.toFixed(2)}
                </p>
                <span className="text-[9px] text-gray-500 uppercase">Awaiting parent payout</span>
              </div>
            </div>
          )}

          {pendingTime > 0 && (
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-gray-800/80 pt-3 sm:pt-0 sm:pl-8">
              <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400 text-2xl font-bold font-arcade animate-pulse">
                🎮
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase font-arcade tracking-wider text-cyan-400">
                  Screen Time Balance
                </h4>
                <p className="text-xl font-bold text-white font-arcade mt-0.5">
                  {pendingTime} Mins
                </p>
                <span className="text-[9px] text-gray-500 uppercase">Available to use</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Cash & Time Incrementor Terminal */}
      <QuickExchangeTerminal kidCoins={kid.coins} />

      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-black/40 rounded-xl">
          <p className="text-xl font-bold text-gray-500 font-arcade">Shop is empty.</p>
          <p className="mt-2 text-gray-400">Ask your parents to restock the prizes!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} kidCoins={kid.coins} />
          ))}
        </div>
      )}
    </div>
  );
}
