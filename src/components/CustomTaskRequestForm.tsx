"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, Coins, ArrowLeft, Send } from "lucide-react";
import { requestCustomTask } from "@/app/actions/customTask";

export default function CustomTaskRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedCoins, setSuggestedCoins] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please name your quest!");
      return;
    }

    setLoading(true);
    setError("");

    const result = await requestCustomTask(title, description, suggestedCoins);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/kid/dashboard");
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 bg-arcade-panel border-cyan-500 box-neon-blue rounded-xl text-center">
        <Gamepad2 className="w-16 h-16 mb-4 text-cyan-400 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-neon-blue font-arcade">Quest Submitted!</h2>
        <p className="mt-2 text-gray-300">Wait for your parent to approve and configure it!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 border-2 bg-arcade-panel border-purple-500 box-neon-pink rounded-xl">
      <div className="flex items-center gap-2 text-purple-400 hover:text-white transition-colors cursor-pointer w-fit" onClick={() => router.back()}>
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold uppercase text-sm font-arcade">Back</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold uppercase text-neon-pink font-arcade">Propose custom job</h2>
        <p className="text-xs text-gray-400 uppercase mt-1">Pitch a chore, job, or workout to earn coins!</p>
      </div>

      {error && <p className="font-bold text-red-500 animate-bounce text-sm">{error}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Quest Name</label>
        <input
          type="text"
          placeholder="e.g. Wash Parent's Car"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          maxLength={100}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Details / Description</label>
        <textarea
          placeholder="Explain what you will do..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Suggested Coins</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={suggestedCoins}
            onChange={(e) => setSuggestedCoins(Number(e.target.value))}
            className="flex-1 accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center gap-1 px-3 py-2 bg-black border border-yellow-500/50 rounded-lg shadow-[0_0_5px_#ffea00_inset] min-w-[90px] justify-center">
            <span className="text-xl font-bold text-yellow-400 font-arcade">{suggestedCoins}</span>
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-4 mt-2 text-lg font-bold text-black uppercase transition-all bg-purple-500 hover:bg-purple-400 rounded-lg box-neon-pink font-arcade disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {loading ? "Sending..." : "Submit Proposal"}
      </button>
    </form>
  );
}
