"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, Trash2, Edit2, X, AlertCircle } from "lucide-react";
import { createTask, updateTask, deleteTask } from "@/app/actions/manageTasks";

interface Kid {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardAmount: number;
  isRepeat: boolean;
  assignments: {
    user: {
      id: string;
      name: string;
    };
  }[];
}

export default function AdminTasksConsole({ tasks, kids }: { tasks: any[]; kids: Kid[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CHORE");
  const [rewardAmount, setRewardAmount] = useState(50);
  const [isRepeat, setIsRepeat] = useState(false);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenNew = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setCategory("CHORE");
    setRewardAmount(50);
    setIsRepeat(false);
    setSelectedKids([]);
    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setRewardAmount(task.rewardAmount);
    setIsRepeat(task.isRepeat);
    setSelectedKids(task.assignments.map((a) => a.user.id));
    setError("");
    setIsOpen(true);
  };

  const toggleKidSelection = (kidId: string) => {
    setSelectedKids((prev) =>
      prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Quest title is required.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      title,
      description,
      category,
      rewardAmount,
      isRepeat,
      assignToIds: selectedKids,
    };

    let result;
    if (editingTask) {
      result = await updateTask(editingTask.id, payload);
    } else {
      result = await createTask(payload);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;
    await deleteTask(taskId);
  };

  const categoryColors: Record<string, string> = {
    CHORE: "text-blue-400 border-blue-500",
    WORKOUT: "text-red-400 border-red-500",
    SCHOOL: "text-yellow-400 border-yellow-500",
    BEHAVIOR: "text-purple-400 border-purple-500",
    CUSTOM: "text-pink-400 border-pink-500",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-black uppercase bg-green-500 hover:bg-green-400 rounded-xl box-neon-green font-arcade transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Quest
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onSubmit={handleSubmit}
              className="w-full max-w-lg p-6 border-2 bg-arcade-panel border-cyan-500 box-neon-blue rounded-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase text-neon-blue font-arcade">
                  {editingTask ? "Edit Quest Details" : "Configure New Quest"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 text-sm font-bold text-red-500 border border-red-500 bg-red-950/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Quest Name</label>
                <input
                  type="text"
                  placeholder="e.g. Do the Laundry"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Details / Rules</label>
                <textarea
                  placeholder="Explain exactly what needs to be done..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="CHORE">CHORE</option>
                    <option value="WORKOUT">WORKOUT</option>
                    <option value="SCHOOL">SCHOOL</option>
                    <option value="BEHAVIOR">BEHAVIOR</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Reward Coins</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 font-arcade font-bold text-center"
                    />
                    <Coins className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase font-bold text-gray-400">Assign To Players</label>
                <div className="grid grid-cols-3 gap-2">
                  {kids.map((kid) => (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => toggleKidSelection(kid.id)}
                      className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all font-arcade ${
                        selectedKids.includes(kid.id)
                          ? "bg-cyan-500 text-black border-cyan-500 box-neon-blue"
                          : "border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {kid.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 text-lg font-bold text-black uppercase transition-all bg-cyan-500 hover:bg-cyan-400 rounded-lg box-neon-blue font-arcade disabled:opacity-50"
              >
                {loading ? "Saving..." : editingTask ? "Update Mission" : "Deploy Mission"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => {
          const colorClass = categoryColors[task.category] || "text-gray-400 border-gray-500";
          return (
            <div
              key={task.id}
              className="flex flex-col p-4 border-2 border-gray-800 bg-arcade-panel rounded-xl justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${colorClass.split(" ")[0]}`}>
                    {task.category}
                  </span>
                  
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-black border border-yellow-500/20 rounded-md font-arcade font-bold text-yellow-400 text-sm">
                    {task.rewardAmount} <Coins className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mt-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="text-[10px] uppercase font-bold text-gray-500 w-full mb-0.5">Assigned To:</span>
                  {task.assignments.map((assign: any) => (
                    <span
                      key={assign.user.id}
                      className="px-2 py-0.5 text-[10px] font-bold font-arcade uppercase text-cyan-400 bg-cyan-950/20 border border-cyan-900 rounded-md"
                    >
                      {assign.user.name}
                    </span>
                  ))}
                  {task.assignments.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No one assigned yet.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-gray-800 pt-3 mt-4 justify-end">
                <button
                  onClick={() => handleOpenEdit(task)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-500 hover:text-black transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 border border-red-900 rounded hover:bg-red-600 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl col-span-2">
            No quests configured yet. Deploy one above!
          </div>
        )}
      </div>
    </div>
  );
}
