export type Role = "admin" | "pelotao";

export interface AuthState {
  token: string;
  role: Role;
  nome: string;
}

export interface Policial {
  id: number;
  nome_completo: string;
  nome_guerra: string;
  matricula: string;
}

export const PELOTOES = [
  "1º Pelotão",
  "2º Pelotão",
  "3º Pelotão",
  "4º Pelotão",
  "Extra",
  "Operação extra",
] as const;

export type Pelotao = (typeof PELOTOES)[number];

export interface Distribuicao {
  policial_id: number | null;
  nome_completo: string;
  nome_guerra: string;
  matricula: string;
  horario: string;
  armamento: string;
  qtd_carregadores: string;
  qtd_municao: string;
  observacoes: string;
}

export interface Responsavel {
  policial_id: number | null;
  nome_completo: string;
  nome_guerra: string;
  matricula: string;
}

export interface RelatorioInput {
  data: string;
  pelotao: string;
  distribuicoes: Distribuicao[];
  responsavel: Responsavel;
  assinatura: string | null;
}

export interface Relatorio extends RelatorioInput {
  id: number;
  criado_em: string;
}
