import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingBag, label: "Produtos", path: "/produtos" },
  { icon: MessageSquare, label: "Atendimento", path: "/atendimento" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Meu Perfil", path: "/perfil" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { totalCredits, planName, planCredits, loading } = useCredits();
  
  // Percentage based on credits remaining vs plan total (capped at 100%)
  const percentage = planCredits > 0 ? Math.min(100, Math.max(0, (totalCredits / planCredits) * 100)) : 0;

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50 md:z-auto ${collapsed ? 'w-14' : 'w-48'}`}>
        {/* Logo */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xs">FV</span>
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-foreground text-sm">FitVibe</span>
              <span className="text-[10px] text-muted-foreground">B2B</span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-muted transition-colors z-50"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              const linkContent = (
                <Link
                  to={item.path}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Plan Status */}
        {!collapsed ? (
          <div className="p-3 mx-2 mb-2 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {planName}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-foreground">
                Créditos: {totalCredits}
              </span>
              <span className="text-xs font-semibold text-primary">
                {Math.round(percentage)}%
              </span>
            </div>
            <Progress value={percentage} className="h-1" />
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-2 mb-2 p-2 bg-muted/30 rounded-lg border border-border flex justify-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">{Math.round(percentage)}%</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-xs">
                <p className="font-semibold">{planName}</p>
                <p>Créditos: {totalCredits}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={signOut}
                  className="flex items-center justify-center px-3 py-2 w-full text-sidebar-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <button 
              onClick={signOut}
              className="flex items-center gap-2.5 px-3 py-2 w-full text-sidebar-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}