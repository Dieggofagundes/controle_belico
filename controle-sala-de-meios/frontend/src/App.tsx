import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CadastroPoliciais } from "./pages/admin/CadastroPoliciais";
import { Relatorios } from "./pages/admin/Relatorios";
import { FormularioServico } from "./pages/pelotao/FormularioServico";

const ADMIN_NAV = [
  { to: "/admin", label: "Visão Geral" },
  { to: "/admin/policiais", label: "Cadastro de Policiais" },
  { to: "/admin/relatorios", label: "Relatórios" },
];

const PELOTAO_NAV = [{ to: "/servico", label: "Formulário de Cautela" }];

function RaizAutenticada() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Navigate to={auth.role === "admin" ? "/admin" : "/servico"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="scene-backdrop" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <Layout nav={ADMIN_NAV}>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/policiais"
              element={
                <ProtectedRoute role="admin">
                  <Layout nav={ADMIN_NAV}>
                    <CadastroPoliciais />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/relatorios"
              element={
                <ProtectedRoute role="admin">
                  <Layout nav={ADMIN_NAV}>
                    <Relatorios />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/servico"
              element={
                <ProtectedRoute role="pelotao">
                  <Layout nav={PELOTAO_NAV}>
                    <FormularioServico />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<RaizAutenticada />} />
            <Route path="*" element={<RaizAutenticada />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
