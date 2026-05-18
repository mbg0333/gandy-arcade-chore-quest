import { prisma } from "@/lib/prisma";
import AdminKidsConsole from "@/components/AdminKidsConsole";

export default async function AdminKidsPage() {
  const kids = await prisma.user.findMany({
    where: { role: "KID" },
    include: {
      assignedTasks: {
        include: { task: true },
      },
      taskSubmissions: {
        include: { task: true },
        orderBy: { createdAt: "desc" },
      },
      rewardRedemptions: {
        include: { reward: true },
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold uppercase text-neon-pink font-arcade">Player Profiles</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Detailed status and quest histories for all players</p>
      </div>

      <AdminKidsConsole kids={kids} />
    </div>
  );
}
