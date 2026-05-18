import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Coins, PlusCircle, MinusCircle, ShieldAlert } from "lucide-react";

export default async function KidActivity() {
  const session = await getSession();
  const userId = session?.userId as string;

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 border-b-2 border-cyan-500">
        <h1 className="text-3xl font-bold uppercase text-neon-blue font-arcade flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-cyan-400" /> Transaction Log
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {transactions.map((tx) => {
          const isPositive = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-4 border-2 rounded-xl bg-black/40 ${
                isPositive ? "border-green-900/50" : "border-red-900/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {isPositive ? (
                  <PlusCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <MinusCircle className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <h3 className="font-bold text-white">{tx.reason}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                    {new Date(tx.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 font-bold font-arcade text-xl ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {tx.amount} <Coins className="w-5 h-5" />
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="p-8 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-xl">
            No history yet. Start completing quests!
          </div>
        )}
      </div>
    </div>
  );
}
