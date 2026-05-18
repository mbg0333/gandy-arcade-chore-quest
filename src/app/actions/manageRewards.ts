"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createReward(formData: {
  title: string;
  description?: string;
  cost: number;
  image?: string;
}) {
  await verifyAdmin();

  if (!formData.title || formData.cost < 0) {
    return { error: "Missing or invalid cost amount." };
  }

  await prisma.reward.create({
    data: {
      title: formData.title,
      description: formData.description,
      cost: formData.cost,
      image: formData.image,
    },
  });

  await prisma.activityLog.create({
    data: {
      message: `Admin added a new prize to the shop: "${formData.title}"`,
    },
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/kid/rewards");
  return { success: true };
}

export async function updateReward(
  rewardId: string,
  formData: {
    title: string;
    description?: string;
    cost: number;
    image?: string;
  }
) {
  await verifyAdmin();

  if (!formData.title || formData.cost < 0) {
    return { error: "Missing or invalid cost amount." };
  }

  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      title: formData.title,
      description: formData.description,
      cost: formData.cost,
      image: formData.image,
    },
  });

  await prisma.activityLog.create({
    data: {
      message: `Admin updated prize details for: "${formData.title}"`,
    },
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/kid/rewards");
  return { success: true };
}

export async function deleteReward(rewardId: string) {
  await verifyAdmin();

  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    select: { title: true },
  });

  if (!reward) return { error: "Reward not found." };

  await prisma.$transaction([
    // Delete redemptions first
    prisma.rewardRedemption.deleteMany({ where: { rewardId } }),
    prisma.reward.delete({ where: { id: rewardId } }),
  ]);

  await prisma.activityLog.create({
    data: {
      message: `Admin deleted prize from shop: "${reward.title}"`,
    },
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/kid/rewards");
  return { success: true };
}
