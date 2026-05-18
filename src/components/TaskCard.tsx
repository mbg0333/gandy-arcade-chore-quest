"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, CheckCircle, Clock } from "lucide-react";
import { submitTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: any;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    const result = await submitTask(task.id, notes);
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
        className="flex flex-col items-center justify-center p-6 border-2 bg-green-900/40 border-green-500 rounded-xl box-neon-green"
      >
        <CheckCircle className="w-16 h-16 mb-4 text-green-400" />
        <h3 className="text-xl font-bold text-center text-green-400 uppercase font-arcade">Submitted!</h3>
        <p className="mt-2 text-center text-gray-300">Waiting for parent approval.</p>
      </motion.div>
    );
  }

  const categoryColors: Record<string, string> = {
    CHORE: "text-blue-400 border-blue-500",
    WORKOUT: "text-red-400 border-red-500",
    SCHOOL: "text-yellow-400 border-yellow-500",
    BEHAVIOR: "text-purple-400 border-purple-500",
    CUSTOM: "text-pink-400 border-pink-500",
  };

  const colorClass = categoryColors[task.category] || "text-gray-400 border-gray-500";

  return (
    <motion.div
      layout
      className={cn("flex flex-col p-4 border-2 bg-arcade-panel rounded-xl overflow-hidden transition-all", expanded ? "border-cyan-500 box-neon-blue" : "border-gray-800")}
    >
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <span className={cn("text-xs font-bold uppercase tracking-wider", colorClass.split(" ")[0])}>
            {task.category}
          </span>
          <h3 className="mt-1 text-lg font-bold text-white">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-sm text-gray-400 line-clamp-1">{task.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1 px-3 py-2 bg-black border border-yellow-600/50 rounded-lg shadow-[0_0_5px_#ffea00_inset]">
          <span className="text-xl font-bold text-yellow-400 font-arcade">{task.rewardAmount}</span>
          <Coins className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-4 mt-4 overflow-hidden"
          >
            {task.description && (
              <p className="text-sm text-gray-300">{task.description}</p>
            )}
            
            <textarea
              placeholder="Add a note for your parent... (optional)"
              className="w-full p-3 text-sm text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full py-3 text-lg font-bold text-black uppercase transition-all bg-green-500 hover:bg-green-400 rounded-lg box-neon-green font-arcade disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Mark Complete"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
