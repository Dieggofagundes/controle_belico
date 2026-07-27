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

async function login(identificador: string, senha: string): Promise<AuthState> {
        	const valor = identificador.trim();
        	const email = valor.includes("@") ? valor.toLowerCase() : `${valor}@efetivo.pm`;
        	const { data, error } = await supabase.auth.signInWithPassword({
                        		email,
                        		password: senha,
                });
        	if (error || !data.session || !data.user) {
                        		throw new ApiError("Login ou senha inválidos.", 401);
                }
        	const role = (data.user.user_metadata?.role as string) || "pelotao";
        	const nome = (data.user.user_metadata?.nome as string) || data.user.email || "";
        	const matricula = (data.user.user_metadata?.matricula as string) || undefined;
        	return { token: data.session.access_token, role: role as AuthState["role"], nome, matricula };
}

async function listarPoliciais(): Promise<Policial[]> {
        const { data, error } = await supabase
          .from("policiais")
          .select("id, nome_completo, nome_guerra, matricula, pelotao")
          .order("nome_guerra", { ascending: true });
        if (error) throw new ApiError(error.message, 400);
        return data as Policial[];
}

async function criarPolicial(payload: {
        nome_completo: string;
        nome_guerra: string;
        matricula: string;
        pelotao: string | null;
}): Promise<Policial> {
        const { data, error } = await supabase
          .from("policiais")
          .insert(payload)
          .select("id, nome_completo, nome_guerra, matricula, pelotao")
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
        const { data, error } = await supabase.rpc("criar_relatorio", {
                  p_data: payload.data,
                  p_pelotao: payload.pelotao,
                  p_distribuicoes: payload.distribuicoes,
                  p_responsavel: payload.responsavel,
                  p_assinatura: payload.assinatura,
                  p_itens_viatura: payload.itens_viatura,
                  p_devolucao: payload.devolucao,
                  p_comandante: payload.comandante,
                  p_assinatura_comandante: payload.assinatura_comandante,
        });
        if (error) throw new ApiError(error.message, 400);
        return data as Relatorio;
}

async function finalizarRelatorio(payload: {
        id: number;
        distribuicoes: Relatorio["distribuicoes"];
        responsavel: Relatorio["responsavel"];
        itens_viatura: Relatorio["itens_viatura"];
        devolucao: Relatorio["devolucao"];
        responsavel_sala_meios: Relatorio["responsavel_sala_meios"];
        assinatura_sala_meios: string | null;
}): Promise<Relatorio> {
        const { data, error } = await supabase.rpc("finalizar_relatorio", {
                  p_id: payload.id,
                  p_distribuicoes: payload.distribuicoes,
                  p_responsavel: payload.responsavel,
                  p_itens_viatura: payload.itens_viatura,
                  p_devolucao: payload.devolucao,
                  p_responsavel_sala_meios: payload.responsavel_sala_meios,
                  p_assinatura_sala_meios: payload.assinatura_sala_meios,
        });
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
        finalizarRelatorio,
};

export { ApiError };
