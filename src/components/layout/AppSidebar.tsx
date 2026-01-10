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
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">FV</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-foreground">FitVibe</span>
          <span className="text-xs text-muted-foreground">B2B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Plan Status */}
      <div className="p-4 mx-3 mb-3 bg-muted/30 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plano Pro
          </span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground">
            Try-ons: {tryOnsUsed}/{tryOnsTotal}
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-sidebar-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}