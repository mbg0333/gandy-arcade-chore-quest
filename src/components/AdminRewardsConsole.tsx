"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, Trash2, Edit2, X, AlertCircle } from "lucide-react";
import { createReward, updateReward, deleteReward } from "@/app/actions/manageRewards";
import { compressImage } from "@/lib/image";

interface Reward {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  image?: string | null;
}

export default function AdminRewardsConsole({ rewards }: { rewards: Reward[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(100);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenNew = () => {
    setEditingReward(null);
    setTitle("");
    setDescription("");
    setCost(100);
    setImage("");
    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setDescription(reward.description || "");
    setCost(reward.cost);
    setImage(reward.image || "");
    setError("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Prize name is required.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      title,
      description,
      cost,
      image: image || undefined,
    };

    let result;
    if (editingReward) {
      result = await updateReward(editingReward.id, payload);
    } else {
      result = await createReward(payload);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this prize?")) return;
    await deleteReward(rewardId);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-black uppercase bg-pink-500 hover:bg-pink-400 rounded-xl box-neon-pink font-arcade transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Prize
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
              className="w-full max-w-md p-6 border-2 bg-arcade-panel border-pink-500 box-neon-pink rounded-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase text-neon-pink font-arcade">
                  {editingReward ? "Modify Prize Claim" : "Configure Prize Claim"}
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

              {!editingReward && rewards.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Load Prize Template (Optional)</label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const template = rewards.find((r) => r.id === selectedId);
                        if (template) {
                          setTitle(template.title);
                          setDescription(template.description || "");
                          setCost(template.cost);
                          setImage(template.image || "");
                        }
                      }
                    }}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-pink-500 font-bold"
                    defaultValue=""
                  >
                    <option value="">-- Start from Scratch --</option>
                    {rewards.map((reward) => (
                      <option key={reward.id} value={reward.id}>
                        {reward.title} ({reward.cost} Coins)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Prize Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ice Cream Outing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Details / Rules</label>
                <textarea
                  placeholder="Explain exactly what they win..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-pink-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Prize Picture (Optional)</label>
                <div className="flex flex-col gap-3">
                  {image ? (
                    <div className="relative w-full h-40 border border-gray-700 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={image}
                        alt="Prize Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-800 hover:border-pink-500 bg-black/40 rounded-lg cursor-pointer transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-gray-500 group-hover:text-pink-500 mb-2 transition-colors" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Click to Upload Picture
                        </p>
                        <p className="text-[10px] text-gray-650 uppercase tracking-widest mt-1">
                          PNG, JPG, or WEBP
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressedBase64 = await compressImage(file, 600, 400);
                              setImage(compressedBase64);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Prize Cost (Coins)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={cost}
                    onChange={(e) => setCost(Math.max(1, Number(e.target.value)))}
                    className="w-full p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-pink-500 font-arcade font-bold text-center text-xl text-yellow-400"
                  />
                  <Coins className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-coin" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 text-lg font-bold text-black uppercase transition-all bg-pink-500 hover:bg-pink-400 rounded-lg box-neon-pink font-arcade disabled:opacity-50"
              >
                {loading ? "Deploying..." : editingReward ? "Modify Prize" : "Stock Shop"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Prizes */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="flex flex-col p-4 border-2 border-gray-800 bg-arcade-panel rounded-xl justify-between"
          >
            <div>
              {reward.image && (
                <div className="w-full h-40 border border-gray-800 bg-black rounded-lg overflow-hidden mb-3 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{reward.title}</h3>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-black border border-yellow-500/20 rounded-md font-arcade font-bold text-yellow-400 text-sm">
                  {reward.cost} <Coins className="w-4 h-4" />
                </div>
              </div>
              
              {reward.description && (
                <p className="text-sm text-gray-400 mt-2">{reward.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-800 pt-3 mt-4 justify-end">
              <button
                onClick={() => handleOpenEdit(reward)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-pink-400 border border-pink-850 rounded hover:bg-pink-500 hover:text-black transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDelete(reward.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 border border-red-900 rounded hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}

        {rewards.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl col-span-2">
            No prizes stocked yet. Config one above!
          </div>
        )}
      </div>
    </div>
  );
}
