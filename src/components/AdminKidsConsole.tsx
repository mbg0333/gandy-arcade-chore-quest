"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Trophy, Calendar, CheckCircle2, XCircle, Clock, ShoppingCart } from "lucide-react";

interface KidProfile {
  id: string;
  name: string;
  coins: number;
  totalEarned: number;
  tasksCompleted: number;
  assignedTasks: any[];
  taskSubmissions: any[];
  rewardRedemptions: any[];
  transactions: any[];
}

export default function AdminKidsConsole({ kids }: { kids: KidProfile[] }) {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || "");
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  if (!selectedKid) {
    return (
      <div className="p-8 text-center text-gray-500 border border-gray-800 rounded-xl">
        No players active.
      </div>
    );
  }

  const level = Math.floor(selectedKid.totalEarned / 100) + 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Player Selection Cards */}
      <div className="grid grid-cols-3 gap-3">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => setSelectedKidId(kid.id)}
            className={`p-4 border-2 rounded-xl transition-all font-arcade uppercase text-xl font-black ${
              selectedKid.id === kid.id
                ? "border-pink-500 bg-pink-950/20 text-pink-400 box-neon-pink"
                : "border-gray-800 text-gray-500 hover:text-white"
            }`}
          >
            {kid.name}
          </button>
        ))}
      </div>

      {/* Main Profile Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Core Stats */}
        <div className="md:col-span-1 p-5 border-2 bg-arcade-panel border-cyan-500 box-neon-blue rounded-xl flex flex-col items-center text-center justify-between min-h-[220px]">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">
              RANK LEVEL
            </span>
            <span className="text-4xl font-black font-arcade text-cyan-400">Lvl {level}</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_15px_#00ffff]">
            <Trophy className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            {selectedKid.totalEarned % 100} / 100 XP TO LEVEL UP
          </p>
        </div>

        <div className="md:col-span-1 p-5 border-2 bg-arcade-panel border-yellow-500 box-neon-yellow rounded-xl flex flex-col items-center text-center justify-between min-h-[220px]">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">
              CURRENT COINS
            </span>
            <span className="text-4xl font-black font-arcade text-yellow-400 flex items-center justify-center gap-1">
              {selectedKid.coins} <Coins className="w-7 h-7 text-yellow-400 animate-coin" />
            </span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            LIFETIME EARNED: {selectedKid.totalEarned}
          </p>
        </div>

        <div className="md:col-span-2 p-5 border-2 bg-arcade-panel border-purple-500 box-neon-pink rounded-xl flex flex-col justify-between min-h-[220px]">
          <h3 className="text-lg font-bold uppercase text-neon-pink font-arcade mb-2">Diagnostic Reports</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Missions Cleared</span>
              <span className="text-2xl font-black font-arcade text-white">{selectedKid.tasksCompleted}</span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Prizes Redemptions</span>
              <span className="text-2xl font-black font-arcade text-white">
                {selectedKid.rewardRedemptions.filter((r) => r.status === "APPROVED").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Missions assignments */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-blue font-arcade">Active Missions</h3>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {selectedKid.assignedTasks.map((assignment) => (
              <div key={assignment.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                <div>
                  <h4 className="font-bold text-white text-sm">{assignment.task.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase">{assignment.task.category}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-bold font-arcade text-xs bg-yellow-950/20 px-2 py-1 rounded">
                  {assignment.task.rewardAmount} <Coins className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
            {selectedKid.assignedTasks.length === 0 && (
              <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                No active quests assigned.
              </p>
            )}
          </div>
        </div>

        {/* Quest Submissions History */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-green font-arcade">Quest Logs</h3>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {selectedKid.taskSubmissions.map((sub) => (
              <div key={sub.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                <div>
                  <h4 className="font-bold text-white text-sm">{sub.task.title}</h4>
                  <span className="text-[10px] text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {sub.status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 font-arcade uppercase bg-green-950/20 border border-green-900/50 px-2.5 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> PASS
                    </span>
                  )}
                  {sub.status === "REJECTED" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500 font-arcade uppercase bg-red-950/20 border border-red-900/50 px-2.5 py-1 rounded">
                      <XCircle className="w-3.5 h-3.5 text-red-500" /> FAIL
                    </span>
                  )}
                  {sub.status === "PENDING" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 font-arcade uppercase bg-yellow-950/20 border border-yellow-900/50 px-2.5 py-1 rounded">
                      <Clock className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> COMP
                    </span>
                  )}
                </div>
              </div>
            ))}
            {selectedKid.taskSubmissions.length === 0 && (
              <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                No quest history.
              </p>
            )}
          </div>
        </div>

        {/* Prize claim history */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-pink font-arcade">Prize Claims</h3>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {selectedKid.rewardRedemptions.map((red) => (
              <div key={red.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                <div>
                  <h4 className="font-bold text-white text-sm">{red.reward.title}</h4>
                  <span className="text-[10px] text-gray-500">
                    {new Date(red.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {red.status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-pink-400 font-arcade uppercase bg-pink-950/20 border border-pink-900/50 px-2.5 py-1 rounded">
                      <ShoppingCart className="w-3.5 h-3.5" /> CLAIMED
                    </span>
                  )}
                  {red.status === "REJECTED" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500 font-arcade uppercase bg-red-950/20 border border-red-900/50 px-2.5 py-1 rounded">
                      REJECTED
                    </span>
                  )}
                  {red.status === "PENDING" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 font-arcade uppercase bg-yellow-950/20 border border-yellow-900/50 px-2.5 py-1 rounded">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            ))}
            {selectedKid.rewardRedemptions.length === 0 && (
              <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                No rewards claimed yet.
              </p>
            )}
          </div>
        </div>

        {/* Coin logs */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold uppercase text-neon-yellow font-arcade">Coin Ledger</h3>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {selectedKid.transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                  <div>
                    <h4 className="font-bold text-white text-xs leading-relaxed">{tx.reason}</h4>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <span className={`font-bold font-arcade text-sm ${isPositive ? "text-green-400" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              );
            })}
            {selectedKid.transactions.length === 0 && (
              <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                No ledger transactions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
