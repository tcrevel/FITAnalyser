import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";
import { FitFilesGrid } from "@/components/dashboard/fit-files-grid";
import { useAuthStore } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-none">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b px-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.displayName || 'User'}!
            </p>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <FitFilesGrid />
        </main>
      </div>
    </div>
  );
}