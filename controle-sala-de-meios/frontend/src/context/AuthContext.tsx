import React, { createContext, useContext, useState, useCallback } from "react";
import type { AuthState } from "../types";
import { api } from "../api/client";

interface AuthContextValue {
  auth: AuthState | null;
  login: (email: string, senha: string) => Promise<AuthState>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): AuthState | null {
  const raw = localStorage.getItem("csm_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(readStoredAuth());

  const login = useCallback(async (email: string, senha: string) => {
    const result = await api.login(email, senha);
    localStorage.setItem("csm_auth", JSON.stringify(result));
    setAuth(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("csm_auth");
    setAuth(null);
  }, []);

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
