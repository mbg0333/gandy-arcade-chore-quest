"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

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
      data: { 
        status: "APPROVED",
        proofData: null,
        proofType: null
      },
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
      data: { 
        status: "REJECTED",
        proofData: null,
        proofType: null
      },
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

// 8. Update Profile Picture (Digital Avatar Creator)
export async function updateProfilePicture(profilePic: string, kidId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const targetId = kidId && session.role === "ADMIN" ? kidId : (session.userId as string);

  await prisma.user.update({
    where: { id: targetId },
    data: { profilePic },
  });

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { name: true },
  });

  await prisma.activityLog.create({
    data: {
      message: `${user?.name || "Player"} updated their profile picture avatar!`,
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/kid/dashboard");
  revalidatePath("/kid/leaderboard");
  return { success: true };
}

// 9. Super Admin Reset Current Coins (maxxgandy@gmail.com only)
export async function resetCurrentCoins() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.userId) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin || admin.email !== "maxxgandy@gmail.com") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  await prisma.user.updateMany({
    where: { role: "KID" },
    data: { coins: 0 },
  });

  await prisma.activityLog.create({
    data: {
      message: "SYSTEM RESET: Super Admin reset all active player coins to 0!",
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/kid/dashboard");
  return { success: true };
}

// 10. Super Admin Reset Lifetime Accumulation (maxxgandy@gmail.com only)
export async function resetLifetimeAccumulation() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.userId) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin || admin.email !== "maxxgandy@gmail.com") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  await prisma.user.updateMany({
    where: { role: "KID" },
    data: { 
      totalEarned: 0,
      tasksCompleted: 0
    },
  });

  await prisma.activityLog.create({
    data: {
      message: "SYSTEM RESET: Super Admin reset all active player lifetime earned XP to 0!",
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/kid/dashboard");
  revalidatePath("/kid/leaderboard");
  return { success: true };
}

// 10b. Super Admin Purge Quests / Missions (maxxgandy@gmail.com only)
export async function purgeMissions() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.userId) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin || admin.email !== "maxxgandy@gmail.com") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  await prisma.taskSubmission.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.customTaskRequest.deleteMany({});
  await prisma.task.deleteMany({});

  await prisma.activityLog.create({
    data: {
      message: "SYSTEM RESET: Super Admin purged all missions, assignments, and submissions from the database!",
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/approvals");
  revalidatePath("/kid/dashboard");
  revalidatePath("/kid/tasks");
  return { success: true };
}

// 10c. Super Admin Purge Prizes / Shop (maxxgandy@gmail.com only)
export async function purgePrizes() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.userId) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin || admin.email !== "maxxgandy@gmail.com") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  await prisma.rewardRedemption.deleteMany({});
  await prisma.reward.deleteMany({});

  await prisma.activityLog.create({
    data: {
      message: "SYSTEM RESET: Super Admin purged all store prizes and redemptions from the database!",
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/admin/rewards");
  revalidatePath("/admin/approvals");
  revalidatePath("/kid/dashboard");
  revalidatePath("/kid/rewards");
  return { success: true };
}

// 10d. Super Admin Clear Ledger / Transactions (maxxgandy@gmail.com only)
export async function clearLedgerLogs() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.userId) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin || admin.email !== "maxxgandy@gmail.com") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  await prisma.coinTransaction.deleteMany({});
  await prisma.notification.deleteMany({});

  await prisma.activityLog.create({
    data: {
      message: "SYSTEM RESET: Super Admin cleared the coin ledger and transaction logs!",
    },
  });

  revalidatePath("/admin/kids");
  revalidatePath("/admin/transactions");
  revalidatePath("/kid/dashboard");
  return { success: true };
}


// 11. Create User
export async function createUser(data: { name: string; role: string; email?: string; pin?: string }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const { name, role, email, pin } = data;

  if (!name.trim()) return { error: "User name is required." };
  if (role !== "ADMIN" && role !== "KID") return { error: "Invalid role." };

  if (role === "ADMIN") {
    if (!email || !email.trim()) return { error: "Admin email is required." };
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists." };

    await prisma.user.create({
      data: {
        name,
        role: "ADMIN",
        email: email.toLowerCase().trim(),
      },
    });
  } else {
    if (!pin || pin.length < 4) return { error: "PIN must be at least 4 digits." };
    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) return { error: "A player with this name already exists." };

    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.user.create({
      data: {
        name,
        role: "KID",
        pin: hashedPin,
        coins: 0,
        totalEarned: 0,
      },
    });
  }

  revalidatePath("/admin/kids");
  return { success: true };
}

// 12. Modify User
export async function updateUser(userId: string, data: { name?: string; role?: string; email?: string; pin?: string; coins?: number; totalEarned?: number }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  
  if (user.role === "ADMIN") {
    if (data.email) {
      updateData.email = data.email.toLowerCase().trim();
    }
  } else {
    if (data.pin) {
      updateData.pin = await bcrypt.hash(data.pin, 10);
    }
    if (data.coins !== undefined) {
      updateData.coins = data.coins;
    }
    if (data.totalEarned !== undefined) {
      updateData.totalEarned = data.totalEarned;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath("/admin/kids");
  revalidatePath("/kid/dashboard");
  revalidatePath("/kid/leaderboard");
  return { success: true };
}

// 13. Delete User
export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  // Strict: prevent deleting self
  if (user.id === session.userId) return { error: "You cannot delete your own admin account!" };

  // Cascade delete tasks/transactions/etc manually if SQLite is used
  await prisma.taskSubmission.deleteMany({ where: { userId } });
  await prisma.taskAssignment.deleteMany({ where: { userId } });
  await prisma.customTaskRequest.deleteMany({ where: { userId } });
  await prisma.rewardRedemption.deleteMany({ where: { userId } });
  await prisma.coinTransaction.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/kids");
  revalidatePath("/kid/leaderboard");
  return { success: true };
}

