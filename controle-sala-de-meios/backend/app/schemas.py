from pydantic import BaseModel, Field
from typing import List, Optional


class LoginRequest(BaseModel):
    email: str
    senha: str


class LoginResponse(BaseModel):
    token: str
    role: str
    nome: str


class PolicialCreate(BaseModel):
    nome_completo: str = Field(min_length=2)
    nome_guerra: str = Field(min_length=1)
    matricula: str = Field(min_length=1)


class Policial(PolicialCreate):
    id: int


class Distribuicao(BaseModel):
    policial_id: Optional[int] = None
    nome_completo: str
    nome_guerra: str
    matricula: str
    horario: str
    armamento: str
    qtd_carregadores: str
    qtd_municao: str
    observacoes: Optional[str] = ""


class Responsavel(BaseModel):
    policial_id: Optional[int] = None
    nome_completo: str
    nome_guerra: str
    matricula: str


class RelatorioCreate(BaseModel):
    data: str
    pelotao: str
    distribuicoes: List[Distribuicao]
    responsavel: Responsavel
    assinatura: Optional[str] = None


class Relatorio(RelatorioCreate):
    id: int
    criado_em: str
