import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      {/* Header */}
      <header className="fixed top-0 left-56 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-center">
        <h1 className="text-sm font-medium text-muted-foreground">
          FitVibe Try-On
        </h1>
      </header>

      {/* Main Content */}
      <main className="ml-52 pt-12 min-h-screen flex justify-center">
        <div className="p-6 w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}