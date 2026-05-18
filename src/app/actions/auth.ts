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

  // Simulate 2FA by directly logging in for this MVP
  // In a real app, send an email here and verify code in another step
  await createSession(admin.id, admin.role);
  redirect("/admin/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
