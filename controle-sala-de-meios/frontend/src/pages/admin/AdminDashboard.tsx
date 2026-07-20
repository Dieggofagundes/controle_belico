import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { Policial, Relatorio } from "../../types";

export function AdminDashboard() {
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listarPoliciais(), api.listarRelatorios({})])
      .then(([p, r]) => {
        setPoliciais(p);
        setRelatorios(r);
      })
      .finally(() => setLoading(false));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const relatoriosHoje = relatorios.filter((r) => r.data === hoje).length;

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Visão Geral</h1>
      </header>

      <div className="grid-stats" style={{ marginBottom: 36 }}>
        <StatCard label="Policiais Cadastrados" value={loading ? "—" : policiais.length} />
        <StatCard label="Relatórios Registrados" value={loading ? "—" : relatorios.length} />
        <StatCard label="Relatórios de Hoje" value={loading ? "—" : relatoriosHoje} />
      </div>

      <div className="grid-two-panels">
        <div className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Cadastro de Policiais</h3>
          <p style={{ fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
            Gerencie nome completo, nome de guerra e matrícula do efetivo. Esses dados alimentam
            automaticamente os formulários preenchidos pelo Pelotão de Serviço.
          </p>
          <Link to="/admin/policiais" className="btn btn-primary">
            Gerenciar Cadastro →
          </Link>
        </div>
        <div className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Relatórios de Serviço</h3>
          <p style={{ fontSize: 13, color: "var(--color-text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
            Consulte a cautela de armamento por data e por pelotão, com os dados completos de quem
            está com o material.
          </p>
          <Link to="/admin/relatorios" className="btn btn-primary">
            Ver Relatórios →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel" style={{ padding: "22px 24px" }}>
      <div className="eyebrow">{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 34, marginTop: 8, color: "var(--color-accent-brass)" }}>
        {value}
      </div>
    </div>
  );
}
