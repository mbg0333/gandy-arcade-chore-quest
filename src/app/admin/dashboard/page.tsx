import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Coins, ListTodo, ShieldAlert, Award, Star, Activity, Sparkles, TrendingUp } from "lucide-react";
import AdminCoinAdjustment from "@/components/AdminCoinAdjustment";

export default async function AdminDashboard() {
  const [kids, pendingCount, totalTransactions, recentActivity] = await Promise.all([
    prisma.user.findMany({
      where: { role: "KID" },
      orderBy: { name: "asc" },
    }),
    prisma.taskSubmission.count({ where: { status: "PENDING" } }),
    prisma.coinTransaction.aggregate({
      _sum: { amount: true },
    }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold uppercase text-neon-blue font-arcade">HQ Mainframe</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Status Overview & Direct Commands</p>
      </div>

      {/* Grid of Kids */}
      <div className="grid gap-6 md:grid-cols-3">
        {kids.map((kid) => (
          <div key={kid.id} className="flex flex-col p-5 border-2 bg-arcade-panel border-purple-500 box-neon-pink rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black font-arcade uppercase text-neon-pink">{kid.name}</h2>
              <span className="text-xs font-mono bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">PLAYER</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-black border border-yellow-500/30 rounded-lg shadow-[0_0_5px_#ffea00_inset_20%]">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">CURRENT COINS</span>
                <span className="text-xl font-black font-arcade text-yellow-400 flex items-center gap-1">
                  {kid.coins} <Coins className="w-4 h-4 animate-coin" />
                </span>
              </div>
              <div className="p-3 bg-black border border-purple-500/30 rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">LIFETIME</span>
                <span className="text-xl font-black font-arcade text-purple-400">
                  {kid.totalEarned}
                </span>
              </div>
            </div>

            {/* Quick manual coin adjustment form */}
            <AdminCoinAdjustment kidId={kid.id} kidName={kid.name} />
          </div>
        ))}
      </div>

      {/* Summary Logs / Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-blue font-arcade flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" /> Live Feed
          </h3>
          <div className="flex flex-col gap-2 p-4 border border-gray-800 bg-black/40 rounded-xl max-h-[350px] overflow-y-auto scrollbar-hide">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                <Sparkles className="w-4 h-4 mt-0.5 text-cyan-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">{log.message}</p>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="p-4 text-center text-gray-500">System standby. No current logs.</p>
            )}
          </div>
        </div>

        {/* System Diagnostics / Metrics */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-green font-arcade flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" /> Diagnostics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-800 bg-black/40 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Pending Approvals</span>
              <span className="text-3xl font-black font-arcade text-yellow-400">{pendingCount}</span>
            </div>
            <div className="p-4 border border-gray-800 bg-black/40 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Total Vault Coins</span>
              <span className="text-3xl font-black font-arcade text-green-400">{totalTransactions._sum.amount || 0}</span>
            </div>
          </div>
          
          <Link href="/admin/approvals" className="flex items-center justify-center p-4 border-2 border-dashed border-cyan-500 text-cyan-400 rounded-xl font-arcade font-bold uppercase hover:bg-cyan-900/10 hover:border-cyan-400 transition-colors mt-auto">
            Open Approval Console
          </Link>
        </div>
      </div>
    </div>
  );
}
