"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Verification Helper
async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

// 1. Manual Coin Adjustment
export async function adjustCoins(kidId: string, amount: number, reason: string) {
  await verifyAdmin();

  if (!kidId || amount === 0 || !reason) {
    return { error: "Invalid adjustment parameters." };
  }

  const user = await prisma.user.findUnique({
    where: { id: kidId },
    select: { name: true, coins: true, totalEarned: true },
  });

  if (!user) return { error: "User not found." };

  const updatedCoins = Math.max(0, user.coins + amount);
  const updatedTotalEarned = amount > 0 ? user.totalEarned + amount : user.totalEarned;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: kidId },
      data: {
        coins: updatedCoins,
        totalEarned: updatedTotalEarned,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: kidId,
        amount,
        reason: `Parent Adjustment: ${reason}`,
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin adjusted ${user.name}'s coins by ${amount > 0 ? "+" : ""}${amount} for "${reason}"`,
      },
    }),
  ]);

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/kids");
  revalidatePath("/admin/transactions");
  return { success: true };
}

// 2. Approve Task Submission
export async function approveSubmission(submissionId: string) {
  await verifyAdmin();

  const submission = await prisma.taskSubmission.findUnique({
    where: { id: submissionId },
    include: { task: true, user: true },
  });

  if (!submission || submission.status !== "PENDING") {
    return { error: "Submission not found or already processed." };
  }

  const reward = submission.task.rewardAmount;

  await prisma.$transaction([
    prisma.taskSubmission.update({
      where: { id: submissionId },
      data: { status: "APPROVED" },
    }),
    prisma.user.update({
      where: { id: submission.userId },
      data: {
        coins: { increment: reward },
        totalEarned: { increment: reward },
        tasksCompleted: { increment: 1 },
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: submission.userId,
        amount: reward,
        reason: `Completed quest: ${submission.task.title}`,
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin approved ${submission.user.name}'s quest "${submission.task.title}" (+${reward} coins)`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// 3. Reject Task Submission
export async function rejectSubmission(submissionId: string) {
  await verifyAdmin();

  const submission = await prisma.taskSubmission.findUnique({
    where: { id: submissionId },
    include: { task: true, user: true },
  });

  if (!submission || submission.status !== "PENDING") {
    return { error: "Submission not found or already processed." };
  }

  await prisma.$transaction([
    prisma.taskSubmission.update({
      where: { id: submissionId },
      data: { status: "REJECTED" },
    }),
    // Re-assign the task back to the user (since they failed/got rejected)
    prisma.taskAssignment.upsert({
      where: {
        taskId_userId: {
          taskId: submission.taskId,
          userId: submission.userId,
        },
      },
      update: {},
      create: {
        taskId: submission.taskId,
        userId: submission.userId,
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin rejected ${submission.user.name}'s quest submission "${submission.task.title}"`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  return { success: true };
}

// 4. Approve Reward Redemption
export async function approveRedemption(redemptionId: string) {
  await verifyAdmin();

  const redemption = await prisma.rewardRedemption.findUnique({
    where: { id: redemptionId },
    include: { reward: true, user: true },
  });

  if (!redemption || redemption.status !== "PENDING") {
    return { error: "Redemption not found or already processed." };
  }

  await prisma.$transaction([
    prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status: "APPROVED" },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin approved prize delivery of "${redemption.reward.title}" to ${redemption.user.name}`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  return { success: true };
}

// 5. Reject Reward Redemption
export async function rejectRedemption(redemptionId: string) {
  await verifyAdmin();

  const redemption = await prisma.rewardRedemption.findUnique({
    where: { id: redemptionId },
    include: { reward: true, user: true },
  });

  if (!redemption || redemption.status !== "PENDING") {
    return { error: "Redemption not found or already processed." };
  }

  const refund = redemption.reward.cost;

  // Refund the coins since request was rejected
  await prisma.$transaction([
    prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status: "REJECTED" },
    }),
    prisma.user.update({
      where: { id: redemption.userId },
      data: { coins: { increment: refund } },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: redemption.userId,
        amount: refund,
        reason: `Refund: Rejected Prize "${redemption.reward.title}"`,
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin rejected prize redemption for "${redemption.reward.title}" (Refunded +${refund} coins to ${redemption.user.name})`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  return { success: true };
}

// 6. Approve Custom Task Request
export async function approveCustomTaskRequest(requestId: string, approvedReward: number) {
  await verifyAdmin();

  const request = await prisma.customTaskRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request || request.status !== "PENDING") {
    return { error: "Request not found." };
  }

  // Create a brand new Task with category CUSTOM
  const createdTask = await prisma.task.create({
    data: {
      title: request.title,
      description: request.description,
      category: "CUSTOM",
      rewardAmount: approvedReward,
      requiresApproval: true,
      isRepeat: false,
    },
  });

  // Assign the task to the kid who requested it
  await prisma.$transaction([
    prisma.customTaskRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    }),
    prisma.taskAssignment.create({
      data: {
        taskId: createdTask.id,
        userId: request.userId,
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin approved custom quest "${request.title}" (+${approvedReward} coins reward) for ${request.user.name}`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  return { success: true };
}

// 7. Reject Custom Task Request
export async function rejectCustomTaskRequest(requestId: string) {
  await verifyAdmin();

  const request = await prisma.customTaskRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request || request.status !== "PENDING") {
    return { error: "Request not found." };
  }

  await prisma.$transaction([
    prisma.customTaskRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    }),
    prisma.activityLog.create({
      data: {
        message: `Admin rejected custom quest proposal "${request.title}" from ${request.user.name}`,
      },
    }),
  ]);

  revalidatePath("/admin/approvals");
  return { success: true };
}
