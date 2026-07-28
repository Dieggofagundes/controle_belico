import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api, ApiError } from "../../api/client";
import { Emblem } from "../../components/Emblem";
import { SignaturePad } from "../../components/SignaturePad";
import type { Policial, Relatorio, Devolucao } from "../../types";

function devolucaoVazia(): Devolucao {
	  return { data: new Date().toISOString().slice(0, 10), comAlteracao: false, observacao: "", local: "" };
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

  const [pendencias, setPendencias] = useState<Relatorio[]>([]);
	  const [assinadas, setAssinadas] = useState<Relatorio[]>([]);
	  const [carregandoPendencias, setCarregandoPendencias] = useState(true);

  const [assinandoId, setAssinandoId] = useState<number | null>(null);
	  const [assinaturaComandante, setAssinaturaComandante] = useState<string | null>(null);
	  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
	  const [devolucao, setDevolucao] = useState<Devolucao>(devolucaoVazia());
	  const [assinaturaSala, setAssinaturaSala] = useState<string | null>(null);
	  const [salvandoFinalizacao, setSalvandoFinalizacao] = useState(false);

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
	        .catch(() => ativo && setErro("Não foi possível carregar seus dados."))
	        .finally(() => ativo && setLoading(false));
	      return () => {
			        ativo = false;
		  };
  }, [auth?.matricula]);

  function carregarPendencias() {
	      setCarregandoPendencias(true);
	      Promise.all([api.listarPendenciasComandante(), api.listarCautelasComandanteAssinadas()])
	        .then(([pend, assin]) => {
				        setPendencias(pend);
				        setAssinadas(assin);
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
			        notify("As senhas não coincidem.", "error");
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
  }

  async function confirmarAssinatura(id: number) {
	      if (!assinaturaComandante) {
			        notify("Confirme sua assinatura digital.", "error");
			        return;
		  }
	      setSalvandoAssinatura(true);
	      try {
			        await api.assinarComoComandante(id, assinaturaComandante);
			        notify("Cautela assinada com sucesso.", "success");
			        setAssinandoId(null);
			        setAssinaturaComandante(null);
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
			        notify("Informe a data da devolução.", "error");
			        return;
		  }
	      if (devolucao.comAlteracao && !devolucao.observacao.trim()) {
			        notify("Descreva a observação da alteração constatada.", "error");
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
						        responsavel_sala_meios: { nome: `${auth?.nome || ""}` },
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

  const linhaNomeGuerra = React.createElement("div", { key: "ng" }, React.createElement("strong", null, "Nome de guerra: "), perfil?.nome_guerra);
	  const linhaNomeCompleto = React.createElement("div", { key: "nc" }, React.createElement("strong", null, "Nome completo: "), perfil?.nome_completo);
	  const linhaMatricula = React.createElement("div", { key: "mt" }, React.createElement("strong", null, "Matrícula: "), perfil?.matricula);
	  const linhaPelotao = React.createElement("div", { key: "pl" }, React.createElement("strong", null, "Pelotão: "), perfil?.pelotao || "Não informado");

  const blocoDados = perfil
	    ? React.createElement(
			        "div",
			{ style: { display: "flex", flexDirection: "column", gap: 12 } },
			        linhaNomeGuerra,
			        linhaNomeCompleto,
			        linhaMatricula,
			        linhaPelotao
			      )
	      : null;

  const mensagemVazia =
	      !loading && !perfil && !erro
	      ? React.createElement("p", { style: { textAlign: "center" } }, "Nenhum cadastro encontrado para esta matrícula.")
	        : null;

  const blocoContato = perfil
	    ? React.createElement(
			        "div",
			{ className: "panel", style: { padding: 20, marginTop: 24, width: "100%" } },
			        React.createElement("h3", { style: { fontSize: 14, marginBottom: 14 } }, "Contato para Recuperação de Senha"),
			        React.createElement(
						          "div",
						{ className: "field", style: { marginBottom: 12 } },
						          React.createElement("label", null, "Telefone"),
						          React.createElement("input", {
									              value: telefone,
									              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTelefone(e.target.value),
									              placeholder: "Ex: (99) 99999-9999"
								  })
						        ),
			        React.createElement(
						          "div",
						{ className: "field", style: { marginBottom: 14 } },
						          React.createElement("label", null, "E-mail"),
						          React.createElement("input", {
									              value: emailRecuperacao,
									              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmailRecuperacao(e.target.value),
									              placeholder: "seuemail@exemplo.com"
								  })
						        ),
			        React.createElement(
						          "button",
						{ className: "btn btn-primary", onClick: salvarContato, disabled: salvandoContato },
						          salvandoContato ? "Salvando..." : "Salvar Contato"
						        )
			      )
	      : null;

  const blocoSenha = React.createElement(
	      "div",
	  { className: "panel", style: { padding: 20, marginTop: 20, width: "100%" } },
	      React.createElement("h3", { style: { fontSize: 14, marginBottom: 14 } }, "Alterar Senha"),
	      React.createElement(
			        "div",
			  { className: "field", style: { marginBottom: 12 } },
			        React.createElement("label", null, "Nova Senha"),
			        React.createElement("input", {
						        type: "password",
						        value: novaSenha,
						        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNovaSenha(e.target.value),
						        placeholder: "Nova senha"
					})
			      ),
	      React.createElement(
			        "div",
			  { className: "field", style: { marginBottom: 14 } },
			        React.createElement("label", null, "Confirmar Nova Senha"),
			        React.createElement("input", {
						        type: "password",
						        value: confirmarSenha,
						        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmarSenha(e.target.value),
						        placeholder: "Confirme a nova senha"
					})
			      ),
	      React.createElement(
			        "button",
			  { className: "btn btn-primary", onClick: salvarSenha, disabled: salvandoSenha },
			        salvandoSenha ? "Salvando..." : "Alterar Senha"
			      )
	    );

  const blocoAdmin = perfil?.is_admin
	    ? React.createElement(
			        "div",
			{ className: "panel", style: { padding: 20, marginTop: 20, width: "100%" } },
			        React.createElement("h3", { style: { fontSize: 14, marginBottom: 14 } }, "Administração"),
			        React.createElement(
						          "button",
						{ className: "btn btn-primary", onClick: () => navigate("/admin/permissoes") },
						          "Gerenciar Permissões de Admin"
						        )
			      )
	      : null;

  function renderPendenciaItem(item: Relatorio) {
	      const info = React.createElement(
			        "div",
			  { style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			        `${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} — ${item.pelotao} — Responsável: ${item.responsavel.nome_guerra}`
			      );

	    const botaoAssinar = React.createElement(
			      "button",
			{ className: "btn btn-primary", onClick: () => abrirAssinatura(item.id) },
			      "Assinar Cautela"
			    );

	    const painelAssinatura =
			      assinandoId === item.id
	          ? React.createElement(
				              "div",
				  { style: { marginTop: 14 } },
				              React.createElement(SignaturePad, {
								                confirmed: !!assinaturaComandante,
								                onConfirm: (dataUrl: string) => setAssinaturaComandante(dataUrl),
								                onClear: () => setAssinaturaComandante(null),
								                label: "Assinatura Digital do Comandante de Pelotão"
							  }),
				              React.createElement(
								                "div",
								  { style: { display: "flex", gap: 10, marginTop: 12 } },
								                React.createElement(
													                "button",
													{ className: "btn btn-ghost", onClick: () => setAssinandoId(null), disabled: salvandoAssinatura },
													                "Cancelar"
													              ),
								                React.createElement(
													                "button",
													{ className: "btn btn-primary", onClick: () => confirmarAssinatura(item.id), disabled: salvandoAssinatura },
													                salvandoAssinatura ? "Salvando..." : "Confirmar Assinatura"
													              )
								              )
				            )
			        : null;

	    return React.createElement(
			      "div",
			{ key: `pend-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
			      info,
			      assinandoId === item.id ? painelAssinatura : botaoAssinar
			    );
  }

  function renderAssinadaItem(item: Relatorio) {
	      const info = React.createElement(
			        "div",
			  { style: { fontSize: 12.5, color: "var(--color-text-dim)", marginBottom: 8 } },
			        `${new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")} — ${item.pelotao} — Responsável: ${item.responsavel.nome_guerra}`
			      );

	    const botaoFinalizar = React.createElement(
			      "button",
			{ className: "btn btn-primary", onClick: () => abrirFinalizacao(item) },
			      "Finalizar Cautela (Sala de Meios)"
			    );

	    const painelFinalizacao =
			      finalizandoId === item.id
	          ? React.createElement(
				              "div",
				  { style: { marginTop: 14, display: "flex", flexDirection: "column", gap: 12 } },
				              React.createElement(
								                "div",
								  { className: "field" },
								                React.createElement("label", null, "Data da Devolução"),
								                React.createElement("input", {
													                type: "date",
													                value: devolucao.data,
													                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDevolucao({ ...devolucao, data: e.target.value })
												})
								              ),
				              React.createElement(
								                "div",
								  { style: { display: "flex", gap: 16 } },
								                React.createElement(
													                "label",
													{ style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 } },
													                React.createElement("input", {
																		                  type: "radio",
																		                  checked: !devolucao.comAlteracao,
																		                  onChange: () => setDevolucao({ ...devolucao, comAlteracao: false })
																	}),
													                "Sem alteração"
													              ),
								                React.createElement(
													                "label",
													{ style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 } },
													                React.createElement("input", {
																		                  type: "radio",
																		                  checked: devolucao.comAlteracao,
																		                  onChange: () => setDevolucao({ ...devolucao, comAlteracao: true })
																	}),
													                "Com alteração"
													              )
								              ),
				              devolucao.comAlteracao
				                ? React.createElement(
									                  "div",
									{ className: "field" },
									                  React.createElement("label", null, "Observação da Alteração"),
									                  React.createElement("textarea", {
														                      rows: 3,
														                      value: devolucao.observacao,
														                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDevolucao({ ...devolucao, observacao: e.target.value })
													  })
									                )
				                : null,
				              React.createElement(
								                "div",
								  { className: "field" },
								                React.createElement("label", null, "Local"),
								                React.createElement("input", {
													                value: devolucao.local,
													                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDevolucao({ ...devolucao, local: e.target.value })
												})
								              ),
				              React.createElement(SignaturePad, {
								                confirmed: !!assinaturaSala,
								                onConfirm: (dataUrl: string) => setAssinaturaSala(dataUrl),
								                onClear: () => setAssinaturaSala(null),
								                label: "Assinatura Digital do Responsável da Sala de Meios"
							  }),
				              React.createElement(
								                "div",
								  { style: { display: "flex", gap: 10 } },
								                React.createElement(
													                "button",
													{ className: "btn btn-ghost", onClick: () => setFinalizandoId(null), disabled: salvandoFinalizacao },
													                "Cancelar"
													              ),
								                React.createElement(
													                "button",
													{ className: "btn btn-primary", onClick: () => confirmarFinalizacao(item), disabled: salvandoFinalizacao },
													                salvandoFinalizacao ? "Salvando..." : "Confirmar Finalização"
													              )
								              )
				            )
			        : null;

	    return React.createElement(
			      "div",
			{ key: `assin-${item.id}`, className: "panel", style: { padding: 16, marginBottom: 12 } },
			      info,
			      finalizandoId === item.id ? painelFinalizacao : botaoFinalizar
			    );
  }

  const blocoPendencias = React.createElement(
	      "div",
	  { className: "panel", style: { padding: 20, marginTop: 20, width: "100%" } },
	      React.createElement("h3", { style: { fontSize: 14, marginBottom: 14 } }, "Cautelas — Comandante de Pelotão"),
	      carregandoPendencias
	        ? React.createElement("p", { style: { fontSize: 13, color: "var(--color-text-dim)" } }, "Carregando...")
	        : pendencias.length === 0 && assinadas.length === 0
	        ? React.createElement(
				          "p",
				{ style: { fontSize: 13, color: "var(--color-text-dim)" } },
				          "Nenhuma cautela pendente para você no momento."
				        )
	        : React.createElement(
				          "div",
				          null,
				          pendencias.length > 0
				            ? React.createElement(
								                "div",
								{ style: { marginBottom: 16 } },
								                React.createElement("p", { className: "eyebrow", style: { marginBottom: 10 } }, "Aguardando sua assinatura"),
								                pendencias.map(renderPendenciaItem)
								              )
				            : null,
				          assinadas.length > 0
				            ? React.createElement(
								                "div",
								                null,
								                React.createElement("p", { className: "eyebrow", style: { marginBottom: 10 } }, "Assinadas — aguardando finalização"),
								                assinadas.map(renderAssinadaItem)
								              )
				            : null
				        )
	    );

  return React.createElement(
	      "div",
	  { className: "login-wrapper" },
	      React.createElement(
			        "div",
			  { className: "panel login-card", style: { maxWidth: 560 } },
			        React.createElement(
						        "div",
						{ style: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 } },
						        React.createElement(Emblem, { size: 100 }),
						        React.createElement("h1", { style: { fontSize: 22, marginTop: 16, textAlign: "center" } }, "CONTROLE SALA DE MEIOS"),
						        React.createElement("p", { className: "eyebrow", style: { marginTop: 6 } }, "ACESSO RESTRITO · MEUS DADOS")
						      ),
			        loading ? React.createElement("p", { style: { textAlign: "center" } }, "Carregando...") : null,
			        erro ? React.createElement("p", { style: { color: "#f0d6d6", textAlign: "center" } }, erro) : null,
			        blocoDados,
			        mensagemVazia,
			        blocoContato,
			        blocoSenha,
			        blocoAdmin,
			        blocoPendencias,
			        React.createElement(
						        "button",
						{ className: "btn btn-primary", style: { marginTop: 24 }, onClick: () => navigate("/servico") },
						        "Formulário de Cautela"
						      ),
			        React.createElement(
						        "button",
						{ className: "btn btn-primary", style: { marginTop: 24 }, onClick: logout },
						        "Sair"
						      )
			      )
	    );
}
