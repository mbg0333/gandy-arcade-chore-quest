import { prisma } from "@/lib/prisma";
import AdminTasksConsole from "@/components/AdminTasksConsole";

export default async function AdminTasksPage() {
  const [tasks, kids] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
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
        <h1 className="text-3xl font-bold uppercase text-neon-green font-arcade">Quest Configurator</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Deploy, Modify, and assign gaming missions</p>
      </div>

      <AdminTasksConsole tasks={tasks} kids={kids} />
    </div>
  );
}
