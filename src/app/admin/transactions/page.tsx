import { prisma } from "@/lib/prisma";
import AdminTransactionsConsole from "@/components/AdminTransactionsConsole";

export default async function AdminTransactionsPage() {
  const [transactions, kids] = await Promise.all([
    prisma.coinTransaction.findMany({
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "KID" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold uppercase text-neon-yellow font-arcade">Coin Ledger</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Audit log of all credits, debits, and adjustments</p>
      </div>

      <AdminTransactionsConsole transactions={transactions} kids={kids} />
    </div>
  );
}
