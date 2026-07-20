import type {
    AuthState,
    Policial,
    Relatorio,
    RelatorioInput,
} from "../types";
import { supabase } from "../lib/supabaseClient";

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
          super(message);
          this.status = status;
    }
}

async function login(email: string, senha: string): Promise<AuthState> {
    const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: senha,
    });
    if (error || !data.session || !data.user) {
          throw new ApiError("Login ou senha inválidos.", 401);
    }
    const role = (data.user.user_metadata?.role as string) || "pelotao";
    const nome = (data.user.user_metadata?.nome as string) || data.user.email || "";
    return { token: data.session.access_token, role: role as AuthState["role"], nome };
}

async function listarPoliciais(): Promise<Policial[]> {
    const { data, error } = await supabase
      .from("policiais")
      .select("id, nome_completo, nome_guerra, matricula")
      .order("nome_guerra", { ascending: true });
    if (error) throw new ApiError(error.message, 400);
    return data as Policial[];
}

async function criarPolicial(payload: {
    nome_completo: string;
    nome_guerra: string;
    matricula: string;
}): Promise<Policial> {
    const { data, error } = await supabase
      .from("policiais")
      .insert(payload)
      .select("id, nome_completo, nome_guerra, matricula")
      .single();
    if (error) {
          if ((error as any).code === "23505") {
                  throw new ApiError("Já existe um policial cadastrado com essa matrícula.", 409);
          }
          throw new ApiError(error.message, 400);
    }
    return data as Policial;
}

async function removerPolicial(id: number): Promise<void> {
    const { error } = await supabase.from("policiais").delete().eq("id", id);
    if (error) throw new ApiError(error.message, 400);
}

async function listarRelatorios(filtros: { data?: string; pelotao?: string }): Promise<Relatorio[]> {
    let query = supabase.from("relatorios").select("*").order("criado_em", { ascending: false });
    if (filtros.data) query = query.eq("data", filtros.data);
    if (filtros.pelotao) query = query.eq("pelotao", filtros.pelotao);
    const { data, error } = await query;
    if (error) throw new ApiError(error.message, 400);
    return data as Relatorio[];
}

async function criarRelatorio(payload: RelatorioInput): Promise<Relatorio> {
    const { data, error } = await supabase
      .from("relatorios")
      .insert({
              data: payload.data,
              pelotao: payload.pelotao,
              distribuicoes: payload.distribuicoes,
              responsavel: payload.responsavel,
              assinatura: payload.assinatura,
      })
      .select("*")
      .single();
    if (error) throw new ApiError(error.message, 400);
    return data as Relatorio;
}

export const api = {
    login,
    listarPoliciais,
    criarPolicial,
    removerPolicial,
    listarRelatorios,
    criarRelatorio,
};

export { ApiError };
