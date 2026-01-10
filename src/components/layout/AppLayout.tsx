import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      {/* Header */}
      <header className={`fixed top-0 ${sidebarCollapsed ? 'left-14' : 'left-48'} right-0 h-12 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-center transition-all duration-300`}>
        <h1 className="text-xs font-medium text-muted-foreground">
          FitVibe Try-On
        </h1>
      </header>

      {/* Main Content */}
      <main className={`${sidebarCollapsed ? 'ml-14' : 'ml-48'} pt-12 min-h-screen flex justify-center transition-all duration-300`}>
        <div className="p-6 w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}