import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RewardCard from "@/components/RewardCard";

export default async function KidRewards() {
  const session = await getSession();
  const userId = session?.userId as string;

  const [kid, rewards] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    }),
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" },
    }),
  ]);

  if (!kid) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b-2 border-pink-500 gap-4">
        <h1 className="text-3xl font-bold uppercase text-neon-pink font-arcade">Prize Shop</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-pink-500/50 rounded-lg bg-pink-950/20 text-[10px] sm:text-xs font-arcade font-bold text-pink-400">
          Economy Rule: 50 🪙 = $1.00 Cash = 10 Min Screen Time
        </div>
      </div>

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
