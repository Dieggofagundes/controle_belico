import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { rotaParaRole } from "../types";

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== role) return <Navigate to={rotaParaRole(auth.role)} replace />;

  return <>{children}</>;
}
