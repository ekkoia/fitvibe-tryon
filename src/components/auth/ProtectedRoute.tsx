import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "user" | "admin" | "admin_global";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  requireAdmin?: boolean;
  requireAdminGlobal?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAdmin,
  requireAdminGlobal,
}: ProtectedRouteProps) {
  const { user, loading, hasRole, isAdmin, isAdminGlobal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role requirements
  if (requireAdminGlobal && !isAdminGlobal()) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
