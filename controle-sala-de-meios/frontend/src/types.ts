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
      pelotao: string | null;
}

export const PELOTOES = [
      "1º Pelotão",
      "2º Pelotão",
      "3º Pelotão",
      "4º Pelotão",
      "Extra",
      "Operação extra",
      "ADM",
    ] as const;

export type Pelotao = (typeof PELOTOES)[number];

export const PELOTOES_POLICIAL = [
      "1º Pelotão",
      "2º Pelotão",
      "3º Pelotão",
      "4º Pelotão",
      "ADM",
      "SOINT",
] as const;

export const MODELOS_ARMAMENTO = [
      "Carabina IWI ARAD - CAL. 5,56",
      "Fuzil IWI ARAD - CAL. 7,62",
      "Fuzil IMBEL - CAL. 5,56",
      "Fuzil IMBEL - CAL. 7,62",
      "CT CAL. .30",
      "SMT CAL. .40",
      "MT CAL. .40",
      "Espingarda - CAL. 12",
    ] as const;

export const ACESSORIOS_PADRAO = [
      "Magnificador",
      "Meprolight (Red Dot)",
      "Alça de mira",
      "Massa de mira",
      "Front Grip (Empunhadura)",
      "Bandoleira",
      "Zarelhos (2)",
    ] as const;

export interface AcessorioArma {
      nome: string;
      numero_ok: string;
}

export interface Distribuicao {
      policial_id: number | null;
      nome_completo: string;
      nome_guerra: string;
      matricula: string;
      horario: string;
      graduacao: string;
      armamento: string;
      numero_arma: string;
      qtd_carregadores: string;
      qtd_municao: string;
      acessorios: AcessorioArma[];
      fotos_armamento: (string | null)[];
      observacoes: string;
}

export interface Responsavel {
      policial_id: number | null;
      nome_completo: string;
      nome_guerra: string;
      matricula: string;
}

export interface ItemMaterial {
      descricao: string;
      quantidade: string;
      numero?: string;
}

export const ITENS_MATERIAL_VIATURA: string[] = [
      "1 - Alicate corta frio (pequeno/médio/grande)",
      "2 - Aparelho celular funcional nº",
      "3 - Apito com cordão",
      "4 - Ariete",
      "5 - Bastão BP90",
      "6 - Bastão sinalizador",
      "7 - Bornal elastômero",
      "8 - Bornal granada explosiva",
      "9 - Bornal granada fumígena",
      "10 - Cadeado com chave / com segredo",
      "11 - Capacete antibalístico marrom com viseira com capa",
      "12 - Capacete antibalístico preto com viseira com capa Nº",
      "13 - Capacete antibalístico preto sem viseira com capa",
      "14 - Capacete antitumulto preto com viseira com capa",
      "15 - Colete refletivo",
      "16 - Cone sinalizador retrátil",
      "17 - Escudo antibalístico nº",
      "18 - Escudo antitumulto nº",
      "19 - Fita zebrada",
      "20 - Máscara anti-gás com capa",
      "21 - Perneira antitumulto flexível com capa",
      "22 - Perneira antitumulto modelo novo com capa",
      "23 - Perneira antitumulto rígida com capa",
      "24 - Poncho",
      "25 - HT Nº",
    ];

export const ITENS_COM_NUMERO = [
      "2 - Aparelho celular funcional nº",
      "17 - Escudo antibalístico nº",
      "18 - Escudo antitumulto nº",
      "25 - HT Nº",
    ];

export const ITENS_MUNICAO_ESPECIAL: string[] = [
      "GL 108 OC MAX",
      "GL 108 / Espuma",
      "GB 704",
      "GB 707",
      "GL 300 HYPER",
      "GL 300T",
      "GL 302",
      "GL 303",
      "GL 304",
      "GL 307",
      "AM 403/P",
      "AM 403/PSR",
      "GL 201 37/40MM",
      "GL 201 40MM",
      "GL 202 37/40MM",
      "GL 202 40MM",
      "GL 203L 37/40MM",
      "GL 203T 37/40MM",
      "AM 470 37/40MM",
      "NT 400 40MM",
      "NT 901 CS 40/46",
      "NT 907 LUZ SOM40/46",
      "KOE Nº",
    ];

export interface ChecklistViatura {
      geral: ItemMaterial[];
      municaoEspecial: ItemMaterial[];
      observacoesGerais: string;
}

export interface Devolucao {
      data: string;
      comAlteracao: boolean;
      observacao: string;
      local: string;
}

export interface ResponsavelSalaMeios {
      nome: string;
}

export interface RelatorioInput {
      data: string;
      pelotao: string;
      distribuicoes: Distribuicao[];
      responsavel: Responsavel;
      assinatura: string | null;
      itens_viatura: ChecklistViatura;
      devolucao: Devolucao;
      comandante: Responsavel;
      assinatura_comandante: string | null;
}

