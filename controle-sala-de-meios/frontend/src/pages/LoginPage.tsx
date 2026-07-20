import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Emblem } from "../components/Emblem";
import { ApiError } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const result = await login(email, senha);
      navigate(result.role === "admin" ? "/admin" : "/servico");
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message);
      } else {
        setErro("Não foi possível conectar ao servidor. Verifique se a API está em execução.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="panel login-card">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <Emblem size={100} />
          <h1 style={{ fontSize: 22, marginTop: 16, textAlign: "center" }}>CONTROLE SALA DE MEIOS</h1>
          <p className="eyebrow" style={{ marginTop: 6 }}>
            ACESSO RESTRITO · IDENTIFIQUE-SE
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label htmlFor="email">Login</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="usuario@caema.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <div
              style={{
                background: "rgba(140,47,47,0.15)",
                border: "1px solid var(--color-accent-red)",
                color: "#f0d6d6",
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {erro}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", marginTop: 6 }} disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <hr className="hairline" style={{ margin: "26px 0 16px" }} />
        <p style={{ fontSize: 11, color: "var(--color-text-faint)", textAlign: "center", lineHeight: 1.6 }}>
          Sistema de controle de cautela de armamento e material bélico.
          <br />
          Uso exclusivo de pessoal autorizado.
        </p>
      </div>
    </div>
  );
}
