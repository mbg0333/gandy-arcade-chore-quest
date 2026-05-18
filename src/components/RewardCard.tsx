"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, CheckCircle, Gift } from "lucide-react";
import { redeemReward } from "@/app/actions/rewards";

export default function RewardCard({ reward, kidCoins }: { reward: any; kidCoins: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const canAfford = kidCoins >= reward.cost;

  const handleRedeem = async () => {
    if (!canAfford) return;
    setLoading(true);
    const result = await redeemReward(reward.id, reward.cost);
    if (result.success) {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center p-6 border-2 bg-pink-900/40 border-pink-500 rounded-xl box-neon-pink"
      >
        <CheckCircle className="w-16 h-16 mb-4 text-pink-400" />
        <h3 className="text-xl font-bold text-center text-pink-400 uppercase font-arcade">Requested!</h3>
        <p className="mt-2 text-center text-gray-300">Parent must approve.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={`flex flex-col p-4 border-2 bg-arcade-panel rounded-xl overflow-hidden transition-all ${
        canAfford ? "border-pink-500 box-neon-pink" : "border-gray-800 opacity-70"
      }`}
    >
      {reward.image && (
        <div className="w-full h-44 border border-gray-800 bg-black rounded-lg overflow-hidden mb-4 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <img
            src={reward.image}
            alt={reward.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {!reward.image && (
            <Gift className={`w-8 h-8 mb-2 ${canAfford ? "text-pink-400" : "text-gray-500"}`} />
          )}
          <h3 className="text-lg font-bold text-white">{reward.title}</h3>
          {reward.description && (
            <p className="mt-1 text-sm text-gray-400">{reward.description}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-1 px-3 py-2 bg-black border rounded-lg ${canAfford ? "border-yellow-600/50 shadow-[0_0_5px_#ffea00_inset]" : "border-gray-700"}`}>
          <span className={`text-xl font-bold font-arcade ${canAfford ? "text-yellow-400" : "text-gray-500"}`}>{reward.cost}</span>
          <Coins className={`w-5 h-5 ${canAfford ? "text-yellow-400" : "text-gray-500"}`} />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleRedeem}
          disabled={!canAfford || loading}
          className={`w-full py-3 text-lg font-bold uppercase transition-all rounded-lg font-arcade ${
            canAfford 
              ? "bg-pink-500 hover:bg-pink-400 text-black box-neon-pink" 
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "..." : canAfford ? "Buy Reward" : "Need More Coins"}
        </button>
      </div>
    </motion.div>
  );
}
