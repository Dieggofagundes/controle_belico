import { NavLink } from "react-router-dom";
import { Emblem } from "./Emblem";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  nav: { to: string; label: string }[];
}

export function Layout({ children, nav }: LayoutProps) {
  const { auth, logout } = useAuth();

  return (
    <div className="app-shell">
      {/* ---- Sidebar (desktop / tablet) ---- */}
      <aside className="panel app-sidebar">
        <div className="app-sidebar-brand">
          <Emblem size={72} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.04em" }}>
              SALA DE MEIOS
            </div>
            <div className="eyebrow" style={{ marginTop: 2 }}>
              {auth?.role === "admin" ? "PAINEL ADMINISTRATIVO" : "PELOTÃO DE SERVIÇO"}
            </div>
          </div>
        </div>

        <hr className="hairline" />

        <nav className="app-sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              style={({ isActive }) => ({
                padding: "10px 14px",
                borderRadius: 3,
                fontSize: 13,
                letterSpacing: "0.03em",
                textDecoration: "none",
                color: isActive ? "#191d13" : "var(--color-text-dim)",
                background: isActive ? "var(--color-accent-brass)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s ease",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div>
          <div className="hairline" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 12, color: "var(--color-text-faint)", marginBottom: 10 }}>
            Conectado como
            <br />
            <span style={{ color: "var(--color-text-dim)" }}>{auth?.nome}</span>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      {/* ---- Coluna principal: topbar (mobile) + conteúdo ---- */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="panel mobile-topbar">
          <div className="mobile-topbar-brand">
            <Emblem size={34} />
            <div>
              <div className="mobile-topbar-title">SALA DE MEIOS</div>
              <div className="eyebrow" style={{ fontSize: 9 }}>
                {auth?.role === "admin" ? "ADMIN" : "PELOTÃO"}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 11 }} onClick={logout}>
            Sair
          </button>
        </div>
        <div className="panel mobile-nav" style={{ borderRadius: 0, borderTop: "none" }}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
