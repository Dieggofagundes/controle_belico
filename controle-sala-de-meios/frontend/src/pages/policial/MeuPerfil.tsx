import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../api/client";
import { Emblem } from "../../components/Emblem";
import { SignaturePad } from "../../components/SignaturePad";
import { RelatorioDocumento } from "../../components/RelatorioDocumento";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Policial, Relatorio, Devolucao, Responsavel } from "../../types";

const e = React.createElement;

function devolucaoVazia(): Devolucao {
	  return { data: new Date().toISOString().slice(0, 10), comAlteracao: false, observacao: "", local: "" };
}

function responsavelVazio(): Responsavel {
	  return { policial_id: null, nome_completo: "", nome_guerra: "", matricula: "" };
}

export function MeuPerfil() {
	  const { auth, logout } = useAuth();
	  const { notify } = useToast();
	  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<Policial | null>(null);
	  const [loading, setLoading] = useState(true);
	  const [erro, setErro] = useState<string | null>(null);

  const [telefone, setTelefone] = useState("");
	  const [emailRecuperacao, setEmailRecuperacao] = useState("");
	  const [salvandoContato, setSalvandoContato] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
	  const [confirmarSenha, setConfirmarSenha] = useState("");
	  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [policiais, setPoliciais] = useState<Policial[]>([]);

const [pendencias, setPendencias] = useState<Relatorio[]>([]);
	  const [assinadas, setAssinadas] = useState<Relatorio[]>([]);
	  const [pendenciasSala, setPendenciasSala] = useState<Relatorio[]>([]);
	  const [finalizadasSala, setFinalizadasSala] = useState<Relatorio[]>([]);
	  const [carregandoPendencias, setCarregandoPendencias] = useState(true);

  const [assinandoId, setAssinandoId] = useState<number | null>(null);
	  const [assinaturaComandante, setAssinaturaComandante] = useState<string | null>(null);
	  const [salaSelecionada, setSalaSelecionada] = useState<Responsavel>(responsavelVazio());
	  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
	  const [devolucao, setDevolucao] = useState<Devolucao>(devolucaoVazia());
	  const [assinaturaSala, setAssinaturaSala] = useState<string | null>(null);
	  const [salvandoFinalizacao, setSalvandoFinalizacao] = useState(false);

  const [documentoAtivo, setDocumentoAtivo] = useState<Relatorio | null>(null);
	  const [gerandoPdf, setGerandoPdf] = useState(false);
	  const docRef = useRef<HTMLDivElement>(null);

useEffect(() => {
	    let ativo = true;
	    api
	      .obterMeuPerfil()
	      .then((p) => {
			          if (!ativo) return;
			          setPerfil(p);
			          setTelefone(p?.telefone || "");
			          setEmailRecuperacao(p?.email_recuperacao || "");
		  })
	      .catch(() => ativo && setErro("Nao foi possivel carregar seus dados."))
	      .finally(() => ativo && setLoading(false));
	    return () => {
			      ativo = false;
		};
}, [auth?.matricula]);

  useEffect(() => {
	      api.listarPoliciais().then(setPoliciais).catch(() => {});
  }, []);

function carregarPendencias() {
	    setCarregandoPendencias(true);
	    Promise.all([
			      api.listarPendenciasComandante(),
			      api.listarCautelasComandanteAssinadas(),
			      api.listarPendenciasSalaMeios(),
			      api.listarCautelasSalaMeiosFinalizadas(),
			    ])
	      .then(([pend, assin, pendSala, finSala]) => {
			          setPendencias(pend);
			          setAssinadas(assin);
			          setPendenciasSala(pendSala);
			          setFinalizadasSala(finSala);
		  })
	      .catch(() => {})
	      .finally(() => setCarregandoPendencias(false));
}

  useEffect(() => {
	      carregarPendencias();
  }, []);

async function salvarContato() {
	    setSalvandoContato(true);
	    try {
			      const atualizado = await api.atualizarMeuContato(telefone.trim(), emailRecuperacao.trim());
			      setPerfil(atualizado);
			      notify("Dados de contato atualizados com sucesso.", "success");
		} catch (err) {
			      notify(err instanceof ApiError ? err.message : "Erro ao salvar contato.", "error");
		} finally {
			      setSalvandoContato(false);
		}
}

  async function salvarSenha() {
	      if (!novaSenha || novaSenha.length < 6) {
			        notify("A senha deve ter ao menos 6 caracteres.", "error");
			        return;
		  }
	      if (novaSenha !== confirmarSenha) {
			        notify("As senhas nao coincidem.", "error");
			        return;
		  }
	      setSalvandoSenha(true);
	      try {
			        await api.alterarSenha(novaSenha);
			        notify("Senha alterada com sucesso.", "success");
			        setNovaSenha("");
			        setConfirmarSenha("");
		  } catch (err) {
			        notify(err instanceof ApiError ? err.message : "Erro ao alterar senha.", "error");
		  } finally {
			        setSalvandoSenha(false);
		  }
  }

function abrirAssinatura(id: number) {
	    setAssinandoId(id);
	    setAssinaturaComandante(null);
	    setSalaSelecionada(responsavelVazio());
}

  function selecionarSala(policialId: string) {
	      if (!policialId) {
			        setSalaSelecionada(responsavelVazio());
			        return;
		  }
	      const p = policiais.find((x) => x.id === Number(policialId));
	      if (!p) return;
	      setSalaSelecionada({ policial_id: p.id, nome_completo: p.nome_completo, nome_guerra: p.nome_guerra, matricula: p.matricula });
  }

async function confirmarAssinatura(id: number) {
	    if (!assinaturaComandante) {
			      notify("Confirme sua assinatura digital.", "error");
			      return;
		}
	    if (!salaSelecionada.matricula) {
			      notify("Selecione o responsavel da Sala de Meios que ira finalizar esta cautela.", "error");
			      return;
		}
	    setSalvandoAssinatura(true);
	    try {
			      await api.assinarComoComandante(id, assinaturaComandante, salaSelecionada);
			      notify("Cautela assinada com sucesso. Documento encaminhado para a Sala de Meios.", "success");
			      setAssinandoId(null);
			      setAssinaturaComandante(null);
			      setSalaSelecionada(responsavelVazio());
			      carregarPendencias();
		} catch (err) {
			      notify(err instanceof ApiError ? err.message : "Erro ao assinar.", "error");
		} finally {
			      setSalvandoAssinatura(false);
		}
}

function abrirFinalizacao(item: Relatorio) {
	    setFinalizandoId(item.id);
	    setDevolucao(item.devolucao && item.devolucao.data ? { ...item.devolucao, observacao: item.devolucao.observacao || "" } : devolucaoVazia());
	    setAssinaturaSala(null);
}

  async function confirmarFinalizacao(item: Relatorio) {
	      if (!devolucao.data) {
			        notify("Informe a data da devolucao.", "error");
			        return;
		  }
	      if (devolucao.comAlteracao && !devolucao.observacao.trim()) {
			        notify("Descreva a observacao da alteracao constatada.", "error");
			        return;
		  }
	      if (!assinaturaSala) {
			        notify("Confirme sua assinatura digital.", "error");
			        return;
		  }
	      setSalvandoFinalizacao(true);
	      try {
			        await api.finalizarRelatorio({
						        id: item.id,
						        distribuicoes: item.distribuicoes,
						        responsavel: item.responsavel,
						        itens_viatura: item.itens_viatura,
						        devolucao,
						        responsavel_sala_meios: { nome: auth?.nome || "", matricula: auth?.matricula || "" },
						        assinatura_sala_meios: assinaturaSala,
					});
			        notify("Cautela finalizada com sucesso.", "success");
			        setFinalizandoId(null);
			        carregarPendencias();
		  } catch (err) {
			        notify(err instanceof ApiError ? err.message : "Erro ao finalizar.", "error");
		  } finally {
			        setSalvandoFinalizacao(false);
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

function renderFinalizacaoForm(item: Relatorio) {
	    return e(
			      "div",
			{ style: { marginTop: 14, display: "flex", flexDirection: "column", gap: 12 } },
			      e("div", { className: "field" },
					        e("label", null, "Data da Devolucao"),
					        e("input", { type: "date", value: devolucao.data, onChange: (ev: any) => setDevolucao({ ...devolucao, data: ev.target.value }) })
					      ),
			      e("div", { style: { display: "flex", gap: 16 } },
					        e("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 } },
							            e("input", { type: "radio", checked: !devolucao.comAlteracao, onChange: () => setDevolucao({ ...devolucao, comAlteracao: false }) }),
							            "Sem alteracao"
							          ),
					        e("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 } },
							            e("input", { type: "radio", checked: devolucao.comAlteracao, onChange: () => setDevolucao({ ...devolucao, comAlteracao: true }) }),
							            "Com alteracao"
							          )
					      ),
			      devolucao.comAlteracao ? e("div", { className: "field" },
											         e("label", null, "Observacao da Alteracao"),
											         e("textarea", { rows: 3, value: devolucao.observacao, onChange: (ev: any) => setDevolucao({ ...devolucao, observacao: ev.target.value }) })
											       ) : null,
			      e("div", { className: "field" },
					        e("label", null, "Local"),
					        e("input", { value: devolucao.local, onChange: (ev: any) => setDevolucao({ ...devolucao, local: ev.target.value }) })
					      ),
			      e(SignaturePad, {
					          confirmed: !!assinaturaSala,
					          onConfirm: (dataUrl: string) => setAssinaturaSala(dataUrl),
					          onClear: () => setAssinaturaSala(null),
					          label: "Assinatura Digital do Responsavel da Sala de Meios"
				  }),
			      e("div", { style: { display: "flex", gap: 10 } },
					        e("button", { className: "btn btn-ghost", onClick: () => setFinalizandoId(null), disabled: salvandoFinalizacao }, "Cancelar"),
					        e("button", { className: "btn btn-primary", onClick: () => confirmarFinalizacao(item), disabled: salvandoFinalizacao },
							            salvandoFinalizacao ? "Salvando..." : "Confirmar Finalizacao"
							          )
					      )
			    );
}

function renderPendenciaComandante(item: Relatorio) {
	    const info = e(
			      "div",
			{ style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			      `${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} - ${item.pelotao} - Responsavel: ${item.responsavel.nome_guerra}`
			    );
	    if (assinandoId !== item.id) {
			      return e(
					          "div",
					  { key: `pend-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
					          info,
					          e("button", { className: "btn btn-primary", onClick: () => abrirAssinatura(item.id) }, "Assinar Cautela")
					        );
		}
	    const painel = e(
			      "div",
			{ style: { marginTop: 14 } },
			      e("div", { className: "field", style: { marginBottom: 14 } },
					        e("label", null, "Designar Responsavel da Sala de Meios"),
					        e(
								          "select",
								{ value: salaSelecionada.policial_id ?? "", onChange: (ev: any) => selecionarSala(ev.target.value) },
								          e("option", { value: "" }, "Selecione o policial que ira finalizar esta cautela..."),
								          policiais.map((p) => e("option", { key: p.id, value: p.id }, `${p.nome_guerra} - ${p.nome_completo}`))
								        ),
					        e("p", { style: { fontSize: 12, color: "var(--color-text-dim)", marginTop: 6 } },
							            "O policial selecionado recebera acesso para finalizar, gerar o PDF e salvar esta cautela."
							          )
					      ),
			e(SignaturePad, {
				confirmed: !!assinaturaComandante,
				onConfirm: (dataUrl: string) => setAssinaturaComandante(dataUrl),
				onClear: () => setAssinaturaComandante(null),
				label: "Assinatura Digital do Comandante de Pelotao"
			}),
			e("div", { style: { display: "flex", gap: 10, marginTop: 12 } },
			  e("button", { className: "btn btn-ghost", onClick: () => setAssinandoId(null), disabled: salvandoAssinatura }, "Cancelar"),
			  e("button", { className: "btn btn-primary", onClick: () => confirmarAssinatura(item.id), disabled: salvandoAssinatura },
				salvandoAssinatura ? "Salvando..." : "Confirmar Assinatura"
				)
			  )
			);
	return e(
		"div",
		{ key: `pend-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
		info,
		painel
		);
}

	function renderAssinadaComandante(item: Relatorio) {
		const designado = item.sala_meios_designado;
		const souEuMesmo = designado && perfil && designado.matricula === perfil.matricula;
		const info = e(
			"div",
			{ style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			`${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} - ${item.pelotao} - Responsavel: ${item.responsavel.nome_guerra}`
			);
if (item.finalizado) {
	return e(
		"div",
		{ key: `assin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
		info,
		e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
		  e("span", { style: { fontSize: 13 } }, "Cautela finalizada."),
		  e("button", { className: "btn btn-ghost", onClick: () => setDocumentoAtivo(item) }, "Ver PDF")
		  )
		);
}
		if (designado && !souEuMesmo) {
			
		
			return e(
				"div",
				{ key: `assin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
				info,
				e("p", { style: { fontSize: 13 } }, `Encaminhada para ${designado.nome_guerra} (Sala de Meios) para finalizacao.`)
				);
		}
		if (finalizandoId !== item.id) {
			return e(
				"div",
				{ key: `assin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
				info,
				e("button", { className: "btn btn-primary", onClick: () => abrirFinalizacao(item) }, "Finalizar Cautela")
				);
		}
		return e(
			"div",
			{ key: `assin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
			info,
			renderFinalizacaoForm(item)
			);
	}

	function renderPendenciaSala(item: Relatorio) {
		const info = e(
			"div",
			{ style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			`${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} - ${item.pelotao} - Responsavel: ${item.responsavel.nome_guerra}`
			);
		if (finalizandoId !== item.id) {
			return e(
				"div",
				{ key: `sala-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
				info,
				e("button", { className: "btn btn-primary", onClick: () => abrirFinalizacao(item) }, "Finalizar Cautela")
				);
		}
		return e(
			"div",
			{ key: `sala-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
			info,
			renderFinalizacaoForm(item)
			);
	}

	function renderFinalizadaSala(item: Relatorio) {
		const info = e(
			"div",
			{ style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			`${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} - ${item.pelotao} - Responsavel: ${item.responsavel.nome_guerra}`
			);
		return e(
			"div",
			{ key: `sala-fin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" } },
			info,
			e("button", { className: "btn btn-ghost", onClick: () => setDocumentoAtivo(item) }, "Ver PDF")
			);
	}
	
		

if (loading) {
	return e(
		"div",
		{ className: "login-wrapper", style: { background: "#fff", minHeight: "100vh" } },
		e("div", { className: "login-card panel", style: { textAlign: "center" } }, "Carregando...")
		);
}

return e(
	"div",
	{ className: "login-wrapper", style: { background: "#fff", minHeight: "100vh", padding: "24px 12px" } },
	e(
		"div",
		{ className: "login-card panel", style: { maxWidth: 720, margin: "0 auto" } },
		e(Emblem, null),
		e("h2", { style: { textAlign: "center", marginTop: 12 } }, "Meu Perfil"),
		erro ? e("p", { style: { color: "#c0392b", textAlign: "center" } }, erro) : null,
		!perfil ? e("p", { style: { textAlign: "center" } }, "Nenhum cadastro encontrado.") : null,
		perfil ? e(
			"div",
			{ style: { marginBottom: 20 } },
			e("p", null, e("strong", null, "Nome de Guerra: "), perfil.nome_guerra),
			e("p", null, e("strong", null, "Nome Completo: "), perfil.nome_completo),
			e("p", null, e("strong", null, "Matricula: "), perfil.matricula),
			e("p", null, e("strong", null, "Pelotao: "), perfil.pelotao)
			) : null,
		e(
			"div",
			{ className: "panel", style: { padding: 16, marginBottom: 16 } },
			e("h3", null, "Contato"),
			e("div", { className: "field" },
			  e("label", null, "Telefone"),
			  e("input", { value: telefone, onChange: (ev: any) => setTelefone(ev.target.value) })
			  ),
			e("div", { className: "field" },
			  e("label", null, "Email de Recuperacao"),
			  e("input", { value: emailRecuperacao, onChange: (ev: any) => setEmailRecuperacao(ev.target.value) })
			  ),
			e("button", { className: "btn btn-primary", onClick: salvarContato, disabled: salvandoContato },
			  salvandoContato ? "Salvando..." : "Salvar Contato"
			  )
			),
		e(
			"div",
			{ className: "panel", style: { padding: 16, marginBottom: 16 } },
			e("h3", null, "Alterar Senha"),
			e("div", { className: "field" },
			  e("label", null, "Nova Senha"),
			  e("input", { type: "password", value: novaSenha, onChange: (ev: any) => setNovaSenha(ev.target.value) })
			  ),
			e("div", { className: "field" },
			  e("label", null, "Confirmar Senha"),
			  e("input", { type: "password", value: confirmarSenha, onChange: (ev: any) => setConfirmarSenha(ev.target.value) })
			  ),
			e("button", { className: "btn btn-primary", onClick: salvarSenha, disabled: salvandoSenha },
			  salvandoSenha ? "Salvando..." : "Alterar Senha"
			  )
			),
		perfil && perfil.is_admin ? e(
			"div",
			{ className: "panel", style: { padding: 16, marginBottom: 16 } },
			e("h3", null, "Administracao"),
			e("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
			  e("button", { className: "btn btn-ghost", onClick: () => navigate("/admin/permissoes") }, "Gerenciar Admins"),
			  e("button", { className: "btn btn-ghost", onClick: () => navigate("/admin/relatorios") }, "Relatorios e Cautelas")
			  )
			) : null,
		(pendencias.length > 0 || assinadas.length > 0) ? e(
			"div",
			{ className: "panel", style: { padding: 16, marginBottom: 16 } },
			e("h3", null, "Cautelas - Comandante de Pelotao"),
			pendencias.map(renderPendenciaComandante),
			assinadas.map(renderAssinadaComandante)
			) : null,
		(pendenciasSala.length > 0 || finalizadasSala.length > 0) ? e(
			"div",
			{ className: "panel", style: { padding: 16, marginBottom: 16 } },
			e("h3", null, "Cautelas - Sala de Meios (Designado)"),
			pendenciasSala.map(renderPendenciaSala),
			finalizadasSala.map(renderFinalizadaSala)
		) : null,
		e("div", { style: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" } },
		  e("button", { className: "btn btn-primary", onClick: () => navigate("/pelotao/formulario") }, "Formulario de Cautela"),
		  e("button", { className: "btn btn-ghost", onClick: () => { logout(); navigate("/login"); } }, "Sair")
		  ),
		documentoAtivo ? e(
			"div",
			{ className: "modal-overlay", style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 } },
			e(
				"div",
				{ className: "panel", style: { background: "#fff", maxHeight: "90vh", overflow: "auto", padding: 16 } },
				e("div", { ref: docRef }, e(RelatorioDocumento, { relatorio: documentoAtivo })),
				e("div", { style: { display: "flex", gap: 10, marginTop: 12 } },
				  e("button", { className: "btn btn-primary", onClick: baixarPdf, disabled: gerandoPdf }, gerandoPdf ? "Gerando..." : "Baixar PDF"),
				  e("button", { className: "btn btn-ghost", onClick: () => setDocumentoAtivo(null) }, "Fechar")
				  )
				)
			) : null
		)
	);
}
