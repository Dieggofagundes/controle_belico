import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import { PELOTOES, MODELOS_ARMAMENTO, ACESSORIOS_PADRAO, ITENS_MATERIAL_VIATURA, ITENS_MUNICAO_ESPECIAL, ITENS_COM_NUMERO } from "../../types";
import type { Distribuicao, Policial, Responsavel, ItemMaterial, Devolucao } from "../../types";
import { SignaturePad } from "../../components/SignaturePad";
import { useToast } from "../../context/ToastContext";

function novaLinha(): Distribuicao {
  return {
    policial_id: null,
    nome_completo: "",
    nome_guerra: "",
    matricula: "",
    horario: "",
    graduacao: "",
    armamento: "",
    numero_arma: "",
    qtd_carregadores: "",
    qtd_municao: "",
    acessorios: ACESSORIOS_PADRAO.map((nome) => ({ nome, numero_ok: "" })),
    fotos_armamento: [null, null],
    observacoes: "",
  };
}

function responsavelVazio(): Responsavel {
  return { policial_id: null, nome_completo: "", nome_guerra: "", matricula: "" };
}

function itensGeralVazio(): ItemMaterial[] {
  return ITENS_MATERIAL_VIATURA.map((descricao) => ({ descricao, quantidade: "" }));
}

function itensMunicaoVazio(): ItemMaterial[] {
  return ITENS_MUNICAO_ESPECIAL.map((descricao) => ({ descricao, quantidade: "" }));
}

