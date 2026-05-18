import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ListTodo, Gift, Trophy, Star, Activity, Plus, Coins } from "lucide-react";

export default async function KidDashboard() {
  const session = await getSession();
  const userId = session?.userId as string;

  const [availableTasks, pendingTasks, recentActivity] = await Promise.all([
    prisma.taskAssignment.findMany({
      where: { userId },
      include: { task: true },
    }),
    prisma.taskSubmission.findMany({
      where: { userId, status: "PENDING" },
      include: { task: true },
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 text-center border-2 bg-arcade-panel border-pink-500 box-neon-pink rounded-xl">
        <h2 className="mb-2 text-2xl font-bold uppercase text-neon-pink font-arcade">Ready to Play?</h2>
        <p className="text-gray-300">Complete tasks to earn coins and unlock epic rewards!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 hidden sm:grid">
        <Link href="/kid/dashboard" className="flex flex-col items-center justify-center p-4 border-2 bg-arcade-panel border-cyan-500 rounded-xl hover:bg-cyan-900/50 box-neon-blue transition-all">
          <Star className="w-8 h-8 mb-2 text-cyan-400" />
          <span className="font-bold uppercase font-arcade">Home</span>
        </Link>
        <Link href="/kid/tasks" className="flex flex-col items-center justify-center p-4 border-2 bg-arcade-panel border-green-500 rounded-xl hover:bg-green-900/50 box-neon-green transition-all">
          <ListTodo className="w-8 h-8 mb-2 text-green-400" />
          <span className="font-bold uppercase font-arcade">Tasks</span>
        </Link>
        <Link href="/kid/rewards" className="flex flex-col items-center justify-center p-4 border-2 bg-arcade-panel border-pink-500 rounded-xl hover:bg-pink-900/50 box-neon-pink transition-all">
          <Gift className="w-8 h-8 mb-2 text-pink-400" />
          <span className="font-bold uppercase font-arcade">Rewards</span>
        </Link>
        <Link href="/kid/leaderboard" className="flex flex-col items-center justify-center p-4 border-2 bg-arcade-panel border-yellow-500 rounded-xl hover:bg-yellow-900/50 box-neon-yellow transition-all">
          <Trophy className="w-8 h-8 mb-2 text-yellow-400" />
          <span className="font-bold uppercase font-arcade">Rank</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold uppercase text-neon-green font-arcade">Available Tasks</h3>
            <span className="px-3 py-1 text-sm font-bold text-black bg-green-500 rounded-full">{availableTasks.length}</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {availableTasks.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border-l-4 bg-black/50 border-green-500 rounded-r-lg">
                <div>
                  <h4 className="font-bold">{assignment.task.title}</h4>
                  <p className="text-xs text-gray-400 uppercase">{assignment.task.category}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 rounded text-yellow-400 font-bold font-arcade">
                  +{assignment.task.rewardAmount} <Coins className="w-4 h-4" />
                </div>
              </div>
            ))}
            {availableTasks.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-black/50 rounded-lg">No tasks right now!</div>
            )}
            <Link href="/kid/tasks" className="p-3 text-center text-green-400 border border-green-900 rounded-lg hover:bg-green-900/20 font-arcade uppercase text-sm">
              View All Tasks
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold uppercase text-neon-blue font-arcade">Pending Approval</h3>
            <span className="px-3 py-1 text-sm font-bold text-black bg-cyan-500 rounded-full">{pendingTasks.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {pendingTasks.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 border-l-4 bg-black/50 border-cyan-500 rounded-r-lg opacity-70">
                <div>
                  <h4 className="font-bold">{sub.task.title}</h4>
                  <p className="text-xs text-cyan-400 uppercase">Waiting on Parent</p>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-black/50 rounded-lg">All caught up!</div>
            )}
          </div>
          
          <Link href="/kid/request-task" className="flex items-center justify-center p-4 mt-auto border-2 border-dashed rounded-xl border-purple-500 text-purple-400 hover:bg-purple-900/20 hover:border-purple-400 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-bold uppercase font-arcade">Request Custom Job</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
