"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, Minus, CheckCircle, Terminal, HelpCircle, DollarSign, Clock } from "lucide-react";
import { redeemCustomReward } from "@/app/actions/rewards";

export default function QuickExchangeTerminal({ kidCoins }: { kidCoins: number }) {
  // Cash Terminal state
  const [cashAmount, setCashAmount] = useState(5); // Start at $5
  const [cashLoading, setCashLoading] = useState(false);
  const [cashSuccess, setCashSuccess] = useState(false);

  // Time Terminal state
  const [timeAmount, setTimeAmount] = useState(15); // Start at 15 minutes
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeSuccess, setTimeSuccess] = useState(false);

  const cashCost = (cashAmount / 5) * 250;
  const canAffordCash = kidCoins >= cashCost;

  const timeCost = (timeAmount / 15) * 75;
  const canAffordTime = kidCoins >= timeCost;

  const handleRedeemCash = async () => {
    if (!canAffordCash || cashLoading) return;
    setCashLoading(true);
    const res = await redeemCustomReward("CASH", cashAmount, cashCost);
    setCashLoading(false);
    if (res.success) {
      setCashSuccess(true);
      setTimeout(() => {
        setCashSuccess(false);
        window.location.reload();
      }, 2000);
    }
  };

  const handleRedeemTime = async () => {
    if (!canAffordTime || timeLoading) return;
    setTimeLoading(true);
    const res = await redeemCustomReward("TIME", timeAmount, timeCost);
    setTimeLoading(false);
    if (res.success) {
      setTimeSuccess(true);
      setTimeout(() => {
        setTimeSuccess(false);
        window.location.reload();
      }, 2000);
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} Hr ${mins} Min` : `${hrs} ${hrs === 1 ? "Hour" : "Hours"}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 p-5 border-2 border-pink-500 bg-pink-950/10 box-neon-pink rounded-2xl relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cash Exchange Module */}
      <div className="flex flex-col p-4 border border-pink-900/50 bg-black/60 rounded-xl relative">
        <div className="flex items-center justify-between border-b border-pink-950 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neon-pink animate-pulse" />
            <h3 className="font-arcade text-sm font-bold text-neon-pink uppercase tracking-wide">ATM Cash Pack</h3>
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-bold">Rates: $5.00 = 250 🪙</span>
        </div>

        <AnimatePresence mode="wait">
          {cashSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CheckCircle className="w-12 h-12 text-pink-400 mb-2 animate-bounce" />
              <h4 className="font-arcade text-sm font-bold text-pink-400 uppercase">Cash Requested!</h4>
              <p className="text-[10px] text-gray-400 uppercase mt-1">Pending parent authorization.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col justify-between flex-1 gap-4"
            >
              <div className="flex flex-col items-center py-2">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Select Pack Value</span>
                
                {/* Adjuster */}
                <div className="flex items-center gap-6 mt-3">
                  <button
                    type="button"
                    onClick={() => setCashAmount(prev => Math.max(5, prev - 5))}
                    disabled={cashAmount <= 5}
                    className="p-2 border border-pink-900/40 rounded-lg text-pink-400 hover:bg-pink-950/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center min-w-[100px]">
                    <span className="text-3xl font-bold text-white font-arcade select-none">
                      ${cashAmount}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase mt-0.5">Cash Reward</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCashAmount(prev => prev + 5)}
                    className="p-2 border border-pink-900/40 rounded-lg text-pink-400 hover:bg-pink-950/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Coin Payout Cost Card */}
              <div className="p-3 bg-black border border-gray-900 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">Exchange Cost</span>
                  <span className="text-xs text-gray-300 font-bold uppercase font-arcade mt-0.5">Arcade Coins Required</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-950/30 border border-pink-900 rounded-lg">
                  <span className={`text-base font-bold font-arcade ${canAffordCash ? "text-yellow-400" : "text-gray-500"}`}>
                    {cashCost}
                  </span>
                  <Coins className={`w-4 h-4 ${canAffordCash ? "text-yellow-400" : "text-gray-500"}`} />
                </div>
              </div>

              {/* Confirm Redeem Button */}
              <button
                onClick={handleRedeemCash}
                disabled={!canAffordCash || cashLoading}
                className={`w-full py-3.5 text-xs font-bold uppercase font-arcade tracking-wider transition-all rounded-lg cursor-pointer ${
                  canAffordCash 
                    ? "bg-pink-500 hover:bg-pink-400 text-black box-neon-pink" 
                    : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
                }`}
              >
                {cashLoading ? "Processing..." : canAffordCash ? `Claim $${cashAmount} Cash` : "Insufficient Balance"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Screen Time Exchange Module */}
      <div className="flex flex-col p-4 border border-pink-900/50 bg-black/60 rounded-xl relative">
        <div className="flex items-center justify-between border-b border-pink-950 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neon-pink animate-pulse" />
            <h3 className="font-arcade text-sm font-bold text-neon-pink uppercase tracking-wide">Video Game Playtime</h3>
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-bold">Rates: 15m = 75 🪙</span>
        </div>

        <AnimatePresence mode="wait">
          {timeSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CheckCircle className="w-12 h-12 text-pink-400 mb-2 animate-bounce" />
              <h4 className="font-arcade text-sm font-bold text-pink-400 uppercase">Time Requested!</h4>
              <p className="text-[10px] text-gray-400 uppercase mt-1">Pending parent authorization.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col justify-between flex-1 gap-4"
            >
              <div className="flex flex-col items-center py-2">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Select Playtime Pack</span>
                
                {/* Adjuster */}
                <div className="flex items-center gap-6 mt-3">
                  <button
                    type="button"
                    onClick={() => setTimeAmount(prev => Math.max(15, prev - 15))}
                    disabled={timeAmount <= 15}
                    className="p-2 border border-pink-900/40 rounded-lg text-pink-400 hover:bg-pink-950/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center min-w-[100px]">
                    <span className="text-2xl font-bold text-white font-arcade select-none">
                      {formatMinutes(timeAmount)}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase mt-0.5">Game Playtime</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTimeAmount(prev => prev + 15)}
                    className="p-2 border border-pink-900/40 rounded-lg text-pink-400 hover:bg-pink-950/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Coin Cost Card */}
              <div className="p-3 bg-black border border-gray-900 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">Exchange Cost</span>
                  <span className="text-xs text-gray-300 font-bold uppercase font-arcade mt-0.5">Arcade Coins Required</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-950/30 border border-pink-900 rounded-lg">
                  <span className={`text-base font-bold font-arcade ${canAffordTime ? "text-yellow-400" : "text-gray-500"}`}>
                    {timeCost}
                  </span>
                  <Coins className={`w-4 h-4 ${canAffordTime ? "text-yellow-400" : "text-gray-500"}`} />
                </div>
              </div>

              {/* Confirm Redeem Button */}
              <button
                onClick={handleRedeemTime}
                disabled={!canAffordTime || timeLoading}
                className={`w-full py-3.5 text-xs font-bold uppercase font-arcade tracking-wider transition-all rounded-lg cursor-pointer ${
                  canAffordTime 
                    ? "bg-pink-500 hover:bg-pink-400 text-black box-neon-pink" 
                    : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
                }`}
              >
                {timeLoading ? "Processing..." : canAffordTime ? `Claim ${formatMinutes(timeAmount)} Playtime` : "Insufficient Balance"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
