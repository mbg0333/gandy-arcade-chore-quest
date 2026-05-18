"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginKid(name: string, pin: string) {
  const kid = await prisma.user.findFirst({
    where: {
      name: { equals: name },
      role: "KID",
    },
  });

  if (!kid || !kid.pin) {
    return { error: "Invalid name or PIN." };
  }

  const isValid = await bcrypt.compare(pin, kid.pin);

  if (!isValid) {
    return { error: "Invalid name or PIN." };
  }

  await createSession(kid.id, kid.role);
  redirect("/kid/dashboard");
}

export async function loginAdmin(email: string) {
  const admin = await prisma.user.findFirst({
    where: {
      email,
      role: "ADMIN",
    },
  });

  if (!admin) {
    return { error: "Admin email not found." };
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // Update DB with active code and expiration
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      mfaCode: code,
      mfaExpires: expiresAt,
    },
  });

  // Try to send real email via Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Gandy Arcade <onboarding@resend.dev>",
          to: [email],
          subject: "🔐 Your Arcade Portal Verification Code",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 2px solid #00f0ff; border-radius: 12px; background-color: #000; color: #fff; text-align: center;">
              <h1 style="color: #00f0ff; text-transform: uppercase; letter-spacing: 2px;">Gandy Arcade Mainframe</h1>
              <p style="color: #ccc; font-size: 16px;">A login attempt was initiated for your administrator account.</p>
              <div style="margin: 30px 0; padding: 15px; background-color: #111; border: 1px dashed #ff007f; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff007f;">${code}</span>
              </div>
              <p style="color: #888; font-size: 12px;">This verification code is active for 5 minutes. If you did not request this code, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resend API error:", errorData);
      }
    } catch (err) {
      console.error("Failed to send MFA email via Resend:", err);
    }
  } else {
    console.warn(`[MOCK EMAIL LOG] RESEND_API_KEY is not set. Verification code for ${email} is: ${code}`);
  }

  // Return success to let the form switch to the code verification step
  return { 
    success: true, 
    fallbackCode: apiKey ? undefined : code 
  };
}

export async function verifyAdminMfa(email: string, code: string) {
  const admin = await prisma.user.findFirst({
    where: {
      email,
      role: "ADMIN",
    },
  });

  if (!admin) {
    return { error: "Admin account not found." };
  }

  if (!admin.mfaCode || !admin.mfaExpires) {
    return { error: "No active verification request found. Please request a new code." };
  }

  if (new Date() > admin.mfaExpires) {
    return { error: "Verification code has expired. Please request a new code." };
  }

  if (admin.mfaCode !== code) {
    return { error: "Incorrect verification code. Please try again!" };
  }

  // Clear code on success to prevent replay attacks
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      mfaCode: null,
      mfaExpires: null,
    },
  });

  await createSession(admin.id, admin.role);
  redirect("/admin/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
