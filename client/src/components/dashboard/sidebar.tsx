import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiFirebase } from "react-icons/si";
import { LayoutDashboard, Settings } from "lucide-react";
import { SettingsModal } from "./settings-modal";

const sidebarNavItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
];

export function Sidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <SiFirebase className="h-6 w-6 text-orange-500" />
          <span>Firebase Dashboard</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </ScrollArea>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}