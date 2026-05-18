"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestCustomTask(title: string, description: string, suggestedCoins: number) {
  const session = await getSession();
  if (!session || session.role !== "KID") {
    return { error: "Unauthorized" };
  }

  if (!title) {
    return { error: "Quest Title is required!" };
  }

  const userId = session.userId as string;

  await prisma.$transaction([
    prisma.customTaskRequest.create({
      data: {
        userId,
        title,
        description,
        suggestedCoins,
        status: "PENDING",
      },
    }),
    prisma.activityLog.create({
      data: {
        message: `Custom task request "${title}" submitted`,
      },
    }),
  ]);

  revalidatePath("/kid/dashboard");
  return { success: true };
}
