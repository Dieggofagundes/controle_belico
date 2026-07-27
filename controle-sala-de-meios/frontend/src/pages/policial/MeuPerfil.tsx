import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Emblem } from "../../components/Emblem";
import type { Policial } from "../../types";

export function MeuPerfil() {
  	const { auth, logout } = useAuth();
  	const [policial, setPolicial] = useState<Policial | null>(null);
  	const [erro, setErro] = useState<string | null>(null);
  	const [loading, setLoading] = useState(true);

	useEffect(() => {
    		let ativo = true;
    		async function carregar() {
          			try {
                  				const lista = await api.listarPoliciais();
                  				const encontrado = lista.find((p) => p.matricula === auth?.matricula) || null;
                  				if (ativo) setPolicial(encontrado);
                } catch (err) {
                  				if (ativo) setErro("Não foi possível carregar seus dados.");
                } finally {
                  				if (ativo) setLoading(false);
                }
        }
    		carregar();
    		return () => {
          			ativo = false;
        };
  }, [auth?.matricula]);

	const linhaNomeGuerra = React.createElement("div", { key: "ng" }, React.createElement("strong", null, "Nome de guerra: "), policial?.nome_guerra);
  	const linhaNomeCompleto = React.createElement("div", { key: "nc" }, React.createElement("strong", null, "Nome completo: "), policial?.nome_completo);
  	const linhaMatricula = React.createElement("div", { key: "mt" }, React.createElement("strong", null, "Matrícula: "), policial?.matricula);
  	const linhaPelotao = React.createElement("div", { key: "pl" }, React.createElement("strong", null, "Pelotão: "), policial?.pelotao || "Não informado");

	const blocoDados = policial
  		? React.createElement(
        				"div",
        { style: { display: "flex", flexDirection: "column", gap: 12 } },
        				linhaNomeGuerra,
        				linhaNomeCompleto,
        				linhaMatricula,
        				linhaPelotao,
        			)
    		: null;

	const mensagemVazia =
    		!loading && !policial && !erro
  			? React.createElement("p", { style: { textAlign: "center" } }, "Nenhum cadastro encontrado para esta matrícula.")
    			: null;

	return React.createElement(
    		"div",
    { className: "login-wrapper" },
    		React.createElement(
          			"div",
          { className: "panel login-card" },
          			React.createElement(
                  				"div",
                  { style: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 } },
                  				React.createElement(Emblem, { size: 100 }),
                  				React.createElement("h1", { style: { fontSize: 22, marginTop: 16, textAlign: "center" } }, "CONTROLE SALA DE MEIOS"),
                  				React.createElement("p", { className: "eyebrow", style: { marginTop: 6 } }, "ACESSO RESTRITO · MEUS DADOS"),
                  			),
          			loading ? React.createElement("p", { style: { textAlign: "center" } }, "Carregando...") : null,
          			erro ? React.createElement("p", { style: { color: "#f0d6d6", textAlign: "center" } }, erro) : null,
          			blocoDados,
          			mensagemVazia,
          			React.createElement(
                  				"button",
                  { className: "btn btn-primary", style: { marginTop: 24 }, onClick: logout },
                  				"Sair",
                  			),
          		),
    	);
}
