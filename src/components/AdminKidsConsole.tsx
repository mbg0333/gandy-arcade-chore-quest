"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, Trophy, Calendar, CheckCircle2, XCircle, Clock, ShoppingCart, Camera,
  ShieldAlert, UserPlus, Trash2, Edit2, X, AlertOctagon, RefreshCw, Trash, UserCheck, Shield
} from "lucide-react";
import { 
  updateProfilePicture, 
  resetCurrentCoins, 
  resetLifetimeAccumulation, 
  purgeMissions, 
  purgePrizes, 
  clearLedgerLogs, 
  createUser, 
  updateUser, 
  deleteUser 
} from "@/app/actions/admin";
import { compressImage } from "@/lib/image";

interface KidProfile {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  pin?: string | null;
  coins: number;
  totalEarned: number;
  tasksCompleted: number;
  assignedTasks: any[];
  taskSubmissions: any[];
  rewardRedemptions: any[];
  transactions: any[];
  profilePic?: string | null;
}

export default function AdminKidsConsole({ 
  allUsers, 
  currentUserEmail 
}: { 
  allUsers: KidProfile[]; 
  currentUserEmail: string;
}) {
  const kids = allUsers.filter((u) => u.role === "KID");
  const admins = allUsers.filter((u) => u.role === "ADMIN");

  const [viewMode, setViewMode] = useState<"PLAYERS" | "ADMINS">("PLAYERS");
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || "");
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  
  // Form states for creating user
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("KID");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Form states for editing user
  const [editingUser, setEditingUser] = useState<KidProfile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPin, setEditUserPin] = useState("");
  const [editUserCoins, setEditUserCoins] = useState(0);
  const [editUserLifetime, setEditUserLifetime] = useState(0);

  const handleOpenAddUser = () => {
    setNewUserName("");
    setNewUserRole("KID");
    setNewUserEmail("");
    setNewUserPin("");
    setFormError("");
    setFormLoading(false);
    setIsAddUserOpen(true);
  };

  const handleOpenEditUser = (user: KidProfile) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email || "");
    setEditUserPin("");
    setEditUserCoins(user.coins);
    setEditUserLifetime(user.totalEarned);
    setFormError("");
    setFormLoading(false);
    setIsEditUserOpen(true);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormLoading(true);
    setFormError("");

    const result = await createUser({
      name: newUserName,
      role: newUserRole,
      email: newUserRole === "ADMIN" ? newUserEmail : undefined,
      pin: newUserRole === "KID" ? newUserPin : undefined,
    });

    setFormLoading(false);
    if (result.error) {
      setFormError(result.error);
    } else {
      setIsAddUserOpen(false);
      window.location.reload();
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormLoading(true);
    setFormError("");

    const result = await updateUser(editingUser.id, {
      name: editUserName,
      email: editingUser.role === "ADMIN" ? editUserEmail : undefined,
      pin: editingUser.role === "KID" && editUserPin ? editUserPin : undefined,
      coins: editingUser.role === "KID" ? editUserCoins : undefined,
      totalEarned: editingUser.role === "KID" ? editUserLifetime : undefined,
    });

    setFormLoading(false);
    if (result.error) {
      setFormError(result.error);
    } else {
      setIsEditUserOpen(false);
      window.location.reload();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("☢️ DANGER: Are you sure you want to permanently delete this user? All their missions, history, and records will be forever erased!")) return;
    const result = await deleteUser(userId);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const handleResetCurrentCoins = async () => {
    if (!confirm("☢️ RESET CURRENT COINS:\nAre you sure you want to reset all players' CURRENT spendable coins to 0?")) return;
    setFormLoading(true);
    await resetCurrentCoins();
    setFormLoading(false);
    window.location.reload();
  };

  const handleResetLifetimeXP = async () => {
    if (!confirm("☢️ RESET LIFETIME XP:\nAre you sure you want to reset all players' LIFETIME earned XP and level count to 0?")) return;
    setFormLoading(true);
    await resetLifetimeAccumulation();
    setFormLoading(false);
    window.location.reload();
  };

  const handlePurgeMissions = async () => {
    if (!confirm("☢️ PURGE ALL QUESTS / MISSIONS:\nAre you sure you want to purge all missions, active player assignments, and submissions?")) return;
    setFormLoading(true);
    await purgeMissions();
    setFormLoading(false);
    window.location.reload();
  };

  const handlePurgePrizes = async () => {
    if (!confirm("☢️ PURGE ALL PRIZES / REWARDS:\nAre you sure you want to purge all store prizes and redemptions?")) return;
    setFormLoading(true);
    await purgePrizes();
    setFormLoading(false);
    window.location.reload();
  };

  const handleClearLedger = async () => {
    if (!confirm("☢️ CLEAR COIN LEDGER:\nAre you sure you want to clear the entire transaction log history?")) return;
    setFormLoading(true);
    await clearLedgerLogs();
    setFormLoading(false);
    window.location.reload();
  };

  const level = selectedKid ? Math.floor(selectedKid.totalEarned / 100) + 1 : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Super Admin Control Center */}
      {currentUserEmail === "maxxgandy@gmail.com" && (
        <div className="p-6 border-2 border-red-500 bg-red-950/20 box-neon-pink rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-10 h-10 text-red-500 animate-pulse flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-red-400 font-arcade uppercase">Super Admin Emergency Mainframe</h3>
              <p className="text-xs text-gray-300 uppercase mt-0.5">Granular nuclear options for maxxgandy@gmail.com. Separated to run actions individually.</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 mt-2">
            {/* Reset Current Coins */}
            <div className="p-4 bg-black/60 border border-red-900/50 rounded-lg flex flex-col justify-between gap-3 text-center">
              <div>
                <span className="text-lg block">🪙</span>
                <h4 className="text-xs font-bold text-white uppercase font-arcade mt-1">Spendable Coins</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase leading-relaxed">Resets current player coin counts back to 0</p>
              </div>
              <button
                onClick={handleResetCurrentCoins}
                disabled={formLoading}
                className="w-full py-2.5 text-[10px] font-bold text-black bg-red-500 hover:bg-red-400 font-arcade uppercase rounded transition-all box-neon-pink cursor-pointer disabled:opacity-50"
              >
                Reset Coins
              </button>
            </div>

            {/* Reset Lifetime XP */}
            <div className="p-4 bg-black/60 border border-red-900/50 rounded-lg flex flex-col justify-between gap-3 text-center">
              <div>
                <span className="text-lg block">⭐</span>
                <h4 className="text-xs font-bold text-white uppercase font-arcade mt-1">Lifetime XP</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase leading-relaxed">Resets player accumulated XP and level count back to 1</p>
              </div>
              <button
                onClick={handleResetLifetimeXP}
                disabled={formLoading}
                className="w-full py-2.5 text-[10px] font-bold text-black bg-red-500 hover:bg-red-400 font-arcade uppercase rounded transition-all box-neon-pink cursor-pointer disabled:opacity-50"
              >
                Reset XP
              </button>
            </div>

            {/* Purge Quests */}
            <div className="p-4 bg-black/60 border border-red-900/50 rounded-lg flex flex-col justify-between gap-3 text-center">
              <div>
                <span className="text-lg block">⚔️</span>
                <h4 className="text-xs font-bold text-white uppercase font-arcade mt-1">Missions / Quests</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase leading-relaxed">Deletes all quests, active assignments, and log histories</p>
              </div>
              <button
                onClick={handlePurgeMissions}
                disabled={formLoading}
                className="w-full py-2.5 text-[10px] font-bold text-white border border-red-500 hover:bg-red-900/50 font-arcade uppercase rounded transition-all cursor-pointer disabled:opacity-50"
              >
                Purge Quests
              </button>
            </div>

            {/* Purge Prizes */}
            <div className="p-4 bg-black/60 border border-red-900/50 rounded-lg flex flex-col justify-between gap-3 text-center">
              <div>
                <span className="text-lg block">🎁</span>
                <h4 className="text-xs font-bold text-white uppercase font-arcade mt-1">Prizes / Shop</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase leading-relaxed">Deletes all prizes, store products, and redemptions</p>
              </div>
              <button
                onClick={handlePurgePrizes}
                disabled={formLoading}
                className="w-full py-2.5 text-[10px] font-bold text-white border border-red-500 hover:bg-red-900/50 font-arcade uppercase rounded transition-all cursor-pointer disabled:opacity-50"
              >
                Purge Prizes
              </button>
            </div>

            {/* Clear Ledger */}
            <div className="p-4 bg-black/60 border border-red-900/50 rounded-lg flex flex-col justify-between gap-3 text-center">
              <div>
                <span className="text-lg block">📜</span>
                <h4 className="text-xs font-bold text-white uppercase font-arcade mt-1">Coin Ledger</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase leading-relaxed">Clears all transaction ledger lists and notifications</p>
              </div>
              <button
                onClick={handleClearLedger}
                disabled={formLoading}
                className="w-full py-2.5 text-[10px] font-bold text-white border border-red-500 hover:bg-red-900/50 font-arcade uppercase rounded transition-all cursor-pointer disabled:opacity-50"
              >
                Clear Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Console Menu bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-800 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("PLAYERS")}
            className={`px-4 py-2.5 text-xs font-bold uppercase rounded-lg font-arcade border transition-all ${
              viewMode === "PLAYERS"
                ? "border-purple-500 bg-purple-950/20 text-purple-400 box-neon-pink"
                : "border-gray-800 text-gray-500 hover:text-white"
            }`}
          >
            Players ({kids.length})
          </button>
          <button
            onClick={() => setViewMode("ADMINS")}
            className={`px-4 py-2.5 text-xs font-bold uppercase rounded-lg font-arcade border transition-all ${
              viewMode === "ADMINS"
                ? "border-cyan-500 bg-cyan-950/20 text-cyan-400 box-neon-blue"
                : "border-gray-800 text-gray-500 hover:text-white"
            }`}
          >
            Administrators ({admins.length})
          </button>
        </div>

        <button
          onClick={handleOpenAddUser}
          className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-black uppercase bg-pink-500 hover:bg-pink-400 rounded-xl box-neon-pink font-arcade transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Register New User
        </button>
      </div>

      {viewMode === "PLAYERS" ? (
        <>
          {kids.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
              No players active. Register one using the button above!
            </div>
          ) : (
            <>
              {/* Player Selection Cards */}
              <div className="grid grid-cols-3 gap-3">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => setSelectedKidId(kid.id)}
                    className={`p-4 border-2 rounded-xl transition-all font-arcade uppercase text-xl font-black ${
                      selectedKid?.id === kid.id
                        ? "border-pink-500 bg-pink-950/20 text-pink-400 box-neon-pink"
                        : "border-gray-800 text-gray-500 hover:text-white"
                    }`}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>

              {selectedKid && (
                <>
                  {/* Main Profile Summary */}
                  <div className="grid gap-6 md:grid-cols-4">
                    {/* Core Stats */}
                    <div className="md:col-span-1 p-5 border-2 bg-arcade-panel border-cyan-500 box-neon-blue rounded-xl flex flex-col items-center text-center justify-between min-h-[225px]">
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">
                          RANK LEVEL
                        </span>
                        <span className="text-4xl font-black font-arcade text-cyan-400">Lvl {level}</span>
                      </div>
                      
                      {selectedKid.profilePic ? (
                        <div className="relative w-20 h-20 rounded-full border-4 border-cyan-400 bg-black overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.8)] group cursor-pointer transition-all">
                          <img
                            src={selectedKid.profilePic}
                            alt={selectedKid.name}
                            className="w-full h-full object-cover brightness-110 contrast-125 saturate-150 grayscale-[10%] sepia-[10%] hue-rotate-15"
                          />
                          {/* Scanline CRT overlay */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
                          <div className="absolute inset-0 bg-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressedBase64 = await compressImage(file, 300, 300);
                                  const result = await updateProfilePicture(compressedBase64, selectedKid.id);
                                  if (result.success) {
                                    window.location.reload();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-20 h-20 rounded-full border-4 border-dashed border-cyan-500/50 bg-cyan-950/20 hover:border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.15)] group cursor-pointer transition-all">
                          <Trophy className="w-8 h-8 text-cyan-500 group-hover:scale-110 transition-all" />
                          <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                            <Camera className="w-6 h-6 text-cyan-300" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressedBase64 = await compressImage(file, 300, 300);
                                  const result = await updateProfilePicture(compressedBase64, selectedKid.id);
                                  if (result.success) {
                                    window.location.reload();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          />
                        </div>
                      )}

                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        {selectedKid.totalEarned % 100} / 100 XP TO LEVEL UP
                      </p>
                    </div>

                    <div className="md:col-span-1 p-5 border-2 bg-arcade-panel border-yellow-500 box-neon-yellow rounded-xl flex flex-col items-center text-center justify-between min-h-[220px]">
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">
                          CURRENT COINS
                        </span>
                        <span className="text-4xl font-black font-arcade text-yellow-400 flex items-center justify-center gap-1">
                          {selectedKid.coins} <Coins className="w-7 h-7 text-yellow-400 animate-coin" />
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        LIFETIME EARNED: {selectedKid.totalEarned}
                      </p>
                    </div>

                    <div className="md:col-span-2 p-5 border-2 bg-arcade-panel border-purple-500 box-neon-pink rounded-xl flex flex-col justify-between min-h-[220px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold uppercase text-neon-pink font-arcade">Control Console</h3>
                          <p className="text-[10px] text-gray-400 uppercase mt-0.5">Edit credentials or system permissions</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditUser(selectedKid)}
                            className="p-2 border border-purple-800 text-purple-400 hover:bg-purple-950/40 rounded transition-all cursor-pointer"
                            title="Edit Player Properties"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(selectedKid.id)}
                            className="p-2 border border-red-900 text-red-500 hover:bg-red-950/40 rounded transition-all cursor-pointer"
                            title="Delete Player Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0">
                        <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Missions Cleared</span>
                          <span className="text-2xl font-black font-arcade text-white">{selectedKid.tasksCompleted}</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Prizes Redemptions</span>
                          <span className="text-2xl font-black font-arcade text-white">
                            {selectedKid.rewardRedemptions.filter((r) => r.status === "APPROVED").length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Sections */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Active Missions assignments */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold uppercase text-neon-blue font-arcade">Active Missions</h3>
                      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {selectedKid.assignedTasks.map((assignment) => (
                          <div key={assignment.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                            <div>
                              <h4 className="font-bold text-white text-sm">{assignment.task.title}</h4>
                              <p className="text-[10px] text-gray-500 uppercase">{assignment.task.category}</p>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400 font-bold font-arcade text-xs bg-yellow-950/20 px-2 py-1 rounded">
                              {assignment.task.rewardAmount} <Coins className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                        {selectedKid.assignedTasks.length === 0 && (
                          <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                            No active quests assigned.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quest Submissions History */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold uppercase text-neon-green font-arcade">Quest Logs</h3>
                      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {selectedKid.taskSubmissions.map((sub) => (
                          <div key={sub.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                            <div>
                              <h4 className="font-bold text-white text-sm">{sub.task.title}</h4>
                              <span className="text-[10px] text-gray-500">
                                {new Date(sub.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {sub.status === "APPROVED" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-400 font-arcade uppercase bg-green-950/20 border border-green-900/50 px-2.5 py-1 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> PASS
                                </span>
                              )}
                              {sub.status === "REJECTED" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-500 font-arcade uppercase bg-red-950/20 border border-red-900/50 px-2.5 py-1 rounded">
                                  <XCircle className="w-3.5 h-3.5 text-red-500" /> FAIL
                                </span>
                              )}
                              {sub.status === "PENDING" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 font-arcade uppercase bg-yellow-950/20 border border-yellow-900/50 px-2.5 py-1 rounded">
                                  <Clock className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> COMP
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedKid.taskSubmissions.length === 0 && (
                          <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                            No quest history.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Prize claim history */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold uppercase text-neon-pink font-arcade">Prize Claims</h3>
                      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {selectedKid.rewardRedemptions.map((red) => (
                          <div key={red.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                            <div>
                              <h4 className="font-bold text-white text-sm">{red.reward.title}</h4>
                              <span className="text-[10px] text-gray-500">
                                {new Date(red.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {red.status === "APPROVED" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-pink-400 font-arcade uppercase bg-pink-950/20 border border-pink-900/50 px-2.5 py-1 rounded">
                                  <ShoppingCart className="w-3.5 h-3.5" /> CLAIMED
                                </span>
                              )}
                              {red.status === "REJECTED" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-500 font-arcade uppercase bg-red-950/20 border border-red-900/50 px-2.5 py-1 rounded">
                                  REJECTED
                                </span>
                              )}
                              {red.status === "PENDING" && (
                                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 font-arcade uppercase bg-yellow-950/20 border border-yellow-900/50 px-2.5 py-1 rounded">
                                  PENDING
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedKid.rewardRedemptions.length === 0 && (
                          <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                            No rewards claimed yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Coin logs */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold uppercase text-neon-yellow font-arcade">Coin Ledger</h3>
                      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {selectedKid.transactions.map((tx) => {
                          const isPositive = tx.amount > 0;
                          return (
                            <div key={tx.id} className="flex justify-between items-center p-3 border border-gray-800 bg-black/40 rounded-lg">
                              <div>
                                <h4 className="font-bold text-white text-xs leading-relaxed">{tx.reason}</h4>
                                <span className="text-[9px] text-gray-500 font-mono">
                                  {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              
                              <span className={`font-bold font-arcade text-sm ${isPositive ? "text-green-400" : "text-red-500"}`}>
                                {isPositive ? "+" : ""}
                                {tx.amount}
                              </span>
                            </div>
                          );
                        })}
                        {selectedKid.transactions.length === 0 && (
                          <p className="p-4 text-center text-gray-500 bg-black/40 border border-gray-800 rounded-lg text-sm">
                            No ledger transactions.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        /* Admin User List */
        <div className="grid gap-4 sm:grid-cols-2">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 border-2 border-cyan-800 bg-arcade-panel rounded-xl box-neon-blue"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-cyan-950 border-2 border-cyan-400 text-cyan-400 font-bold font-arcade text-lg rounded-full">
                  A
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase">{admin.name}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{admin.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditUser(admin)}
                  className="p-2 text-cyan-400 border border-cyan-900 rounded hover:bg-cyan-950/40 transition-all cursor-pointer"
                  title="Edit Admin Account"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(admin.id)}
                  className="p-2 text-red-500 border border-red-900 rounded hover:bg-red-950/40 transition-all cursor-pointer"
                  title="Delete Admin Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {admins.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed border-cyan-850 rounded-xl col-span-2">
              No admins configured. Create one above!
            </div>
          )}
        </div>
      )}

      {/* Register User Modal */}
      <AnimatePresence>
        {isAddUserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onSubmit={handleAddUserSubmit}
              className="w-full max-w-md p-6 border-2 bg-arcade-panel border-cyan-500 box-neon-blue rounded-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase text-neon-blue font-arcade">Register User</h2>
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 text-xs font-bold text-red-500 border border-red-500 bg-red-950/20 rounded-lg flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> {formError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">User Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserRole("KID")}
                    className={`p-3 text-xs font-bold font-arcade uppercase border-2 rounded-lg transition-all ${
                      newUserRole === "KID"
                        ? "border-purple-500 bg-purple-950/20 text-purple-400 box-neon-pink"
                        : "border-gray-800 text-gray-500"
                    }`}
                  >
                    Player (Kid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole("ADMIN")}
                    className={`p-3 text-xs font-bold font-arcade uppercase border-2 rounded-lg transition-all ${
                      newUserRole === "ADMIN"
                        ? "border-cyan-500 bg-cyan-950/20 text-cyan-400 box-neon-blue"
                        : "border-gray-800 text-gray-500"
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">Username / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Brexx"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {newUserRole === "ADMIN" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Security PIN (4+ digits)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="e.g. 141414"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 text-center text-xl font-arcade tracking-widest font-bold"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-4 mt-2 text-lg font-bold text-black uppercase bg-cyan-500 hover:bg-cyan-400 rounded-lg box-neon-blue font-arcade disabled:opacity-50 transition-all cursor-pointer"
              >
                {formLoading ? "Deploying..." : "Register User"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modify User Modal */}
      <AnimatePresence>
        {isEditUserOpen && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onSubmit={handleEditUserSubmit}
              className="w-full max-w-md p-6 border-2 bg-arcade-panel border-purple-500 box-neon-pink rounded-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase text-neon-pink font-arcade">
                  Modify Properties
                </h2>
                <button type="button" onClick={() => setIsEditUserOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 text-xs font-bold text-red-500 border border-red-500 bg-red-950/20 rounded-lg flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> {formError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-gray-400">User Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {editingUser.role === "ADMIN" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-bold text-gray-400">New Security PIN (Optional - Leave blank to keep current)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="Enter new 4+ digit PIN..."
                      value={editUserPin}
                      onChange={(e) => setEditUserPin(e.target.value)}
                      className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-center text-lg font-arcade font-bold tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-bold text-gray-400">Current Coins</label>
                      <input
                        type="number"
                        min="0"
                        value={editUserCoins}
                        onChange={(e) => setEditUserCoins(Math.max(0, Number(e.target.value)))}
                        className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-center font-arcade font-bold text-yellow-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-bold text-gray-400">Lifetime XP</label>
                      <input
                        type="number"
                        min="0"
                        value={editUserLifetime}
                        onChange={(e) => setEditUserLifetime(Math.max(0, Number(e.target.value)))}
                        className="p-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-center font-arcade font-bold text-cyan-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-4 mt-2 text-lg font-bold text-black uppercase bg-pink-500 hover:bg-pink-400 rounded-lg box-neon-pink font-arcade disabled:opacity-50 transition-all cursor-pointer"
              >
                {formLoading ? "Updating..." : "Save Modifications"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
