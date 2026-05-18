"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, KeyRound, Mail, ArrowLeft } from "lucide-react";
import { loginAdmin, verifyAdminMfa } from "@/app/actions/auth";
import Link from "next/link";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: 2FA Code
  const [mockCode, setMockCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid admin email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin(email);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.fallbackCode) {
          setMockCode(result.fallbackCode);
        } else {
          setMockCode(""); // Real email sent
        }
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate login request.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mockCode && code !== mockCode) {
      setError("Invalid 2FA code. Try again!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyAdminMfa(email, code);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-6 mx-auto bg-black/40 backdrop-blur-md rounded-2xl box-neon-blue">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <Shield className="w-10 h-10 text-cyan-500 animate-pulse" />
        <h1 className="text-3xl font-black tracking-widest text-transparent uppercase font-arcade bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
          Admin Portal
        </h1>
      </motion.div>

      {error && (
        <div className="w-full p-3 mb-4 text-center text-sm font-bold text-red-500 border border-red-500 bg-red-950/20 rounded-lg animate-bounce">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendCode} className="flex flex-col w-full gap-4">
          <h2 className="mb-2 text-lg text-center text-neon-blue font-arcade uppercase">
            Admin Identity
          </h2>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="email"
                placeholder="parent@arcade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 text-lg font-bold text-black uppercase transition-all bg-cyan-500 hover:bg-cyan-400 rounded-lg box-neon-blue font-arcade disabled:opacity-50"
          >
            {loading ? "Initializing..." : "Request Access"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="flex flex-col w-full gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-neon-pink font-arcade uppercase">
              Enter 2FA Code
            </h2>
            <button
              onClick={() => {
                setStep(1);
                setCode("");
                setError("");
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          </div>

          {mockCode ? (
            <div className="w-full p-4 mb-4 text-center border-2 border-dashed border-yellow-500/50 bg-yellow-950/20 rounded-lg text-yellow-400 text-xs font-mono">
              [MOCK 2FA LOG] Code sent to email: <span className="font-bold text-sm bg-yellow-400 text-black px-2 py-0.5 rounded">{mockCode}</span>
            </div>
          ) : (
            <div className="w-full p-4 mb-4 text-center border-2 border-dashed border-green-500/50 bg-green-950/20 rounded-lg text-green-400 text-xs font-arcade">
              🔐 SECURE 2FA CODE SENT TO YOUR EMAIL!
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Verification Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-10 pr-3 py-3 text-white bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-pink-500 transition-colors text-center tracking-[0.5em] font-mono text-xl"
                maxLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 text-lg font-bold text-black uppercase transition-all bg-pink-500 hover:bg-pink-400 rounded-lg box-neon-pink font-arcade disabled:opacity-50"
          >
            {loading ? "Authorizing..." : "Access Mainframe"}
          </button>
        </form>
      )}

      <div className="mt-6">
        <Link href="/" className="text-xs text-gray-500 hover:text-white font-arcade uppercase tracking-wider">
          Cancel & Back to Players
        </Link>
      </div>
    </div>
  );
}
