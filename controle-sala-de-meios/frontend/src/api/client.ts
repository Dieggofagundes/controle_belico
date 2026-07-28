import type {
          AuthState,
          Policial,
          Relatorio,
          RelatorioInput,
          Responsavel,
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
                      throw new ApiError("Login ou senha invalidos.", 401);
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
                                    throw new ApiError("Ja existe um policial cadastrado com essa matricula.", 409);
                      }
                      throw new ApiError(error.message, 400);
          }
          return data as Policial;
}

async function removerPolicial(id: number): Promise<void> {
          const { error } = await supabase.from("policiais").delete().eq("id", id);
          if (error) throw new ApiError(error.message, 400);
}

async function listarRelatorios(filtros: { data?: string; dataInicio?: string; dataFim?: string; pelotao?: string }): Promise<Relatorio[]> {
          let query = supabase.from("relatorios").select("*").order("criado_em", { ascending: false });
          if (filtros.data) query = query.eq("data", filtros.data);
          if (filtros.dataInicio) query = query.gte("data", filtros.dataInicio);
          if (filtros.dataFim) query = query.lte("data", filtros.dataFim);
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

async function listarPendenciasComandante(): Promise<Relatorio[]> {
          const { data, error } = await supabase.rpc("listar_pendencias_comandante");
          if (error) throw new ApiError(error.message, 400);
          return data as Relatorio[];
}

async function listarCautelasComandanteAssinadas(): Promise<Relatorio[]> {
          const { data, error } = await supabase.rpc("listar_cautelas_comandante_assinadas");
          if (error) throw new ApiError(error.message, 400);
          return data as Relatorio[];
}

async function assinarComoComandante(id: number, assinatura: string, salaMeiosDesignado?: Responsavel | null): Promise<Relatorio> {
          const { data, error } = await supabase.rpc("assinar_como_comandante", {
                      p_id: id,
                      p_assinatura: assinatura,
                      p_sala_meios_designado: salaMeiosDesignado || null,
          });
          if (error) throw new ApiError(error.message, 400);
          return data as Relatorio;
}

async function listarPendenciasSalaMeios(): Promise<Relatorio[]> {
          const { data, error } = await supabase.rpc("listar_pendencias_sala_meios");
          if (error) throw new ApiError(error.message, 400);
          return data as Relatorio[];
}

async function listarCautelasSalaMeiosFinalizadas(): Promise<Relatorio[]> {
          const { data, error } = await supabase.rpc("listar_cautelas_sala_meios_finalizadas");
          if (error) throw new ApiError(error.message, 400);
          return data as Relatorio[];
}

async function obterMeuPerfil(): Promise<Policial> {
          const { data, error } = await supabase.rpc("obter_meu_perfil");
          if (error) throw new ApiError(error.message, 400);
          return data as Policial;
}

async function atualizarMeuContato(telefone: string, email: string): Promise<Policial> {
          const { data, error } = await supabase.rpc("atualizar_meu_contato", { p_telefone: telefone, p_email: email });
          if (error) throw new ApiError(error.message, 400);
          return data as Policial;
}

async function listarPoliciaisAdmin(): Promise<Policial[]> {
          const { data, error } = await supabase.rpc("listar_policiais_admin");
          if (error) throw new ApiError(error.message, 400);
          return data as Policial[];
}

async function definirAdmin(matricula: string, isAdmin: boolean): Promise<Policial> {
          const { data, error } = await supabase.rpc("definir_admin", { p_matricula: matricula, p_is_admin: isAdmin });
          if (error) throw new ApiError(error.message, 400);
          return data as Policial;
}

async function alterarSenha(novaSenha: string): Promise<void> {
          const { error } = await supabase.auth.updateUser({ password: novaSenha });
          if (error) throw new ApiError(error.message, 400);
}

export const api = {
          login,
          listarPoliciais,
          criarPolicial,
          removerPolicial,
          listarRelatorios,
          criarRelatorio,
          finalizarRelatorio,
          listarPendenciasComandante,
          listarCautelasComandanteAssinadas,
          assinarComoComandante,
          listarPendenciasSalaMeios,
          listarCautelasSalaMeiosFinalizadas,
          obterMeuPerfil,
          atualizarMeuContato,
          listarPoliciaisAdmin,
          definirAdmin,
          alterarSenha,
};

export { ApiError };
