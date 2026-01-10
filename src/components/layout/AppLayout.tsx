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
      <header className={`fixed top-0 right-0 h-12 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-center transition-all duration-300 left-14 ${!sidebarCollapsed ? 'md:left-48' : 'md:left-14'}`}>
        <h1 className="text-xs font-medium text-muted-foreground">
          FitVibe Try-On
        </h1>
      </header>

      {/* Overlay for mobile when sidebar is expanded */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <main className={`pt-12 min-h-screen flex justify-center transition-all duration-300 ml-14 ${!sidebarCollapsed ? 'md:ml-48' : 'md:ml-14'}`}>
        <div className="p-6 w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}