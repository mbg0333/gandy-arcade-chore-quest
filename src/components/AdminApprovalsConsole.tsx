"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Coins, MessageSquare, ClipboardList, Gift, Sparkles } from "lucide-react";
import {
  approveSubmission,
  rejectSubmission,
  approveRedemption,
  rejectRedemption,
  approveCustomTaskRequest,
  rejectCustomTaskRequest,
  recordDeduction,
} from "@/app/actions/admin";

interface AdminApprovalsConsoleProps {
  initialSubmissions: any[];
  initialRedemptions: any[];
  initialCustomRequests: any[];
}

export default function AdminApprovalsConsole({
  initialSubmissions,
  initialRedemptions,
  initialCustomRequests,
}: AdminApprovalsConsoleProps) {
  const [activeTab, setActiveTab] = useState<"quests" | "prizes" | "pitches">("quests");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [customRequests, setCustomRequests] = useState(initialCustomRequests);
  const [customCoins, setCustomCoins] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [deductInputs, setDeductInputs] = useState<Record<string, string>>({});

  const handleDeductChange = (id: string, val: string) => {
    setDeductInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleDeductSubmit = async (id: string, maxAmount: number) => {
    const rawVal = deductInputs[id];
    const val = parseFloat(rawVal);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (val > maxAmount) {
      alert(`Deduction cannot exceed remaining balance of ${maxAmount}.`);
      return;
    }

    setLoading((prev) => ({ ...prev, [id]: true }));
    const result = await recordDeduction(id, val);
    setLoading((prev) => ({ ...prev, [id]: false }));

    if (result.success) {
      setDeductInputs((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      setRedemptions((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const nextRem = Math.max(0, (r.remainingAmount ?? r.originalAmount ?? 0) - val);
            return {
              ...r,
              remainingAmount: nextRem,
              status: nextRem <= 0 ? "APPROVED" : "PENDING",
            };
          }
          return r;
        }).filter((r) => r.status === "PENDING")
      );
    } else if (result.error) {
      alert(result.error);
    }
  };

  const handleAction = async (id: string, actionType: string, serverAction: () => Promise<any>, updateState: () => void) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    const result = await serverAction();
    setLoading((prev) => ({ ...prev, [id]: false }));

    if (result.success) {
      updateState();
    }
  };

  const getCustomCoin = (id: string, fallback: number) => {
    return customCoins[id] !== undefined ? customCoins[id] : fallback;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Coin Value Estimator Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-black border-2 border-yellow-500/30 rounded-xl gap-4 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-yellow-400">
            <Coins className="w-6 h-6 animate-coin" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-arcade tracking-wider text-yellow-400">
              Pending Payout Estimator
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Based on the standard arcade value of <strong>50 coins = $1.00</strong> ($0.02 per coin)
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-arcade text-yellow-400">
            ${(submissions.reduce((sum, s) => sum + s.task.rewardAmount, 0) * 0.02).toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
            For {submissions.reduce((sum, s) => sum + s.task.rewardAmount, 0)} total pending coins
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-black border border-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab("quests")}
          className={`py-3 text-xs font-bold uppercase rounded-lg font-arcade flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "quests"
              ? "bg-green-500 text-black box-neon-green"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Quests ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab("prizes")}
          className={`py-3 text-xs font-bold uppercase rounded-lg font-arcade flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "prizes"
              ? "bg-pink-500 text-black box-neon-pink"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Gift className="w-4 h-4" /> Prizes ({redemptions.length})
        </button>
        <button
          onClick={() => setActiveTab("pitches")}
          className={`py-3 text-xs font-bold uppercase rounded-lg font-arcade flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "pitches"
              ? "bg-purple-500 text-black box-neon-pink"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Pitches ({customRequests.length})
        </button>
      </div>

      {/* Main Console Content */}
      <div className="flex flex-col gap-4 min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === "quests" && (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {submissions.map((sub) => {
                let displayDescription = sub.task.description || "";
                let subtasksList: string[] = [];
                let isTaskBundle = false;

                try {
                  if (sub.task.description && sub.task.description.startsWith("{")) {
                    const parsed = JSON.parse(sub.task.description);
                    if (parsed.description !== undefined && Array.isArray(parsed.subtasks)) {
                      isTaskBundle = true;
                      displayDescription = parsed.description;
                      subtasksList = parsed.subtasks;
                    }
                  }
                } catch (e) {
                  // Keep default
                }

                return (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-2 bg-arcade-panel border-green-900/50 rounded-xl gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-400 uppercase font-arcade text-lg">
                          {sub.user.name}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          • {sub.task.category}
                        </span>
                        {isTaskBundle && (
                          <span className="px-1.5 py-0.5 text-[9px] font-arcade font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded uppercase">
                            📦 BUNDLE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1">{sub.task.title}</h3>
                      
                      {isTaskBundle && subtasksList.length > 0 && (
                        <div className="mt-3 p-3 bg-black/40 border border-gray-800 rounded-lg flex flex-col gap-1.5 max-w-sm">
                          <span className="text-[10px] uppercase font-bold text-gray-500 font-arcade">📦 Completed Sub-tasks checklist:</span>
                          {subtasksList.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-cyan-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sub.kidNotes && (
                        <p className="mt-2 text-sm text-gray-400 flex items-start gap-1.5 bg-black/40 p-2.5 rounded-lg border border-gray-800">
                          <MessageSquare className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>"{sub.kidNotes}"</span>
                        </p>
                      )}
                    
                    {sub.proofData && (
                      <div className="mt-3 p-3 bg-black/40 border border-gray-800 rounded-lg flex flex-col gap-2 max-w-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-arcade">
                          🔍 Attached Proof:
                        </span>
                        {sub.proofType?.startsWith("image/") ? (
                          <a href={sub.proofData} target="_blank" rel="noopener noreferrer" className="cursor-zoom-in block">
                            <img 
                              src={sub.proofData} 
                              alt="Submission proof" 
                              className="max-h-48 rounded object-contain border border-gray-800 hover:border-cyan-500 transition-colors"
                            />
                          </a>
                        ) : (
                          <video 
                            src={sub.proofData} 
                            controls 
                            className="max-h-48 rounded object-contain border border-gray-800 w-full"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-gray-800 pt-3 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-yellow-500/30 rounded-lg text-yellow-400 font-bold font-arcade">
                      {sub.task.rewardAmount} <Coins className="w-4 h-4 animate-coin" />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(sub.id, "approve", () => approveSubmission(sub.id), () => setSubmissions(submissions.filter(s => s.id !== sub.id)))}
                        disabled={loading[sub.id]}
                        className="p-2 text-black bg-green-500 hover:bg-green-400 rounded-lg box-neon-green transition-all"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleAction(sub.id, "reject", () => rejectSubmission(sub.id), () => setSubmissions(submissions.filter(s => s.id !== sub.id)))}
                        disabled={loading[sub.id]}
                        className="p-2 text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
              {submissions.length === 0 && (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  No pending quest completions.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "prizes" && (
            <motion.div
              key="prizes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {redemptions.map((red) => {
                const isCustom = red.redemptionType === "CASH" || red.redemptionType === "TIME";
                const isCash = red.redemptionType === "CASH";
                const remaining = red.remainingAmount ?? red.originalAmount ?? (isCash ? 0 : 0);
                const original = red.originalAmount ?? remaining;

                return (
                  <div
                    key={red.id}
                    className={`flex flex-col p-4 border-2 bg-arcade-panel rounded-xl gap-4 transition-all ${
                      isCustom 
                        ? isCash 
                          ? "border-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                          : "border-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                        : "border-pink-900/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold uppercase font-arcade text-lg ${
                            isCustom ? (isCash ? "text-emerald-400" : "text-cyan-400") : "text-pink-400"
                          }`}>
                            {red.user.name}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            • {isCustom ? `${red.redemptionType} Balance` : "Prize CLAIM"}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mt-1">{red.reward.title}</h3>
                        
                        {isCustom && (
                          <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
                            <div className="px-3 py-1.5 bg-black/60 border border-gray-800 rounded-lg">
                              <span className="text-gray-500 font-arcade uppercase text-[9px] block">Original Amount</span>
                              <span className="text-white font-bold text-sm">
                                {isCash ? `$${original}` : `${original} mins`}
                              </span>
                            </div>
                            <div className={`px-3 py-1.5 bg-black border rounded-lg ${
                              isCash ? "border-emerald-500/20 text-emerald-400" : "border-cyan-500/20 text-cyan-400"
                            }`}>
                              <span className="text-gray-500 font-arcade uppercase text-[9px] block">Remaining Balance</span>
                              <span className="font-arcade font-bold text-sm animate-pulse">
                                {isCash ? `$${remaining.toFixed(2)}` : `${remaining} mins`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-gray-800 pt-3 sm:border-0 sm:pt-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-gray-800 rounded-lg text-pink-400 font-bold font-arcade">
                          -{red.reward.cost} <Coins className="w-4 h-4" />
                        </div>

                        {!isCustom ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(red.id, "approve", () => approveRedemption(red.id), () => setRedemptions(redemptions.filter(r => r.id !== red.id)))}
                              disabled={loading[red.id]}
                              className="p-2 text-black bg-pink-500 hover:bg-pink-400 rounded-lg box-neon-pink transition-all cursor-pointer"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleAction(red.id, "reject", () => rejectRedemption(red.id), () => setRedemptions(redemptions.filter(r => r.id !== red.id)))}
                              disabled={loading[red.id]}
                              className="p-2 text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAction(red.id, "reject", () => rejectRedemption(red.id), () => setRedemptions(redemptions.filter(r => r.id !== red.id)))}
                            disabled={loading[red.id]}
                            title="Reject and refund full coins amount"
                            className="p-2 text-red-500 hover:bg-red-950/40 border border-red-900/60 rounded-lg transition-all cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Partial Payout / Time Used Panel */}
                    {isCustom && (
                      <div className="mt-2 pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-[10px] text-gray-500 uppercase font-arcade tracking-wider">
                          Record Partial Payout or Time Usage:
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-32">
                            {isCash && (
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">$</span>
                            )}
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              max={remaining}
                              placeholder={isCash ? "Amount" : "Minutes"}
                              value={deductInputs[red.id] || ""}
                              onChange={(e) => handleDeductChange(red.id, e.target.value)}
                              className={`w-full p-2 text-xs text-white bg-black border border-gray-800 rounded-lg focus:outline-none ${
                                isCash ? "pl-5 focus:border-emerald-500" : "focus:border-cyan-500"
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={loading[red.id]}
                            onClick={() => handleDeductSubmit(red.id, remaining)}
                            className={`px-3 py-2 text-xs font-bold text-black uppercase rounded-lg transition-all font-arcade cursor-pointer disabled:opacity-50 ${
                              isCash ? "bg-emerald-500 hover:bg-emerald-400" : "bg-cyan-500 hover:bg-cyan-400"
                            }`}
                          >
                            {isCash ? "Payout" : "Use Time"}
                          </button>

                          <button
                            type="button"
                            disabled={loading[red.id]}
                            onClick={() => {
                              handleDeductChange(red.id, remaining.toString());
                            }}
                            className="px-2 py-2 text-[10px] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-lg transition-all font-arcade cursor-pointer"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {redemptions.length === 0 && (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  No pending prize claims.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "pitches" && (
            <motion.div
              key="pitches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {customRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col p-4 border-2 bg-arcade-panel border-purple-900/50 rounded-xl gap-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-400 uppercase font-arcade text-lg">
                          {req.user.name}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">• Custom Quest Idea</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1">{req.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-400 bg-black/40 px-2.5 py-1 rounded border border-gray-800 font-arcade">
                      Pitch: {req.suggestedCoins} <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-300 bg-black/40 p-3 rounded-lg border border-gray-800">
                      {req.description}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-800 pt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 uppercase font-bold tracking-wider font-arcade">Configure Coins:</span>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={getCustomCoin(req.id, req.suggestedCoins)}
                        onChange={(e) => setCustomCoins((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))}
                        className="w-24 px-2 py-1 text-white bg-black border border-gray-700 rounded font-arcade text-center focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleAction(req.id, "approve", () => approveCustomTaskRequest(req.id, getCustomCoin(req.id, req.suggestedCoins)), () => setCustomRequests(customRequests.filter(c => c.id !== req.id)))}
                        disabled={loading[req.id]}
                        className="flex items-center gap-1.5 px-4 py-2 text-black bg-purple-500 hover:bg-purple-400 rounded-lg box-neon-pink font-arcade uppercase font-bold text-sm transition-all"
                      >
                        <Check className="w-4 h-4" /> Approve Pitch
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "reject", () => rejectCustomTaskRequest(req.id), () => setCustomRequests(customRequests.filter(c => c.id !== req.id)))}
                        disabled={loading[req.id]}
                        className="p-2 text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {customRequests.length === 0 && (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  No pending quest pitches.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
