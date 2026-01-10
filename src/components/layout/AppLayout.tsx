import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { Link } from "react-router-dom";
import { Coins, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { profile } = useAuth();
  const { totalCredits, plan, planName, loading } = useCredits();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userName = profile?.full_name || "Usuário";
  const maxPlanCredits = plan === "trial" ? 50 : plan === "starter" ? 100 : plan === "growth" ? 300 : 800;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        {/* Header */}
        <header className={`fixed top-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4 md:px-6 transition-all duration-300 left-14 ${!sidebarCollapsed ? 'md:left-48' : 'md:left-14'}`}>
          {/* Left side - Time */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{formatTime(currentTime)}</span>
          </div>

          {/* Right side - Credits, Badge, Name, Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Credits Counter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors cursor-default">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {loading ? "..." : totalCredits}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    /{maxPlanCredits}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Créditos Restantes</p>
              </TooltipContent>
            </Tooltip>

            {/* Plan Badge */}
            <Badge 
              variant={plan === "trial" ? "secondary" : "default"}
              className={`text-[10px] uppercase tracking-wider ${
                plan === "trial" 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20" 
                  : "bg-primary/10 text-primary border-primary/30"
              }`}
            >
              {planName}
            </Badge>

            {/* User Name (hidden on small screens) */}
            <span className="text-sm font-medium text-foreground hidden md:block max-w-[120px] truncate">
              {userName}
            </span>

            {/* Profile Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/perfil" 
                  className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Meu Perfil</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Overlay for mobile when sidebar is expanded */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main className={`pt-14 min-h-screen flex justify-center transition-all duration-300 ml-14 ${!sidebarCollapsed ? 'md:ml-48' : 'md:ml-14'}`}>
          <div className="p-6 w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}