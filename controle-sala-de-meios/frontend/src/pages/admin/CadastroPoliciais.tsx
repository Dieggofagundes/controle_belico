import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { Policial } from "../../types";
import { useToast } from "../../context/ToastContext";

export function CadastroPoliciais() {
  const { notify } = useToast();
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeGuerra, setNomeGuerra] = useState("");
  const [matricula, setMatricula] = useState("");

  function carregar() {
    setLoading(true);
    api
      .listarPoliciais()
      .then(setPoliciais)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.criarPolicial({
        nome_completo: nomeCompleto.trim(),
        nome_guerra: nomeGuerra.trim(),
        matricula: matricula.trim(),
      });
      notify(`Policial ${nomeGuerra.trim()} cadastrado com sucesso.`, "success");
      setNomeCompleto("");
      setNomeGuerra("");
      setMatricula("");
      carregar();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Erro ao cadastrar policial.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id: number, nome: string) {
    if (!confirm(`Remover o cadastro de ${nome}?`)) return;
    try {
      await api.removerPolicial(id);
      notify("Cadastro removido.", "success");
      carregar();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Erro ao remover.", "error");
    }
  }

  const filtrados = policiais.filter((p) => {
    const alvo = `${p.nome_completo} ${p.nome_guerra} ${p.matricula}`.toLowerCase();
    return alvo.includes(busca.toLowerCase());
  });

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <p className="eyebrow">ADMINISTRAÇÃO</p>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Cadastro de Policiais</h1>
      </header>

      <div className="grid-cadastro">
        <form onSubmit={handleSubmit} className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 15 }}>Novo Registro</h3>
          <div className="field">
            <label>Nome Completo</label>
            <input
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Ex: João da Silva Santos"
              required
            />
          </div>
          <div className="field">
            <label>Nome de Guerra</label>
            <input
              value={nomeGuerra}
              onChange={(e) => setNomeGuerra(e.target.value)}
              placeholder="Ex: SANTOS"
              required
            />
          </div>
          <div className="field">
            <label>Matrícula</label>
            <input
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ex: 12345-6"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }} disabled={salvando}>
            {salvando ? "Salvando..." : "+ Cadastrar Policial"}
          </button>
        </form>

        <div className="panel" style={{ padding: 24 }}>
          <div className="list-toolbar" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Efetivo Cadastrado ({policiais.length})</h3>
            <input
              placeholder="Buscar por nome ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text)",
                padding: "8px 12px",
                fontSize: 13,
                width: 240,
                maxWidth: "100%",
              }}
            />
          </div>

          {loading ? (
            <p style={{ color: "var(--color-text-dim)", fontSize: 13 }}>Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p style={{ color: "var(--color-text-dim)", fontSize: 13 }}>
              Nenhum policial cadastrado ainda. Use o formulário ao lado para começar.
            </p>
          ) : (
            <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--color-text-faint)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  <th style={{ paddingBottom: 10 }}>Nome de Guerra</th>
                  <th style={{ paddingBottom: 10 }}>Nome Completo</th>
                  <th style={{ paddingBottom: 10 }}>Matrícula</th>
                  <th style={{ paddingBottom: 10 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--color-line)" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600 }}>{p.nome_guerra}</td>
                    <td style={{ padding: "10px 0", color: "var(--color-text-dim)" }}>{p.nome_completo}</td>
                    <td style={{ padding: "10px 0", fontFamily: "var(--font-mono)", color: "var(--color-text-dim)" }}>
                      {p.matricula}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right" }}>
                      <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => handleRemover(p.id, p.nome_guerra)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
