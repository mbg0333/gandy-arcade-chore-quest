"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Coins } from "lucide-react";
import { loginKid } from "@/app/actions/auth";

const KIDS = ["Brexx", "Reed", "Will"];

export default function ArcadeLogin() {
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmit = async () => {
    if (pin.length < 4 || !selectedKid) {
      setError("Enter full PIN");
      return;
    }
    setLoading(true);
    setError("");
    
    const result = await loginKid(selectedKid, pin);
    if (result?.error) {
      setError(result.error);
      setPin("");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-6 mx-auto bg-black/40 backdrop-blur-md rounded-2xl box-neon-pink">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <Gamepad2 className="w-10 h-10 text-pink-500 animate-pulse" />
        <h1 className="text-3xl font-black tracking-widest text-transparent uppercase font-arcade bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
          Chore Quest
        </h1>
        <Coins className="w-10 h-10 text-cyan-500 animate-pulse" />
      </motion.div>

      {!selectedKid ? (
        <div className="flex flex-col w-full gap-4">
          <h2 className="mb-4 text-xl text-center text-neon-blue font-arcade uppercase">
            Select Player
          </h2>
          {KIDS.map((kid, i) => (
            <motion.button
              key={kid}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedKid(kid)}
              className="px-6 py-4 text-2xl font-bold uppercase transition-all duration-200 bg-purple-900/50 hover:bg-pink-600/50 rounded-xl box-neon-blue arcade-btn"
            >
              {kid}
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center w-full"
        >
          <div className="flex items-center justify-between w-full mb-6">
            <h2 className="text-2xl font-bold text-neon-pink font-arcade uppercase">
              {selectedKid}
            </h2>
            <button
              onClick={() => {
                setSelectedKid(null);
                setPin("");
                setError("");
              }}
              className="text-sm text-cyan-400 hover:text-white"
            >
              Change Player
            </button>
          </div>

          <div className="w-full p-4 mb-6 text-center bg-black border-2 rounded-lg border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.5)]">
            <div className="text-2xl tracking-[0.5em] text-white font-mono h-10 flex justify-center items-center pl-[0.25em]">
              {pin.padEnd(6, "_")}
            </div>
          </div>

          {error && <p className="mb-4 font-bold text-red-500 animate-bounce">{error}</p>}

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="w-16 h-16 text-2xl font-bold bg-blue-900/50 hover:bg-cyan-500 hover:text-black rounded-xl box-neon-blue arcade-btn"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="w-16 h-16 text-lg font-bold text-red-400 bg-red-900/30 hover:bg-red-600 hover:text-white rounded-xl box-neon-pink arcade-btn"
            >
              DEL
            </button>
            <button
              onClick={() => handleNumberClick("0")}
              className="w-16 h-16 text-2xl font-bold bg-blue-900/50 hover:bg-cyan-500 hover:text-black rounded-xl box-neon-blue arcade-btn"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-16 h-16 text-lg font-bold text-green-400 bg-green-900/30 hover:bg-green-500 hover:text-black rounded-xl box-neon-green arcade-btn flex items-center justify-center"
            >
              {loading ? "..." : "GO"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
