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

export async function createTask(formData: {
  title: string;
  description?: string;
  category: string;
  rewardAmount: number;
  isRepeat: boolean;
  assignToIds: string[];
}) {
  await verifyAdmin();

  if (!formData.title || !formData.category || formData.rewardAmount < 0) {
    return { error: "Missing or invalid form inputs." };
  }

  const createdTask = await prisma.task.create({
    data: {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      rewardAmount: formData.rewardAmount,
      isRepeat: formData.isRepeat,
    },
  });

  // Assign to selected kids
  if (formData.assignToIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: formData.assignToIds.map((userId) => ({
        taskId: createdTask.id,
        userId,
      })),
    });
  }

  await prisma.activityLog.create({
    data: {
      message: `Admin created new quest: "${formData.title}"`,
    },
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/kid/tasks");
  revalidatePath("/kid/dashboard");
  return { success: true };
}

export async function updateTask(
  taskId: string,
  formData: {
    title: string;
    description?: string;
    category: string;
    rewardAmount: number;
    isRepeat: boolean;
    assignToIds: string[];
  }
) {
  await verifyAdmin();

  if (!formData.title || !formData.category || formData.rewardAmount < 0) {
    return { error: "Missing or invalid form inputs." };
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        rewardAmount: formData.rewardAmount,
        isRepeat: formData.isRepeat,
      },
    }),
    // Delete existing assignments for this task
    prisma.taskAssignment.deleteMany({
      where: { taskId },
    }),
  ]);

  // Create new assignments
  if (formData.assignToIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: formData.assignToIds.map((userId) => ({
        taskId,
        userId,
      })),
    });
  }

  await prisma.activityLog.create({
    data: {
      message: `Admin updated quest: "${formData.title}"`,
    },
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/kid/tasks");
  revalidatePath("/kid/dashboard");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  await verifyAdmin();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true },
  });

  if (!task) return { error: "Quest not found." };

  await prisma.$transaction([
    // Delete assignments first
    prisma.taskAssignment.deleteMany({ where: { taskId } }),
    prisma.taskSubmission.deleteMany({ where: { taskId } }),
    prisma.task.delete({ where: { id: taskId } }),
  ]);

  await prisma.activityLog.create({
    data: {
      message: `Admin deleted quest: "${task.title}"`,
    },
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/kid/tasks");
  revalidatePath("/kid/dashboard");
  return { success: true };
}
