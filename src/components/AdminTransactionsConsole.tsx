"use client";

import { useState } from "react";
import { Coins, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

interface Kid {
  id: string;
  name: string;
}

export default function AdminTransactionsConsole({
  transactions,
  kids,
}: {
  transactions: any[];
  kids: Kid[];
}) {
  const [search, setSearch] = useState("");
  const [selectedKidId, setSelectedKidId] = useState("ALL");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.reason.toLowerCase().includes(search.toLowerCase());
    const matchesKid = selectedKidId === "ALL" || tx.userId === selectedKidId;
    return matchesSearch && matchesKid;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm text-white bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedKidId}
          onChange={(e) => setSelectedKidId(e.target.value)}
          className="p-3 text-sm text-white bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-500 font-bold max-w-[200px]"
        >
          <option value="ALL">ALL PLAYERS</option>
          {kids.map((kid) => (
            <option key={kid.id} value={kid.id}>
              {kid.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-2">
        {filteredTransactions.map((tx) => {
          const isPositive = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-4 border-2 rounded-xl bg-black/40 ${
                isPositive ? "border-green-950/20" : "border-red-950/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPositive ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}>
                  {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase font-arcade text-sm">
                      {tx.user.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{tx.reason}</p>
                </div>
              </div>

              <div className={`flex items-center gap-1 font-bold font-arcade text-lg ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}
                {tx.amount} <Coins className="w-4 h-4 animate-coin" />
              </div>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No matching transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
