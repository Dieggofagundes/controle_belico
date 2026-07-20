import json
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from . import schemas
from .database import init_db, db_cursor
from .auth import authenticate, require_auth, require_admin

app = FastAPI(title="Controle Sala de Meios API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajuste em produção para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ------------------------------------------------------------------ #
# Autenticação
# ------------------------------------------------------------------ #
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest):
    result = authenticate(payload.email, payload.senha)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha inválidos.",
        )
    return result


# ------------------------------------------------------------------ #
# Policiais (cadastro do Admin, consumido pelo Pelotão)
# ------------------------------------------------------------------ #
@app.get("/api/policiais", response_model=List[schemas.Policial])
def listar_policiais(_=Depends(require_auth)):
    with db_cursor() as cur:
        cur.execute("SELECT id, nome_completo, nome_guerra, matricula FROM policiais ORDER BY nome_guerra")
        rows = cur.fetchall()
        return [dict(r) for r in rows]


@app.post("/api/policiais", response_model=schemas.Policial, status_code=status.HTTP_201_CREATED)
def criar_policial(payload: schemas.PolicialCreate, _=Depends(require_admin)):
    with db_cursor(commit=True) as cur:
        try:
            cur.execute(
                "INSERT INTO policiais (nome_completo, nome_guerra, matricula) VALUES (?, ?, ?)",
                (payload.nome_completo.strip(), payload.nome_guerra.strip(), payload.matricula.strip()),
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um policial cadastrado com essa matrícula.",
            )
        new_id = cur.lastrowid
        cur.execute("SELECT id, nome_completo, nome_guerra, matricula FROM policiais WHERE id = ?", (new_id,))
        return dict(cur.fetchone())


@app.delete("/api/policiais/{policial_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_policial(policial_id: int, _=Depends(require_admin)):
    with db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM policiais WHERE id = ?", (policial_id,))
    return None


# ------------------------------------------------------------------ #
# Relatórios (preenchidos pelo Pelotão, visualizados pelo Admin)
# ------------------------------------------------------------------ #
@app.get("/api/relatorios", response_model=List[schemas.Relatorio])
def listar_relatorios(
    data: Optional[str] = None,
    pelotao: Optional[str] = None,
    _=Depends(require_admin),
):
    query = "SELECT * FROM relatorios WHERE 1=1"
    params = []
    if data:
        query += " AND data = ?"
        params.append(data)
    if pelotao:
        query += " AND pelotao = ?"
        params.append(pelotao)
    query += " ORDER BY criado_em DESC"

    with db_cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            item["distribuicoes"] = json.loads(item["distribuicoes"])
            item["responsavel"] = json.loads(item["responsavel"])
            result.append(item)
        return result


@app.post("/api/relatorios", response_model=schemas.Relatorio, status_code=status.HTTP_201_CREATED)
def criar_relatorio(payload: schemas.RelatorioCreate, _=Depends(require_auth)):
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO relatorios (data, pelotao, distribuicoes, responsavel, assinatura)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.data,
                payload.pelotao,
                json.dumps([d.model_dump() for d in payload.distribuicoes]),
                json.dumps(payload.responsavel.model_dump()),
                payload.assinatura,
            ),
        )
        new_id = cur.lastrowid
        cur.execute("SELECT * FROM relatorios WHERE id = ?", (new_id,))
        item = dict(cur.fetchone())
        item["distribuicoes"] = json.loads(item["distribuicoes"])
        item["responsavel"] = json.loads(item["responsavel"])
        return item


@app.get("/api/health")
def health():
    return {"status": "ok"}
