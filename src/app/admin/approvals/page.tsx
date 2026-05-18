import { prisma } from "@/lib/prisma";
import AdminApprovalsConsole from "@/components/AdminApprovalsConsole";

export default async function AdminApprovalsPage() {
  const [submissions, redemptions, customRequests] = await Promise.all([
    prisma.taskSubmission.findMany({
      where: { status: "PENDING" },
      include: { task: true, user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rewardRedemption.findMany({
      where: { status: "PENDING" },
      include: { reward: true, user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customTaskRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold uppercase text-neon-yellow font-arcade">Approvals Center</h1>
        <p className="text-xs text-gray-400 uppercase mt-1">Review completed quests, prize redemptions, and custom pitches</p>
      </div>

      <AdminApprovalsConsole 
        initialSubmissions={submissions} 
        initialRedemptions={redemptions} 
        initialCustomRequests={customRequests} 
      />
    </div>
  );
}
