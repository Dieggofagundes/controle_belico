import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import { PELOTOES } from "../../types";
import type { Distribuicao, Policial, Responsavel } from "../../types";
import { SignaturePad } from "../../components/SignaturePad";
import { useToast } from "../../context/ToastContext";

function novaLinha(): Distribuicao {
  return {
    policial_id: null,
    nome_completo: "",
    nome_guerra: "",
    matricula: "",
    horario: "",
    armamento: "",
    qtd_carregadores: "",
    qtd_municao: "",
    observacoes: "",
  };
}

function responsavelVazio(): Responsavel {
  return { policial_id: null, nome_completo: "", nome_guerra: "", matricula: "" };
}

export function FormularioServico() {
  const { notify } = useToast();
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [carregandoPoliciais, setCarregandoPoliciais] = useState(true);

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [pelotao, setPelotao] = useState<string>(PELOTOES[0]);
  const [linhas, setLinhas] = useState<Distribuicao[]>([novaLinha()]);
  const [responsavel, setResponsavel] = useState<Responsavel>(responsavelVazio());
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .listarPoliciais()
      .then(setPoliciais)
      .catch(() => notify("Não foi possível carregar o cadastro de policiais.", "error"))
      .finally(() => setCarregandoPoliciais(false));
  }, []);

  function atualizarLinha(index: number, patch: Partial<Distribuicao>) {
    setLinhas((prev) => prev.map((linha, i) => (i === index ? { ...linha, ...patch } : linha)));
  }

  function selecionarPolicialNaLinha(index: number, policialId: string) {
    if (!policialId) {
      atualizarLinha(index, { policial_id: null, nome_completo: "", nome_guerra: "", matricula: "" });
      return;
    }
    const p = policiais.find((x) => x.id === Number(policialId));
    if (!p) return;
    atualizarLinha(index, {
      policial_id: p.id,
      nome_completo: p.nome_completo,
      nome_guerra: p.nome_guerra,
      matricula: p.matricula,
    });
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, novaLinha()]);
  }

  function removerLinha(index: number) {
    setLinhas((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function selecionarResponsavel(policialId: string) {
    if (!policialId) {
      setResponsavel(responsavelVazio());
      return;
    }
    const p = policiais.find((x) => x.id === Number(policialId));
    if (!p) return;
    setResponsavel({ policial_id: p.id, nome_completo: p.nome_completo, nome_guerra: p.nome_guerra, matricula: p.matricula });
  }

  function validar(): string | null {
    if (!data) return "Informe a data do serviço.";
    if (!pelotao) return "Selecione o pelotão assumindo o serviço.";
    for (const [i, l] of linhas.entries()) {
      if (!l.policial_id) return `Selecione o policial na linha ${i + 1} da distribuição.`;
      if (!l.horario) return `Informe o horário da carga na linha ${i + 1}.`;
      if (!l.armamento.trim()) return `Informe o armamento na linha ${i + 1}.`;
    }
    if (!responsavel.policial_id) return "Selecione o responsável pelo preenchimento.";
    if (!assinatura) return "Confirme a assinatura digital do responsável antes de enviar.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erro = validar();
    if (erro) {
      notify(erro, "error");
      return;
    }
    setEnviando(true);
    try {
      await api.criarRelatorio({
        data,
        pelotao,
        distribuicoes: linhas,
        responsavel,
        assinatura,
      });
      notify("Relatório salvo e enviado à Sala de Meios com sucesso.", "success");
      setLinhas([novaLinha()]);
      setResponsavel(responsavelVazio());
      setAssinatura(null);
      setPelotao(PELOTOES[0]);
      setData(new Date().toISOString().slice(0, 10));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Erro ao enviar o relatório.", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <p className="eyebrow">PELOTÃO DE SERVIÇO</p>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Cautela de Armamento e Material Bélico</h1>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* A) Cabeçalho */}
        <section className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }} className="eyebrow">
            A · CABEÇALHO DO SERVIÇO
          </h3>
          <div className="field-inline-header">
            <div className="field" style={{ width: 220 }}>
              <label>Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="field" style={{ width: 260 }}>
              <label>Pelotão Assumindo</label>
              <select value={pelotao} onChange={(e) => setPelotao(e.target.value)} required>
                {PELOTOES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* B) Distribuição de Armamento */}
        <section className="panel" style={{ padding: 24 }}>
          <div className="list-toolbar" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14 }} className="eyebrow">
              B · DISTRIBUIÇÃO DE ARMAMENTO
            </h3>
            <button type="button" className="btn btn-primary" onClick={adicionarLinha}>
              [ + ] Adicionar Policial
            </button>
          </div>

          {carregandoPoliciais ? (
            <p style={{ fontSize: 13, color: "var(--color-text-dim)" }}>Carregando cadastro de policiais...</p>
          ) : policiais.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-dim)" }}>
              Nenhum policial cadastrado pelo Administrador ainda. Solicite o cadastro antes de preencher este formulário.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {linhas.map((linha, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-sm)",
                    padding: 18,
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="tag">Linha {i + 1}</span>
                    {linhas.length > 1 && (
                      <button type="button" className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removerLinha(i)}>
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid-linha-topo" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Policial</label>
                      <select
                        value={linha.policial_id ?? ""}
                        onChange={(e) => selecionarPolicialNaLinha(i, e.target.value)}
                        required
                      >
                        <option value="">Selecione o policial...</option>
                        {policiais.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome_guerra} — {p.nome_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Horário da Carga Material</label>
                      <input type="time" value={linha.horario} onChange={(e) => atualizarLinha(i, { horario: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid-form-2" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Nome Completo</label>
                      <input value={linha.nome_completo} readOnly placeholder="Preenchido automaticamente" />
                    </div>
                    <div className="field">
                      <label>Matrícula</label>
                      <input value={linha.matricula} readOnly placeholder="Preenchido automaticamente" style={{ fontFamily: "var(--font-mono)" }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", fontWeight: 600 }}>
                      Material Bélico
                    </label>
                  </div>
                  <div className="grid-form-3" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Armamento</label>
                      <input
                        value={linha.armamento}
                        onChange={(e) => atualizarLinha(i, { armamento: e.target.value })}
                        placeholder="Ex: Pistola, Fuzil"
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Qtd. Carregadores</label>
                      <input
                        value={linha.qtd_carregadores}
                        onChange={(e) => atualizarLinha(i, { qtd_carregadores: e.target.value })}
                        placeholder="Ex: 2"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="field">
                      <label>Qtd. Munição</label>
                      <input
                        value={linha.qtd_municao}
                        onChange={(e) => atualizarLinha(i, { qtd_municao: e.target.value })}
                        placeholder="Ex: 45"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Observações</label>
                    <textarea
                      value={linha.observacoes}
                      onChange={(e) => atualizarLinha(i, { observacoes: e.target.value })}
                      placeholder="Anotações rápidas sobre esta cautela..."
                      rows={2}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* C) Fechamento e Assinatura */}
        <section className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }} className="eyebrow">
            C · FECHAMENTO E ASSINATURA
          </h3>

          <div className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
            <label>Responsável pelo Preenchimento (Sala de Meios)</label>
            <select value={responsavel.policial_id ?? ""} onChange={(e) => selecionarResponsavel(e.target.value)} required>
              <option value="">Selecione o responsável...</option>
              {policiais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_guerra} — {p.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {responsavel.policial_id && (
            <div className="grid-form-2" style={{ marginBottom: 20, maxWidth: 420 }}>
              <div className="field">
                <label>Nome Completo</label>
                <input value={responsavel.nome_completo} readOnly />
              </div>
              <div className="field">
                <label>Matrícula</label>
                <input value={responsavel.matricula} readOnly style={{ fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
          )}

          <div style={{ maxWidth: 500 }}>
            <SignaturePad
              confirmed={!!assinatura}
              onConfirm={(dataUrl) => setAssinatura(dataUrl)}
              onClear={() => setAssinatura(null)}
            />
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: 14 }} disabled={enviando}>
            {enviando ? "Enviando..." : "Salvar e Enviar Relatório"}
          </button>
        </div>
      </form>
    </div>
  );
}
