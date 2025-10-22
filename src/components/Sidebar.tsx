import { BookOpen, LayoutDashboard, FileText, Library, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

type View = "dashboard" | "new-sermon" | "resources" | "translator";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
    { id: "new-sermon" as View, label: "Novo Sermão", icon: FileText },
    { id: "resources" as View, label: "Recursos", icon: Library },
    { id: "translator" as View, label: "Tradutor Bíblico", icon: Languages },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SermonPro" className="w-12 h-12 rounded-lg object-cover" />
          <h1 className="text-2xl font-bold text-primary">SermonPro</h1>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                currentView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          SermonPro AI
        </p>
      </div>
    </aside>
  );
};
