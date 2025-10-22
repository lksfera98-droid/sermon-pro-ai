import { BookOpen, LayoutDashboard, FileText, Book, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

type View = "dashboard" | "new-sermon" | "translator" | "bible-studies" | "dictionaries" | "study-bibles";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ currentView, onViewChange, isMobileOpen, onMobileClose }: SidebarProps) => {
  const handleViewChange = (view: View) => {
    onViewChange(view);
    onMobileClose?.();
  };

  const menuItems = [
    { id: "dashboard" as View, label: "Menu Principal", icon: LayoutDashboard },
    { id: "new-sermon" as View, label: "Crie seu novo sermão", icon: FileText },
    { id: "translator" as View, label: "Tradutor Bíblico", icon: Languages },
    { id: "bible-studies" as View, label: "Estudos Bíblicos", icon: BookOpen },
    { id: "dictionaries" as View, label: "Dicionários Bíblicos", icon: Book },
    { id: "study-bibles" as View, label: "Bíblias de Estudo", icon: Book },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 border-r bg-card flex flex-col z-50 transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 md:p-6 border-b">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SermonPro" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover" />
            <h1 className="text-xl md:text-2xl font-bold text-primary">SermonPro</h1>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 md:p-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors text-sm font-medium border",
                  currentView === item.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-border"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-left">{item.label}</span>
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
    </>
  );
};
