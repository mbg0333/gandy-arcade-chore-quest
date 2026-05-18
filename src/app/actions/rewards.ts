"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function redeemReward(rewardId: string, cost: number) {
  const session = await getSession();
  if (!session || session.role !== "KID") return { error: "Unauthorized" };

  const userId = session.userId as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });

  if (!user || user.coins < cost) {
    return { error: "Not enough coins!" };
  }

  // Deduct coins immediately and create a pending redemption
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: cost } },
    }),
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: -cost,
        reason: `Redeemed reward`,
      },
    }),
    prisma.rewardRedemption.create({
      data: {
        rewardId,
        userId,
        status: "PENDING",
      },
    }),
    prisma.activityLog.create({
      data: { message: `Reward requested` },
    }),
  ]);

  revalidatePath("/kid/rewards");
  revalidatePath("/kid/dashboard");
  return { success: true };
}

export async function redeemCustomReward(type: "CASH" | "TIME", amount: number, cost: number) {
  const session = await getSession();
  if (!session || session.role !== "KID") return { error: "Unauthorized" };

  const userId = session.userId as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, coins: true },
  });

  if (!user || user.coins < cost) {
    return { error: "Not enough coins!" };
  }

  // Create the reward dynamically if it doesn't exist
  const title = type === "CASH" 
    ? `$${amount} Cash Packet`
    : `${amount} Minutes Video Game Time`;

  const description = type === "CASH"
    ? `Claiming $${amount} cash reward from parents.`
    : `Claiming ${amount} minutes of video game screen time.`;

  let reward = await prisma.reward.findFirst({
    where: { title },
  });

  if (!reward) {
    reward = await prisma.reward.create({
      data: {
        title,
        cost,
        description,
        isActive: true,
      },
    });
  }

  // Deduct coins immediately and create a pending redemption
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: cost } },
    }),
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: -cost,
        reason: `Redeemed: ${title}`,
      },
    }),
    prisma.rewardRedemption.create({
      data: {
        rewardId: reward.id,
        userId,
        status: "PENDING",
      },
    }),
    prisma.activityLog.create({
      data: { message: `${user.name} requested ${title}` },
    }),
  ]);

  revalidatePath("/kid/rewards");
  revalidatePath("/kid/dashboard");
  return { success: true };
}
