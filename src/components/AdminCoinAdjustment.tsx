"use client";

import { useState } from "react";
import { Coins, Plus, Minus } from "lucide-react";
import { adjustCoins } from "@/app/actions/admin";

interface AdminCoinAdjustmentProps {
  kidId: string;
  kidName: string;
}

export default function AdminCoinAdjustment({ kidId, kidName }: AdminCoinAdjustmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAdjust = async (isPositive: boolean) => {
    if (!reason.trim()) {
      setError("Provide a reason!");
      return;
    }

    setLoading(true);
    setError("");

    // If parent typed a negative number, keep it negative regardless of clicking Award or Deduct.
    // Otherwise, Award is positive and Deduct is negative.
    const adjustValue = amount < 0 ? amount : (isPositive ? amount : -amount);
    const result = await adjustCoins(kidId, adjustValue, reason);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setReason("");
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-2.5 text-xs font-bold text-cyan-400 border border-cyan-500 rounded-lg hover:bg-cyan-500 hover:text-black font-arcade uppercase transition-all"
        >
          Adjust Coins
        </button>
      ) : (
        <div className="flex flex-col gap-3 p-3 bg-black/60 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Adjustment Console</span>
            <button
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              className="text-[10px] text-red-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {success && (
            <p className="text-xs font-bold text-center text-green-400 animate-pulse uppercase">
              Balance Updated!
            </p>
          )}

          {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="-1000"
              max="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-20 px-2 py-1 text-white bg-black border border-gray-700 rounded text-center focus:outline-none focus:border-cyan-500 font-arcade"
            />
            <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            
            <input
              type="text"
              placeholder="Reason (e.g. Good behavior)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1 px-2 py-1 text-xs text-white bg-black border border-gray-700 rounded focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleAdjust(true)}
              disabled={loading || success}
              className="flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-black bg-green-500 hover:bg-green-400 rounded transition-all uppercase font-arcade disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Award
            </button>
            <button
              onClick={() => handleAdjust(false)}
              disabled={loading || success}
              className="flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded transition-all uppercase font-arcade disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" /> Deduct
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
