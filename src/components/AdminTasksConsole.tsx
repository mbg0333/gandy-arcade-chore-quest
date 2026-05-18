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

  // Subtask Checklist states
  const [isBundle, setIsBundle] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const handleOpenNew = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setCategory("CHORE");
    setRewardAmount(50);
    setIsRepeat(false);
    setSelectedKids([]);
    setIsBundle(false);
    setSubtasks([]);
    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    
    let isTaskBundle = false;
    let taskSubtasks: string[] = [];
    let displayDescription = task.description || "";

    try {
      if (task.description && task.description.startsWith("{")) {
        const parsed = JSON.parse(task.description);
        if (parsed.description !== undefined && Array.isArray(parsed.subtasks)) {
          isTaskBundle = true;
          displayDescription = parsed.description;
          taskSubtasks = parsed.subtasks;
        }
      }
    } catch (e) {
      console.warn("Failed to parse task description as bundle JSON:", e);
    }

    setIsBundle(isTaskBundle);
    setSubtasks(taskSubtasks);
    setDescription(displayDescription);
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

    if (isBundle && subtasks.filter((s) => s.trim() !== "").length === 0) {
      setError("Quest bundles require at least one sub-task checklist item.");
      return;
    }

    setLoading(true);
    setError("");

    const finalDescription = isBundle
      ? JSON.stringify({ 
          description, 
          subtasks: subtasks.filter((s) => s.trim() !== "") 
        })
      : description;

    const payload = {
      title,
      description: finalDescription,
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

    setLoading(true); // Keep spinner until reload
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      window.location.reload();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;
    await deleteTask(taskId);
    window.location.reload();
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

              {!editingTask && tasks.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Load Quest Template (Optional)</label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const template = tasks.find((t) => t.id === selectedId);
                        if (template) {
                          setTitle(template.title);
                          setDescription(template.description || "");
                          setCategory(template.category);
                          setRewardAmount(template.rewardAmount);
                          setIsRepeat(template.isRepeat);
                        }
                      }
                    }}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 font-bold"
                    defaultValue=""
                  >
                    <option value="">-- Start from Scratch --</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} ({task.category} - {task.rewardAmount} Coins)
                      </option>
                    ))}
                  </select>
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

              {/* Quest Bundle Checklist Builder */}
              <div className="flex flex-col gap-2 p-3 bg-black/40 border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isBundleToggle"
                      checked={isBundle}
                      onChange={(e) => {
                        setIsBundle(e.target.checked);
                        if (e.target.checked && subtasks.length === 0) {
                          setSubtasks([""]);
                        }
                      }}
                      className="w-4 h-4 text-cyan-500 border-gray-700 bg-black rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="isBundleToggle" className="text-xs uppercase font-bold text-gray-300 cursor-pointer select-none">
                      📦 Make this a Quest Bundle
                    </label>
                  </div>
                  {isBundle && (
                    <span className="text-[10px] text-cyan-400 font-arcade uppercase"> Checklist Quest </span>
                  )}
                </div>

                {isBundle && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-800/80">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Bundle Sub-Tasks Checklist</label>
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {subtasks.map((taskStr, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xs font-arcade text-gray-500 w-5 text-right">{index + 1}.</span>
                          <input
                            type="text"
                            placeholder="e.g. Empty all trash bins"
                            value={taskStr}
                            onChange={(e) => {
                              const copy = [...subtasks];
                              copy[index] = e.target.value;
                              setSubtasks(copy);
                            }}
                            className="w-full p-2 text-xs text-white bg-black border border-gray-800 rounded focus:outline-none focus:border-cyan-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSubtasks(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubtasks(prev => [...prev, ""])}
                      className="mt-1 w-full py-2 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 border border-dashed border-cyan-800 hover:border-cyan-600 rounded bg-cyan-950/10 uppercase transition-all cursor-pointer"
                    >
                      + Add Sub-Task Item
                    </button>
                  </div>
                )}
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
          
          let displayDescription = task.description || "";
          let taskSubtasks: string[] = [];
          let isTaskBundle = false;

          try {
            if (task.description && task.description.startsWith("{")) {
              const parsed = JSON.parse(task.description);
              if (parsed.description !== undefined && Array.isArray(parsed.subtasks)) {
                isTaskBundle = true;
                displayDescription = parsed.description;
                taskSubtasks = parsed.subtasks;
              }
            }
          } catch (e) {
            // Keep default
          }

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

                <h3 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                  {task.title}
                  {isTaskBundle && (
                    <span className="px-1.5 py-0.5 text-[9px] font-arcade font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                      BUNDLE
                    </span>
                  )}
                </h3>
                {displayDescription && (
                  <p className="text-sm text-gray-400 mt-1">{displayDescription}</p>
                )}

                {isTaskBundle && taskSubtasks.length > 0 && (
                  <div className="mt-3 p-2.5 bg-black/30 border border-gray-900 rounded-lg flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Sub-Tasks Checklist:</span>
                    {taskSubtasks.map((sub, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
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