export interface Relatorio extends RelatorioInput {
      id: number;
      criado_em: string;
      finalizado: boolean;
      finalizado_em: string | null;
      responsavel_sala_meios: ResponsavelSalaMeios | null;
      assinatura_sala_meios: string | null;
}
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
      "ADM",
    ] as const;

export type Pelotao = (typeof PELOTOES)[number];

export const MODELOS_ARMAMENTO = [
      "Carabina IWI ARAD - CAL. 5,56",
      "Fuzil IWI ARAD - CAL. 7,62",
      "Fuzil IMBEL - CAL. 5,56",
      "Fuzil IMBEL - CAL. 7,62",
      "CT CAL. .30",
      "SMT CAL. .40",
      "MT CAL. .40",
      "Espingarda - CAL. 12",
    ] as const;

export const ACESSORIOS_PADRAO = [
      "Magnificador",
      "Meprolight (Red Dot)",
      "Alça de mira",
      "Massa de mira",
      "Front Grip (Empunhadura)",
      "Bandoleira",
      "Zarelhos (2)",
    ] as const;

export interface AcessorioArma {
      nome: string;
      numero_ok: string;
}

export interface Distribuicao {
      policial_id: number | null;
      nome_completo: string;
      nome_guerra: string;
      matricula: string;
      horario: string;
      graduacao: string;
      armamento: string;
      numero_arma: string;
      qtd_carregadores: string;
      qtd_municao: string;
      acessorios: AcessorioArma[];
      fotos_armamento: (string | null)[];
      observacoes: string;
}

export interface Responsavel {
      policial_id: number | null;
      nome_completo: string;
      nome_guerra: string;
      matricula: string;
}

export interface ItemMaterial {
      descricao: string;
      quantidade: string;
      numero?: string;
}

export const ITENS_MATERIAL_VIATURA: string[] = [
      "1 - Alicate corta frio (pequeno/médio/grande)",
      "2 - Aparelho celular funcional nº",
      "3 - Apito com cordão",
      "4 - Ariete",
      "5 - Bastão BP90",
      "6 - Bastão sinalizador",
      "7 - Bornal elastômero",
      "8 - Bornal granada explosiva",
      "9 - Bornal granada fumígena",
      "10 - Cadeado com chave / com segredo",
      "11 - Capacete antibalístico marrom com viseira com capa",
      "12 - Capacete antibalístico preto com viseira com capa Nº",
      "13 - Capacete antibalístico preto sem viseira com capa",
      "14 - Capacete antitumulto preto com viseira com capa",
      "15 - Colete refletivo",
      "16 - Cone sinalizador retrátil",
      "17 - Escudo antibalístico nº",
      "18 - Escudo antitumulto nº",
      "19 - Fita zebrada",
      "20 - Máscara anti-gás com capa",
      "21 - Perneira antitumulto flexível com capa",
      "22 - Perneira antitumulto modelo novo com capa",
      "23 - Perneira antitumulto rígida com capa",
      "24 - Poncho",
      "25 - HT Nº",
    ];

export const ITENS_COM_NUMERO = [
      "2 - Aparelho celular funcional nº",
      "17 - Escudo antibalístico nº",
      "18 - Escudo antitumulto nº",
      "25 - HT Nº",
    ];

export const ITENS_MUNICAO_ESPECIAL: string[] = [
      "GL 108 OC MAX",
      "GL 108 / Espuma",
      "GB 704",
      "GB 707",
      "GL 300 HYPER",
      "GL 300T",
      "GL 302",
      "GL 303",
      "GL 304",
      "GL 307",
      "AM 403/P",
      "AM 403/PSR",
      "GL 201 37/40MM",
      "GL 201 40MM",
      "GL 202 37/40MM",
      "GL 202 40MM",
      "GL 203L 37/40MM",
      "GL 203T 37/40MM",
      "AM 470 37/40MM",
      "NT 400 40MM",
      "NT 901 CS 40/46",
      "NT 907 LUZ SOM40/46",
      "KOE Nº",
    ];

export interface ChecklistViatura {
      geral: ItemMaterial[];
      municaoEspecial: ItemMaterial[];
      observacoesGerais: string;
}

export interface Devolucao {
      data: string;
      comAlteracao: boolean;
      observacao: string;
      local: string;
}

export interface ResponsavelSalaMeios {
      nome: string;
}

export interface RelatorioInput {
      data: string;
      pelotao: string;
      distribuicoes: Distribuicao[];
      responsavel: Responsavel;
      assinatura: string | null;
      itens_viatura: ChecklistViatura;
      devolucao: Devolucao;
      comandante: Responsavel;
      assinatura_comandante: string | null;
}

export interface Relatorio extends RelatorioInput {
      id: number;
      criado_em: string;
      finalizado: boolean;
      finalizado_em: string | null;
      responsavel_sala_meios: ResponsavelSalaMeios | null;
      assinatura_sala_meios: string | null;
}
