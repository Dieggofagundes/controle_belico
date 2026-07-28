import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { rotaParaRole } from "../types";

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role | Role[];  children: React.ReactNode;
}) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  const rolesPermitidas = Array.isArray(role) ? role : [role];
    if (!rolesPermitidas.includes(auth.role)) return <Navigate to={rotaParaRole(auth.role)} replace />;
  return <>{children}</>;
}