function devolucaoVazia(): Devolucao {
  return { data: "", comAlteracao: false, observacao: "", local: "" };
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
  const [comandante, setComandante] = useState<Responsavel>(responsavelVazio());
  const [assinaturaComandante, setAssinaturaComandante] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [itensGeral, setItensGeral] = useState<ItemMaterial[]>(itensGeralVazio());
  const [itensMunicao, setItensMunicao] = useState<ItemMaterial[]>(itensMunicaoVazio());
  const [observacoesItens, setObservacoesItens] = useState("");

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

  function selecionarComandante(policialId: string) {
    if (!policialId) {
      setComandante(responsavelVazio());
      return;
    }
    const p = policiais.find((x) => x.id === Number(policialId));
    if (!p) return;
    setComandante({ policial_id: p.id, nome_completo: p.nome_completo, nome_guerra: p.nome_guerra, matricula: p.matricula });
  }

  function atualizarItemGeral(index: number, quantidade: string) {
    setItensGeral((prev) => prev.map((item, i) => (i === index ? { ...item, quantidade } : item)));
  }

  function atualizarNumeroItemGeral(index: number, numero: string) {
    setItensGeral((prev) => prev.map((item, i) => (i === index ? { ...item, numero } : item)));
  }

  function atualizarItemMunicao(index: number, quantidade: string) {
    setItensMunicao((prev) => prev.map((item, i) => (i === index ? { ...item, quantidade } : item)));
  }

  function atualizarAcessorio(linhaIndex: number, acessorioIndex: number, numero_ok: string) {
    setLinhas((prev) =>
      prev.map((linha, i) =>
        i === linhaIndex
          ? { ...linha, acessorios: linha.acessorios.map((a, j) => (j === acessorioIndex ? { ...a, numero_ok } : a)) }
          : linha
      )
    );
  }

  function handleFotoChange(index: number, slot: number, file: File | null) {
    if (!file) {
      setLinhas((prev) =>
        prev.map((linha, i) =>
          i === index
            ? { ...linha, fotos_armamento: linha.fotos_armamento.map((f, s) => (s === slot ? null : f)) }
            : linha
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLinhas((prev) =>
        prev.map((linha, i) =>
          i === index
            ? { ...linha, fotos_armamento: linha.fotos_armamento.map((f, s) => (s === slot ? dataUrl : f)) }
            : linha
        )
      );
    };
    reader.readAsDataURL(file);
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
    if (!comandante.policial_id) return "Selecione o Comandante de Pelotão.";
    if (!assinaturaComandante) return "Confirme a assinatura digital do Comandante de Pelotão antes de enviar.";
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
        itens_viatura: { geral: itensGeral, municaoEspecial: itensMunicao, observacoesGerais: observacoesItens },
        devolucao: devolucaoVazia(),
        comandante,
        assinatura_comandante: assinaturaComandante,
      });
      notify("Relatório salvo e enviado à Sala de Meios com sucesso.", "success");
      setLinhas([novaLinha()]);
      setResponsavel(responsavelVazio());
      setAssinatura(null);
      setComandante(responsavelVazio());
      setAssinaturaComandante(null);
      setPelotao(PELOTOES[0]);
      setData(new Date().toISOString().slice(0, 10));
      setItensGeral(itensGeralVazio());
      setItensMunicao(itensMunicaoVazio());
      setObservacoesItens("");
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
        <datalist id="modelos-armamento">
          {MODELOS_ARMAMENTO.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        {/* M) Material da Viatura/Bélico */}
        <section className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }} className="eyebrow">
            M · CAUTELA DO MATERIAL DA VIATURA/BÉLICO
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {itensGeral.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--color-line)", padding: "6px 0" }}>
                <span style={{ flex: 1, fontSize: 13 }}>{item.descricao}</span>
                {ITENS_COM_NUMERO.includes(item.descricao) && (
                  <input
                    value={item.numero ?? ""}
                    onChange={(e) => atualizarNumeroItemGeral(i, e.target.value)}
                    placeholder="Número"
                    style={{ width: 110 }}
                  />
                )}
                <input
                  value={item.quantidade}
                  onChange={(e) => atualizarItemGeral(i, e.target.value)}
                  placeholder="Qtd."
                  style={{ width: 90 }}
                  inputMode="numeric"
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, marginBottom: 10 }}>
            <label style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", fontWeight: 600 }}>
              Item 26 · Munição Especial
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {itensMunicao.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12 }}>{item.descricao}</span>
                <input
                  value={item.quantidade}
                  onChange={(e) => atualizarItemMunicao(i, e.target.value)}
                  placeholder="Qtd."
                  style={{ width: 70 }}
                  inputMode="numeric"
                />
              </div>
            ))}
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label>Observações Gerais</label>
            <textarea
              value={observacoesItens}
              onChange={(e) => setObservacoesItens(e.target.value)}
              placeholder="Observações sobre o material da viatura..."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
        </section>

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
                    <div className="field">
                      <label>G/H</label>
                      <input
                        value={linha.graduacao}
                        onChange={(e) => atualizarLinha(i, { graduacao: e.target.value })}
                        placeholder="Graduação/Hierarquia"
                      />
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
                      <label>Modelo do Armamento</label>
                      <input
                        value={linha.armamento}
                        onChange={(e) => atualizarLinha(i, { armamento: e.target.value })}
                        placeholder="Ex: Carabina IWI ARAD - CAL. 5,56"
                        list="modelos-armamento"
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Número da Arma</label>
                      <input
                        value={linha.numero_arma}
                        onChange={(e) => atualizarLinha(i, { numero_arma: e.target.value })}
                        placeholder="Nº de série"
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
                  </div>
                  <div className="grid-form-3" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Qtd. Munição</label>
                      <input
                        value={linha.qtd_municao}
                        onChange={(e) => atualizarLinha(i, { qtd_municao: e.target.value })}
                        placeholder="Ex: 45"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="field">
                      <label>Foto do Armamento (1)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFotoChange(i, 0, e.target.files ? e.target.files[0] : null)}
                      />
                    </div>
                    <div className="field">
                      <label>Foto do Armamento (2)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFotoChange(i, 1, e.target.files ? e.target.files[0] : null)}
                      />
                    </div>
                  </div>

                  {(linha.fotos_armamento[0] || linha.fotos_armamento[1]) && (
                    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {linha.fotos_armamento.map((foto, fi) =>
                        foto ? (
                          <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={foto} alt={`Foto do armamento ${fi + 1}`} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 6, border: "1px solid var(--color-line)" }} />
                            <button type="button" className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => handleFotoChange(i, fi, null)}>
                              Remover foto {fi + 1}
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", fontWeight: 600 }}>
                      Acessórios
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
                    {linha.acessorios.map((acessorio, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ flex: 1, fontSize: 12 }}>{acessorio.nome}</span>
                        <input
                          value={acessorio.numero_ok}
                          onChange={(e) => atualizarAcessorio(i, j, e.target.value)}
                          placeholder="Número/OK"
                          style={{ width: 110 }}
                        />
                      </div>
                    ))}
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

          <div className="grid-two-panels">
            <div>
              <div className="field" style={{ marginBottom: 16 }}>
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
                <div className="grid-form-2" style={{ marginBottom: 20 }}>
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

              <SignaturePad
                confirmed={!!assinatura}
                onConfirm={(dataUrl) => setAssinatura(dataUrl)}
                onClear={() => setAssinatura(null)}
                label="Assinatura Digital do Responsável"
              />
            </div>

            <div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Comandante de Pelotão</label>
                <select value={comandante.policial_id ?? ""} onChange={(e) => selecionarComandante(e.target.value)} required>
                  <option value="">Selecione o Comandante de Pelotão...</option>
                  {policiais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome_guerra} — {p.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              {comandante.policial_id && (
                <div className="grid-form-2" style={{ marginBottom: 20 }}>
                  <div className="field">
                    <label>Nome Completo</label>
                    <input value={comandante.nome_completo} readOnly />
                  </div>
                  <div className="field">
                    <label>Matrícula</label>
                    <input value={comandante.matricula} readOnly style={{ fontFamily: "var(--font-mono)" }} />
                  </div>
                </div>
              )}

              <SignaturePad
                confirmed={!!assinaturaComandante}
                onConfirm={(dataUrl) => setAssinaturaComandante(dataUrl)}
                onClear={() => setAssinaturaComandante(null)}
                label="Assinatura Digital do Comandante de Pelotão"
              />
            </div>
          </div>
        </section>

        <div className="panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="eyebrow" style={{ color: "var(--color-text-faint)" }}>
            D · DEVOLUÇÃO PARA A SALA DE MEIOS
          </span>
          <span style={{ fontSize: 12.5, color: "var(--color-text-dim)" }}>
            Esta etapa será concluída pelo Administrador (Sala de Meios) no momento da finalização da cautela.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: 14 }} disabled={enviando}>
            {enviando ? "Enviando..." : "Salvar e Enviar Relatório"}
          </button>
        </div>
      </form>
    </div>
  );
}
