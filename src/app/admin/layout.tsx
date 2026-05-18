import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogOut, Home, ListTodo, Gift, ShieldAlert, Users, History, Bell } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN" || !session.userId) {
    return <>{children}</>;
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });

  if (!admin) return <>{children}</>;

  // Fetch pending submissions + redemptions + custom tasks count
  const [pendingSubs, pendingReds, pendingCustoms] = await Promise.all([
    prisma.taskSubmission.count({ where: { status: "PENDING" } }),
    prisma.rewardRedemption.count({ where: { status: "PENDING" } }),
    prisma.customTaskRequest.count({ where: { status: "PENDING" } }),
  ]);

  const pendingApprovalsCount = pendingSubs + pendingReds + pendingCustoms;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 p-4 border-b-2 bg-arcade-panel border-cyan-500 box-neon-blue">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 font-bold bg-cyan-600 rounded-full font-arcade text-white shadow-[0_0_10px_#00ffff]">
              A
            </div>
            <span className="hidden text-xl font-bold uppercase sm:inline font-arcade text-neon-blue">
              Admin HQ
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin/approvals" className="relative p-2 text-yellow-400 bg-black/50 border border-yellow-500 rounded-lg">
              <Bell className="w-5 h-5 animate-pulse" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[10px] font-bold text-black bg-yellow-400 rounded-full flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>

            <span className="hidden md:inline text-xs text-gray-400 font-mono">
              {admin.email}
            </span>

            <form action={logout}>
              <button className="p-2 text-red-400 transition-colors bg-black border border-red-500 rounded-lg hover:bg-red-500 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-6xl p-4 mx-auto gap-6 pb-24 md:pb-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 p-4 border-2 bg-arcade-panel border-cyan-900/50 rounded-xl gap-2 h-fit">
          <SidebarLinks pendingCount={pendingApprovalsCount} />
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 p-2 border-t-2 bg-arcade-panel border-cyan-500 box-neon-blue md:hidden">
        <div className="flex justify-around max-w-md mx-auto">
          <SidebarLinks pendingCount={pendingApprovalsCount} isMobile />
        </div>
      </nav>
    </div>
  );
}

function SidebarLinks({ pendingCount, isMobile }: { pendingCount: number; isMobile?: boolean }) {
  const links = [
    { href: "/admin/dashboard", label: "Overview", icon: Home, color: "text-cyan-400" },
    { href: "/admin/approvals", label: "Approvals", icon: ShieldAlert, color: "text-yellow-400", badge: pendingCount },
    { href: "/admin/tasks", label: "Quests", icon: ListTodo, color: "text-green-400" },
    { href: "/admin/rewards", label: "Prizes", icon: Gift, color: "text-pink-400" },
    { href: "/admin/kids", label: "Kids", icon: Users, color: "text-purple-400" },
    { href: "/admin/transactions", label: "Ledger", icon: History, color: "text-blue-400" },
  ];

  if (isMobile) {
    return (
      <>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`relative flex flex-col items-center p-2 ${link.color} hover:text-white`}>
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-arcade">{link.label}</span>
              {link.badge && link.badge > 0 ? (
                <span className="absolute top-1 right-2 w-4 h-4 text-[8px] font-bold text-black bg-yellow-400 rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between p-3 rounded-lg hover:bg-black/40 transition-colors ${link.color}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-sm font-arcade text-white">{link.label}</span>
            </div>
            {link.badge && link.badge > 0 ? (
              <span className="px-2 py-0.5 text-xs font-bold text-black bg-yellow-400 rounded-full font-arcade">
                {link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
