import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  BarChart3, 
  LogOut,
  Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingBag, label: "Produtos", path: "/produtos" },
  { icon: MessageSquare, label: "Atendimento", path: "/atendimento" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];

export function AppSidebar() {
  const location = useLocation();
  const [tryOnsUsed] = useState(124);
  const [tryOnsTotal] = useState(500);
  const percentage = (tryOnsUsed / tryOnsTotal) * 100;

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">FV</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-sm text-foreground">FitVibe</span>
          <span className="text-[10px] text-muted-foreground">B2B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Plan Status */}
      <div className="p-3 mx-2 mb-2 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plano Pro
          </span>
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-foreground">
            Try-ons: {tryOnsUsed}/{tryOnsTotal}
          </span>
          <span className="text-xs font-semibold text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress value={percentage} className="h-1" />
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button className="flex items-center gap-2 px-3 py-2 w-full text-sm text-sidebar-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}