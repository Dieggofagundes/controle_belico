"""
Autenticação mockada — credenciais fixas conforme especificação do projeto.
Em produção, substitua por um provedor real (ex: Supabase Auth, Firebase Auth)
mantendo o mesmo contrato de resposta (token, role, nome).
"""
import base64
import json
from fastapi import Header, HTTPException, status

USERS = {
    "adminsalademeios@caema.gov": {
        "senha": "Caema123@",
        "role": "admin",
        "nome": "Administrador — Sala de Meios",
    },
    "pelotao_servico@caema.gov": {
        "senha": "selva123",
        "role": "pelotao",
        "nome": "Pelotão de Serviço",
    },
}


def _make_token(email: str, role: str) -> str:
    payload = json.dumps({"email": email, "role": role}).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("utf-8")


def _decode_token(token: str) -> dict:
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8"))
        return json.loads(raw)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def authenticate(email: str, senha: str):
    user = USERS.get(email.strip().lower())
    if not user or user["senha"] != senha:
        return None
    token = _make_token(email.strip().lower(), user["role"])
    return {"token": token, "role": user["role"], "nome": user["nome"]}


def require_auth(authorization: str = Header(default=None)):
    """Garante que existe um token válido. Não restringe por papel."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado")
    token = authorization.split(" ", 1)[1]
    return _decode_token(token)


def require_admin(authorization: str = Header(default=None)):
    data = require_auth(authorization)
    if data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito ao Administrador")
    return data
