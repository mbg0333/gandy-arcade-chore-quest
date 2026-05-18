import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminKidsConsole from "@/components/AdminKidsConsole";

export default async function AdminKidsPage() {
  const session = await getSession();
  const admin = session?.userId 
    ? await prisma.user.findUnique({ where: { id: session.userId as string } })
    : null;

  const allUsers = await prisma.user.findMany({
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
        <h1 className="text-3xl font-bold uppercase text-neon-pink font-arcade">Control Room</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Manage users, profiles, and core systems configuration</p>
      </div>

      <AdminKidsConsole allUsers={allUsers} currentUserEmail={admin?.email || ""} />
    </div>
  );
}
