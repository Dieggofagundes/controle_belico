import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { Relatorio, Distribuicao, ItemMaterial, ChecklistViatura, Devolucao } from "../../types";
import { PELOTOES, ITENS_COM_NUMERO } from "../../types";
import { SignaturePad } from "../../components/SignaturePad";
import { RelatorioDocumento } from "../../components/RelatorioDocumento";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function devolucaoEditVazia(): Devolucao {
  return { data: new Date().toISOString().slice(0, 10), comAlteracao: false, observacao: "", local: "" };
}

export function Relatorios() {
  const { auth } = useAuth();
  const { notify } = useToast();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroPelotao, setFiltroPelotao] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  const [finalizando, setFinalizando] = useState<number | null>(null);
  const [distEdit, setDistEdit] = useState<Distribuicao[]>([]);
  const [itensEdit, setItensEdit] = useState<ChecklistViatura | null>(null);
  const [devolucaoEdit, setDevolucaoEdit] = useState<Devolucao>(devolucaoEditVazia());
  const [nomeSalaMeios, setNomeSalaMeios] = useState("");
  const [assinaturaSalaMeios, setAssinaturaSalaMeios] = useState<string | null>(null);
  const [salvandoFinal, setSalvandoFinal] = useState(false);

  const [documentoAtivo, setDocumentoAtivo] = useState<Relatorio | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  function carregar() {
    setLoading(true);
    api
    .listarRelatorios({ data: filtroData || undefined, dataInicio: filtroDataInicio || undefined, dataFim: filtroDataFim || undefined, pelotao: filtroPelotao || undefined })
                        .then(setRelatorios)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [filtroData, filtroDataInicio, filtroDataFim, filtroPelotao]);

  function abrirFinalizacao(r: Relatorio) {
    setExpandido(r.id);
    setFinalizando(r.id);
    setDistEdit(r.distribuicoes.map((d) => ({ ...d })));
    setItensEdit(r.itens_viatura ? JSON.parse(JSON.stringify(r.itens_viatura)) : null);
    setDevolucaoEdit(
      r.devolucao && r.devolucao.data ? { ...r.devolucao, observacao: r.devolucao.observacao || "" } : devolucaoEditVazia()
    );
    setNomeSalaMeios(r.responsavel_sala_meios?.nome || auth?.nome || "");
    setAssinaturaSalaMeios(null);
  }

  function cancelarFinalizacao() {
    setFinalizando(null);
  }

  function atualizarDistEdit(index: number, patch: Partial<Distribuicao>) {
    setDistEdit((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function atualizarItemGeralEdit(index: number, patch: Partial<ItemMaterial>) {
    setItensEdit((prev) => (prev ? { ...prev, geral: prev.geral.map((it, i) => (i === index ? { ...it, ...patch } : it)) } : prev));
  }

  function atualizarItemMunicaoEdit(index: number, quantidade: string) {
    setItensEdit((prev) =>
      prev ? { ...prev, municaoEspecial: prev.municaoEspecial.map((it, i) => (i === index ? { ...it, quantidade } : it)) } : prev
    );
  }

  async function salvarFinalizacao(r: Relatorio) {
    if (!devolucaoEdit.data) {
      notify("Informe a data da devolução.", "error");
      return;
    }
    if (devolucaoEdit.comAlteracao && !devolucaoEdit.observacao.trim()) {
      notify("Descreva a observação da alteração constatada.", "error");
      return;
    }
    if (!nomeSalaMeios.trim()) {
      notify("Informe o nome do responsável da Sala de Meios.", "error");
      return;
    }
    if (!assinaturaSalaMeios) {
      notify("Confirme a assinatura digital do responsável da Sala de Meios.", "error");
      return;
    }
    setSalvandoFinal(true);
    try {
      const atualizado = await api.finalizarRelatorio({
        id: r.id,
        distribuicoes: distEdit,
        responsavel: r.responsavel,
        itens_viatura: itensEdit || r.itens_viatura,
        devolucao: devolucaoEdit,
        responsavel_sala_meios: { nome: nomeSalaMeios.trim() },
        assinatura_sala_meios: assinaturaSalaMeios,
      });
      setRelatorios((prev) => prev.map((x) => (x.id === r.id ? atualizado : x)));
      notify("Cautela finalizada com sucesso.", "success");
      setFinalizando(null);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Erro ao finalizar a cautela.", "error");
    } finally {
      setSalvandoFinal(false);
    }
  }

  async function baixarPdf() {
    if (!docRef.current || !documentoAtivo) return;
    setGerandoPdf(true);
    try {
      const canvas = await html2canvas(docRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const nomeArquivo = `cautela-${documentoAtivo.data}-${documentoAtivo.pelotao}.pdf`.replace(/[^a-zA-Z0-9.-]+/g, "_");
      pdf.save(nomeArquivo);
      notify("PDF gerado com sucesso.", "success");
    } catch (err) {
      notify("Erro ao gerar o PDF.", "error");
    } finally {
      setGerandoPdf(false);
    }
  }

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
        <div className="field" style={{ width: 170 }}>
          <label>Data Início (Período)</label>
          <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
        </div>
        <div className="field" style={{ width: 170 }}>
          <label>Data Fim (Período)</label>
          <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
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
        {(filtroData || filtroDataInicio || filtroDataFim || filtroPelotao) && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFiltroData("");
              setFiltroDataInicio("");
              setFiltroDataFim("");
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
                {r.finalizado ? (
                  <span className="tag" style={{ borderColor: "var(--color-success)", color: "var(--color-success)" }}>
                    FINALIZADO
                  </span>
                ) : (
                  <span className="tag" style={{ borderColor: "var(--color-accent-brass-dim)", color: "var(--color-accent-brass)" }}>
                    PENDENTE
                  </span>
                )}
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

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
                  <div style={{ fontSize: 12.5, color: "var(--color-text-dim)" }}>
                    Comandante de Pelotão:{" "}
                    <strong style={{ color: "var(--color-text)" }}>
                      {r.comandante?.nome_guerra} — {r.comandante?.nome_completo} (Mat. {r.comandante?.matricula})
                    </strong>
                  </div>
                  {r.assinatura_comandante ? (
                    <img
                      src={r.assinatura_comandante}
                      alt="Assinatura digital do Comandante de Pelotão"
                      style={{ height: 40, background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid var(--color-line)" }}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>Sem assinatura registrada</span>
                  )}
                </div>

                {r.finalizado && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
                    <div style={{ fontSize: 12.5, color: "var(--color-text-dim)" }}>
                      <strong style={{ color: "var(--color-text)" }}>SALA DE MEIOS</strong>
                      <div style={{ fontSize: 11.5 }}>Finalizado em {new Date(r.finalizado_em || "").toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                  {!r.finalizado && finalizando !== r.id && (
                    <button className="btn btn-primary" onClick={() => abrirFinalizacao(r)}>
                      Finalizar Cautela
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => setDocumentoAtivo(r)}>
                    Visualizar / Gerar PDF
                  </button>
                </div>

                {finalizando === r.id && (
                  <div className="panel" style={{ padding: 18, marginTop: 18, background: "rgba(0,0,0,0.2)" }}>
                    <h4 className="eyebrow" style={{ marginBottom: 14 }}>
                      D · Finalizar Devolução para a Sala de Meios
                    </h4>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", fontWeight: 600, display: "block", marginBottom: 8 }}>
                        Conferência da Distribuição (altere se necessário)
                      </label>
                      <div className="table-scroll">
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>
                          <thead>
                            <tr style={{ textAlign: "left", color: "var(--color-text-faint)", fontSize: 10.5, textTransform: "uppercase" }}>
                              <th style={{ paddingBottom: 6 }}>Policial</th>
                              <th style={{ paddingBottom: 6 }}>Armamento</th>
                              <th style={{ paddingBottom: 6 }}>Nº Arma</th>
                              <th style={{ paddingBottom: 6 }}>Carreg.</th>
                              <th style={{ paddingBottom: 6 }}>Munição</th>
                              <th style={{ paddingBottom: 6 }}>Observações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {distEdit.map((d, i) => (
                              <tr key={i} style={{ borderTop: "1px solid var(--color-line)" }}>
                                <td style={{ padding: "6px 4px" }}>{d.nome_guerra}</td>
                                <td style={{ padding: "6px 4px" }}>
                                  <input value={d.armamento} onChange={(e) => atualizarDistEdit(i, { armamento: e.target.value })} style={{ width: 180 }} />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <input value={d.numero_arma} onChange={(e) => atualizarDistEdit(i, { numero_arma: e.target.value })} style={{ width: 90 }} />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <input value={d.qtd_carregadores} onChange={(e) => atualizarDistEdit(i, { qtd_carregadores: e.target.value })} style={{ width: 60 }} />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <input value={d.qtd_municao} onChange={(e) => atualizarDistEdit(i, { qtd_municao: e.target.value })} style={{ width: 60 }} />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <input value={d.observacoes} onChange={(e) => atualizarDistEdit(i, { observacoes: e.target.value })} style={{ width: 200 }} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {itensEdit && (
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", fontWeight: 600, display: "block", marginBottom: 8 }}>
                          Conferência do Material da Viatura/Bélico
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          {itensEdit.geral.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-line)", padding: "4px 0" }}>
                              <span style={{ flex: 1, fontSize: 12.5 }}>{item.descricao}</span>
                              {ITENS_COM_NUMERO.includes(item.descricao) && (
                                <input value={item.numero ?? ""} onChange={(e) => atualizarItemGeralEdit(i, { numero: e.target.value })} placeholder="Número" style={{ width: 100 }} />
                              )}
                              <input value={item.quantidade} onChange={(e) => atualizarItemGeralEdit(i, { quantidade: e.target.value })} placeholder="Qtd." style={{ width: 80 }} inputMode="numeric" />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                          {itensEdit.municaoEspecial.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ flex: 1, fontSize: 11.5 }}>{item.descricao}</span>
                              <input value={item.quantidade} onChange={(e) => atualizarItemMunicaoEdit(i, e.target.value)} placeholder="Qtd." style={{ width: 65 }} inputMode="numeric" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="field-inline-header" style={{ marginBottom: 16 }}>
                      <div className="field" style={{ width: 220 }}>
                        <label>Data da Devolução</label>
                        <input type="date" value={devolucaoEdit.data} onChange={(e) => setDevolucaoEdit({ ...devolucaoEdit, data: e.target.value })} />
                      </div>
                      <div className="field" style={{ width: 260 }}>
                        <label>Situação</label>
                        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            <input type="radio" checked={!devolucaoEdit.comAlteracao} onChange={() => setDevolucaoEdit({ ...devolucaoEdit, comAlteracao: false })} />
                            Sem alteração
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            <input type="radio" checked={devolucaoEdit.comAlteracao} onChange={() => setDevolucaoEdit({ ...devolucaoEdit, comAlteracao: true })} />
                            Com alteração
                          </label>
                        </div>
                      </div>
                      <div className="field" style={{ width: 220 }}>
                        <label>Local</label>
                        <input value={devolucaoEdit.local} onChange={(e) => setDevolucaoEdit({ ...devolucaoEdit, local: e.target.value })} />
                      </div>
                    </div>

                    {devolucaoEdit.comAlteracao && (
                      <div className="field" style={{ marginBottom: 16, maxWidth: 600 }}>
                        <label>Observação da Alteração</label>
                        <textarea
                          rows={3}
                          value={devolucaoEdit.observacao}
                          onChange={(e) => setDevolucaoEdit({ ...devolucaoEdit, observacao: e.target.value })}
                          placeholder="Descreva o que foi constatado/alterado na devolução..."
                          style={{ resize: "vertical" }}
                        />
                      </div>
                    )}

                    <div className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
                      <label>Responsável da Sala de Meios</label>
                      <input value={nomeSalaMeios} onChange={(e) => setNomeSalaMeios(e.target.value)} placeholder="Nome do responsável" />
                    </div>

                    <div style={{ maxWidth: 500, marginBottom: 16 }}>
                      <SignaturePad
                        confirmed={!!assinaturaSalaMeios}
                        onConfirm={(dataUrl) => setAssinaturaSalaMeios(dataUrl)}
                        onClear={() => setAssinaturaSalaMeios(null)}
                        label="Assinatura Digital do Responsável da Sala de Meios"
                      />
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={cancelarFinalizacao} disabled={salvandoFinal}>
                        Cancelar
                      </button>
                      <button className="btn btn-primary" onClick={() => salvarFinalizacao(r)} disabled={salvandoFinal}>
                        {salvandoFinal ? "Salvando..." : "Confirmar Finalização"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {documentoAtivo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 24,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={baixarPdf} disabled={gerandoPdf}>
              {gerandoPdf ? "Gerando PDF..." : "Baixar PDF"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDocumentoAtivo(null)}>
              Fechar
            </button>
          </div>
          <div ref={docRef} style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <RelatorioDocumento relatorio={documentoAtivo} />
          </div>
        </div>
      )}
    </div>
  );
}
