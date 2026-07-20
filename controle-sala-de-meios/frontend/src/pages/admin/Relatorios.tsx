import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Relatorio } from "../../types";
import { PELOTOES } from "../../types";

export function Relatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroPelotao, setFiltroPelotao] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  function carregar() {
    setLoading(true);
    api
      .listarRelatorios({ data: filtroData || undefined, pelotao: filtroPelotao || undefined })
      .then(setRelatorios)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [filtroData, filtroPelotao]);

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <p className="eyebrow">ADMINISTRAÇÃO</p>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Relatórios de Cautela</h1>
      </header>

      <div className="panel filter-bar" style={{ padding: 20, marginBottom: 24 }}>
        <div className="field" style={{ width: 200 }}>
          <label>Filtrar por Data</label>
          <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
        </div>
        <div className="field" style={{ width: 220 }}>
          <label>Filtrar por Pelotão</label>
          <select value={filtroPelotao} onChange={(e) => setFiltroPelotao(e.target.value)}>
            <option value="">Todos os pelotões</option>
            {PELOTOES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {(filtroData || filtroPelotao) && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFiltroData("");
              setFiltroPelotao("");
            }}
          >
            Limpar filtros
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--color-text-dim)" }}>
          {loading ? "Carregando..." : `${relatorios.length} relatório(s) encontrado(s)`}
        </div>
      </div>

      {!loading && relatorios.length === 0 && (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--color-text-dim)" }}>
          Nenhum relatório encontrado para os filtros selecionados.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {relatorios.map((r) => (
          <div key={r.id} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setExpandido(expandido === r.id ? null : r.id)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "var(--color-text)",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--color-accent-brass)" }}>
                  {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </div>
                <span className="tag">{r.pelotao}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-dim)" }}>
                  {r.distribuicoes.length} policial(is) com material
                </span>
              </div>
              <span style={{ color: "var(--color-text-faint)" }}>{expandido === r.id ? "▲" : "▼"}</span>
            </button>

            {expandido === r.id && (
              <div style={{ padding: "0 22px 22px" }}>
                <hr className="hairline" style={{ marginBottom: 18 }} />
                <div className="table-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--color-text-faint)", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      <th style={{ paddingBottom: 8 }}>Policial</th>
                      <th style={{ paddingBottom: 8 }}>Matrícula</th>
                      <th style={{ paddingBottom: 8 }}>Horário</th>
                      <th style={{ paddingBottom: 8 }}>Armamento</th>
                      <th style={{ paddingBottom: 8 }}>Carregadores</th>
                      <th style={{ paddingBottom: 8 }}>Munição</th>
                      <th style={{ paddingBottom: 8 }}>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.distribuicoes.map((d, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "8px 0" }}>
                          <strong>{d.nome_guerra}</strong>
                          <div style={{ color: "var(--color-text-faint)", fontSize: 11.5 }}>{d.nome_completo}</div>
                        </td>
                        <td style={{ padding: "8px 0", fontFamily: "var(--font-mono)" }}>{d.matricula}</td>
                        <td style={{ padding: "8px 0" }}>{d.horario}</td>
                        <td style={{ padding: "8px 0" }}>{d.armamento}</td>
                        <td style={{ padding: "8px 0" }}>{d.qtd_carregadores}</td>
                        <td style={{ padding: "8px 0" }}>{d.qtd_municao}</td>
                        <td style={{ padding: "8px 0", color: "var(--color-text-dim)" }}>{d.observacoes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                <hr className="hairline" style={{ margin: "18px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 12.5, color: "var(--color-text-dim)" }}>
                    Responsável pelo preenchimento:{" "}
                    <strong style={{ color: "var(--color-text)" }}>
                      {r.responsavel.nome_guerra} — {r.responsavel.nome_completo} (Mat. {r.responsavel.matricula})
                    </strong>
                  </div>
                  {r.assinatura ? (
                    <img
                      src={r.assinatura}
                      alt="Assinatura digital do responsável"
                      style={{ height: 40, background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid var(--color-line)" }}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>Sem assinatura registrada</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
