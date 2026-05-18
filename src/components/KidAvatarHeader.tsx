"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { updateProfilePicture } from "@/app/actions/admin";
import { compressImage } from "@/lib/image";

export default function KidAvatarHeader({ kid }: { kid: { id: string; name: string; profilePic: string | null } }) {
  const [profilePic, setProfilePic] = useState(kid.profilePic);

  return (
    <div className="relative w-10 h-10 rounded-full border-2 border-pink-500 bg-black overflow-hidden shadow-[0_0_10px_rgba(236,72,153,0.8)] group cursor-pointer flex-shrink-0">
      {profilePic ? (
        <img
          src={profilePic}
          alt={kid.name}
          className="w-full h-full object-cover brightness-110 contrast-125 saturate-150 grayscale-[10%] sepia-[10%] hue-rotate-15"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold bg-pink-600 font-arcade text-white">
          {kid.name.charAt(0)}
        </div>
      )}
      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_3px,2px_100%] pointer-events-none" />
      
      {/* Hover Camera Upload overlay */}
      <div className="absolute inset-0 bg-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Camera className="w-4 h-4 text-white" />
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
              setProfilePic(compressedBase64);
              await updateProfilePicture(compressedBase64);
            } catch (err) {
              console.error(err);
            }
          }
        }}
      />
    </div>
  );
}
