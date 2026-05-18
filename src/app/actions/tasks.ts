"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitTask(taskId: string, kidNotes?: string, proofData?: string, proofType?: string) {
  const session = await getSession();
  if (!session || session.role !== "KID") return { error: "Unauthorized" };

  // Delete assignment if it's not a repeating task (simplified for MVP)
  await prisma.taskAssignment.deleteMany({
    where: { taskId, userId: session.userId as string },
  });

  await prisma.taskSubmission.create({
    data: {
      taskId,
      userId: session.userId as string,
      status: "PENDING",
      kidNotes,
      proofData,
      proofType,
    },
  });

  await prisma.activityLog.create({
    data: {
      message: `Task submitted for approval`,
    },
  });

  revalidatePath("/kid/tasks");
  revalidatePath("/kid/dashboard");
  return { success: true };
}
