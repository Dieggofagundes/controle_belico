import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Emblem } from "../../components/Emblem";
import type { Policial } from "../../types";

export function AdminPermissoes() {
    const { notify } = useToast();
    const navigate = useNavigate();
    const [policiais, setPoliciais] = useState<Policial[]>([]);
    const [loading, setLoading] = useState(true);
    const [negado, setNegado] = useState(false);
    const [salvandoId, setSalvandoId] = useState<number | null>(null);

  function carregar() {
        setLoading(true);
        setNegado(false);
        api
          .listarPoliciaisAdmin()
          .then(setPoliciais)
          .catch((err) => {
                    if (err instanceof ApiError) setNegado(true);
                    else notify("Erro ao carregar policiais.", "error");
          })
          .finally(() => setLoading(false));
  }

  useEffect(carregar, []);

  async function alternarAdmin(p: Policial) {
        setSalvandoId(p.id);
        try {
                await api.definirAdmin(p.matricula, !p.is_admin);
                notify(`${p.nome_guerra} agora ${!p.is_admin ? "é" : "não é mais"} administrador.`, "success");
                carregar();
        } catch (err) {
                notify(err instanceof ApiError ? err.message : "Erro ao alterar permissão.", "error");
        } finally {
                setSalvandoId(null);
        }
  }

  const linhas = policiais.map((p) =>
        React.createElement(
                "div",
          {
                    key: p.id,
                    style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 0",
                                borderBottom: "1px solid var(--color-line)"
                    }
          },
                React.createElement(
                          "div",
                          null,
                          React.createElement("strong", null, p.nome_guerra),
                          React.createElement(
                                      "div",
                            { style: { fontSize: 12, color: "var(--color-text-faint)" } },
                                      `${p.nome_completo} — Mat. ${p.matricula}`
                                    )
                        ),
                React.createElement(
                          "button",
                  {
                              className: p.is_admin ? "btn btn-danger" : "btn btn-primary",
                              style: { padding: "6px 14px", fontSize: 12 },
                              onClick: () => alternarAdmin(p),
                              disabled: salvandoId === p.id
                  },
                          salvandoId === p.id ? "Salvando..." : p.is_admin ? "Remover Admin" : "Tornar Admin"
                        )
              )
                                 );

  return React.createElement(
        "div",
    { className: "login-wrapper" },
        React.createElement(
                "div",
          { className: "panel login-card", style: { maxWidth: 640 } },
                React.createElement(
                          "div",
                  { style: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 } },
                          React.createElement(Emblem, { size: 90 }),
                          React.createElement("h1", { style: { fontSize: 20, marginTop: 14, textAlign: "center" } }, "GERENCIAR PERMISSÕES DE ADMIN")
                        ),
                loading
                  ? React.createElement("p", { style: { textAlign: "center" } }, "Carregando...")
                  : negado
                  ? React.createElement(
                                "p",
                    { style: { color: "#f0d6d6", textAlign: "center" } },
                                "Você não tem permissão para acessar esta página."
                              )
                  : React.createElement("div", null, linhas),
                React.createElement(
                          "button",
                  { className: "btn btn-primary", style: { marginTop: 24 }, onClick: () => navigate("/policial") },
                          "Voltar para Meu Perfil"
                        )
              )
      );
}
