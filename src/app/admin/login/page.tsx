import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-purple-900/40 to-transparent"></div>
      
      <div className="relative z-10 w-full">
        <AdminLoginForm />
      </div>
    </main>
  );
}
