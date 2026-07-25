import type { Relatorio } from "../types";

function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

const th: React.CSSProperties = {
  border: "1px solid #000",
  padding: "5px 6px",
  fontSize: 10.5,
  textAlign: "left",
  background: "#e7e7e7",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const td: React.CSSProperties = {
  border: "1px solid #000",
  padding: "5px 6px",
  fontSize: 11.5,
  verticalAlign: "top",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  background: "#d9d9d9",
  border: "1px solid #000",
  borderBottom: "none",
  padding: "6px 8px",
};

interface Props {
  relatorio: Relatorio;
}

export function RelatorioDocumento({ relatorio: r }: Props) {
  return (
    <div
      id="relatorio-documento"
      style={{
        background: "#fff",
        color: "#111",
        fontFamily: "Arial, Helvetica, sans-serif",
        width: 794,
        margin: "0 auto",
        padding: 28,
        boxSizing: "border-box",
      }}
    >
      <img src="/relatorio-cabecalho.png" alt="Cabeçalho" style={{ width: "100%", display: "block", marginBottom: 18 }} />

      <h2 style={{ textAlign: "center", fontSize: 15, margin: "0 0 18px", letterSpacing: "0.03em" }}>
        RELATÓRIO DE CAUTELA DE ARMAMENTO E MATERIAL BÉLICO
      </h2>

      <div style={sectionTitle}>A · Cabeçalho do Serviço</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={td}><strong>Data:</strong> {formatarData(r.data)}</td>
            <td style={td}><strong>Pelotão assumindo o serviço:</strong> {r.pelotao}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionTitle}>B · Distribuição de Armamento</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>Policial</th>
            <th style={th}>Matrícula</th>
            <th style={th}>Horário</th>
            <th style={th}>Armamento</th>
            <th style={th}>Nº Arma</th>
            <th style={th}>Carreg.</th>
            <th style={th}>Munição</th>
            <th style={th}>Observações</th>
          </tr>
        </thead>
        <tbody>
          {r.distribuicoes.map((d, i) => (
            <tr key={i}>
              <td style={td}>
                {d.nome_guerra}
                <div style={{ fontSize: 10, color: "#444" }}>{d.nome_completo}</div>
              </td>
              <td style={td}>{d.matricula}</td>
              <td style={td}>{d.horario}</td>
              <td style={td}>{d.armamento}</td>
              <td style={td}>{d.numero_arma || "—"}</td>
              <td style={td}>{d.qtd_carregadores || "—"}</td>
              <td style={td}>{d.qtd_municao || "—"}</td>
              <td style={td}>{d.observacoes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={sectionTitle}>M · Cautela do Material da Viatura/Bélico</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
        <thead>
          <tr>
            <th style={th}>Item</th>
            <th style={th}>Número</th>
            <th style={th}>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {r.itens_viatura?.geral
            ?.filter((item) => item.quantidade || item.numero)
            .map((item, i) => (
              <tr key={i}>
                <td style={td}>{item.descricao}</td>
                <td style={td}>{item.numero || "—"}</td>
                <td style={td}>{item.quantidade || "—"}</td>
              </tr>
            ))}
          {(!r.itens_viatura?.geral || r.itens_viatura.geral.every((item) => !item.quantidade && !item.numero)) && (
            <tr>
              <td style={td} colSpan={3}>Nenhum item informado.</td>
            </tr>
          )}
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>Munição Especial</th>
            <th style={th}>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {r.itens_viatura?.municaoEspecial
            ?.filter((item) => item.quantidade)
            .map((item, i) => (
              <tr key={i}>
                <td style={td}>{item.descricao}</td>
                <td style={td}>{item.quantidade}</td>
              </tr>
            ))}
          {(!r.itens_viatura?.municaoEspecial || r.itens_viatura.municaoEspecial.every((item) => !item.quantidade)) && (
            <tr>
              <td style={td} colSpan={2}>Nenhuma munição especial informada.</td>
            </tr>
          )}
        </tbody>
      </table>

      {r.itens_viatura?.observacoesGerais && (
        <div style={{ fontSize: 11.5, marginBottom: 16 }}>
          <strong>Observações gerais do material:</strong> {r.itens_viatura.observacoesGerais}
        </div>
      )}

      <div style={sectionTitle}>D · Devolução para a Sala de Meios</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={td}><strong>Data da devolução:</strong> {formatarData(r.devolucao?.data)}</td>
            <td style={td}><strong>Situação:</strong> {r.devolucao?.comAlteracao ? "Com alteração" : "Sem alteração"}</td>
            <td style={td}><strong>Local:</strong> {r.devolucao?.local || "—"}</td>
          </tr>
          {r.devolucao?.comAlteracao && (
            <tr>
              <td style={td} colSpan={3}>
                <strong>Observação da alteração:</strong> {r.devolucao?.observacao || "—"}
              </td>
            </tr>
          )}
          <tr>
            <td style={td} colSpan={3}>
              <strong>Status:</strong> {r.finalizado ? `Finalizado em ${formatarDataHora(r.finalizado_em)}` : "Aguardando finalização pela Sala de Meios"}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40 }}>
        <div style={{ textAlign: "center" }}>
          {r.assinatura ? (
            <img src={r.assinatura} alt="Assinatura do responsável" style={{ height: 60, maxWidth: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ height: 60 }} />
          )}
          <div style={{ borderTop: "1px solid #000", marginTop: 4, paddingTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {r.responsavel?.nome_guerra} — {r.responsavel?.nome_completo}
            </div>
            <div style={{ fontSize: 10.5, color: "#444" }}>Mat. {r.responsavel?.matricula}</div>
            <div style={{ fontSize: 10.5, marginTop: 2 }}>Policial Responsável pelo Preenchimento</div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          {r.assinatura_comandante ? (
            <img src={r.assinatura_comandante} alt="Assinatura do Comandante de Pelotão" style={{ height: 60, maxWidth: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ height: 60 }} />
          )}
          <div style={{ borderTop: "1px solid #000", marginTop: 4, paddingTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {r.comandante?.nome_guerra} — {r.comandante?.nome_completo}
            </div>
            <div style={{ fontSize: 10.5, color: "#444" }}>Mat. {r.comandante?.matricula}</div>
            <div style={{ fontSize: 10.5, marginTop: 2 }}>Comandante de Pelotão</div>
          </div>
        </div>

        <div style={{ textAlign: "center", gridColumn: "1 / span 2", marginTop: 20 }}>
          {r.assinatura_sala_meios ? (
            <img src={r.assinatura_sala_meios} alt="Assinatura do Responsável da Sala de Meios" style={{ height: 60, maxWidth: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ height: 60 }} />
          )}
          <div style={{ borderTop: "1px solid #000", marginTop: 4, paddingTop: 6, display: "inline-block", minWidth: 260 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{r.responsavel_sala_meios?.nome || "—"}</div>
            <div style={{ fontSize: 10.5, marginTop: 2 }}>Responsável da Sala de Meios</div>
          </div>
        </div>
      </div>
    </div>
  );
}
