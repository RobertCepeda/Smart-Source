import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f172a] px-4">
        <div className="rounded-lg border border-white/10 bg-white/10 px-6 py-5 text-center text-white">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-500" />
          <p className="text-sm font-semibold">Preparando portal admin</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== "SYSTEM_ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}
