import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TaskCard from "@/components/TaskCard";

export default async function KidTasks() {
  const session = await getSession();
  const userId = session?.userId as string;

  const assignments = await prisma.taskAssignment.findMany({
    where: { userId },
    include: { task: true },
  });

  const availableTasks = assignments.map((a) => a.task);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 border-b-2 border-cyan-500">
        <h1 className="text-3xl font-bold uppercase text-neon-cyan font-arcade">Mission Log</h1>
      </div>

      {availableTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-black/40 rounded-xl">
          <p className="text-xl font-bold text-gray-500 font-arcade">No active missions.</p>
          <p className="mt-2 text-gray-400">Ask your parent for more quests!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {availableTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
