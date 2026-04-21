import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const CaGuard = ({ children }: { children: ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/ca/login" replace />;
  if (role !== "ca") return <Navigate to="/" replace />;
  return <>{children}</>;
};
