# Controle Sala de Meios

Sistema de controle de cautela de armamento e material bélico, com dois níveis
de acesso (**Administrador** e **Pelotão de Serviço**).

- **Backend:** Python (FastAPI) + SQLite — API REST simples, sem dependências externas de banco.
- **Frontend:** React + TypeScript (Vite) — interface com identidade visual militar/institucional.

---

## 1. Credenciais de acesso (mockadas)

| Perfil | Login | Senha |
|---|---|---|
| Administrador | `adminsalademeios@caema.gov` | `Caema123@` |
| Pelotão de Serviço | `pelotao_servico@caema.gov` | `selva123` |

Essas credenciais estão fixadas em `backend/app/auth.py`. Para trocá-las ou
integrar com um provedor real (Supabase Auth, Firebase Auth, etc.), edite esse
arquivo mantendo o mesmo contrato de resposta (`token`, `role`, `nome`).

---

## 2. Como rodar o backend (API)

Requer Python 3.10+.

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

A API sobe em `http://localhost:8000`. Um arquivo `sala_de_meios.db` (SQLite)
é criado automaticamente na primeira execução — não é necessário configurar
nenhum banco externo.

Documentação interativa automática (Swagger): `http://localhost:8000/docs`

---

## 3. Como rodar o frontend

Requer Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` e já aponta para a API em
`http://localhost:8000` por padrão. Para apontar para outro endereço, copie
`.env.example` para `.env` e ajuste `VITE_API_URL`.

---

## 4. Imagem de fundo institucional

A imagem da medalha CIPE Mata Atlântica / CAEMA já está incluída em
`frontend/public/bg-fundo.jpg` e é usada como fundo do login e das telas
principais, com um overlay escuro por cima para manter o texto sempre legível
(inclusive em telas pequenas de celular).

Para trocar por outra imagem, basta substituir esse mesmo arquivo
(`frontend/public/bg-fundo.jpg`) por outro com o mesmo nome — nenhuma
alteração de código é necessária. Se o arquivo for removido, o sistema cai
automaticamente em um padrão gráfico gerado em CSS, então a tela nunca fica quebrada.

---

## 5. Estrutura do projeto

```
controle-sala-de-meios/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # rotas da API
│       ├── auth.py          # autenticação mockada
│       ├── database.py      # SQLite (sem ORM)
│       └── schemas.py       # modelos Pydantic
└── frontend/
    ├── src/
    │   ├── api/client.ts            # cliente HTTP
    │   ├── context/                 # Auth + Toast (feedback visual)
    │   ├── components/              # Emblem, SignaturePad, Layout, etc.
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── admin/                # Dashboard, Cadastro, Relatórios
    │   │   └── pelotao/              # Formulário de Cautela
    │   └── styles/globals.css       # design system militar/institucional
    └── public/
```

---

## 6. Funcionalidades

### Administrador
- **Cadastro de Policiais**: nome completo, nome de guerra e matrícula — consumido automaticamente pelo formulário do Pelotão.
- **Relatórios**: lista filtrável por data e por pelotão, com todos os dados de quem está com o armamento.

### Pelotão de Serviço
- Cabeçalho: data (padrão = hoje) e seleção do pelotão assumindo o serviço.
- Distribuição de armamento: lista dinâmica ("+ Adicionar Policial"), com
  seleção do policial (auto-preenchendo nome completo/nome de guerra/matrícula),
  horário da carga, armamento, quantidade de carregadores e munição, e observações livres.
- Fechamento: responsável pelo preenchimento (auto-preenchido a partir do cadastro)
  e assinatura digital feita à mão (mouse/toque) antes do envio.
- Feedback visual (toasts) em todas as ações de salvar/erro, tanto no login quanto nos formulários.

---

## 7. Responsividade

O layout foi construído com breakpoints para três faixas de tela:

- **Desktop (≥1024px):** sidebar fixa lateral com navegação completa.
- **Tablet (641–1023px):** sidebar mais estreita, grids se reorganizam automaticamente.
- **Celular (≤640px):** a sidebar vira uma barra superior fixa com um menu de
  navegação horizontal rolável; todos os grids e formulários empilham em uma
  única coluna; tabelas ganham rolagem horizontal própria para não quebrar o layout;
  o campo de assinatura digital tem a escala de toque corrigida para funcionar
  com precisão em qualquer largura de tela.

Teste localmente redimensionando a janela do navegador ou usando o modo de
dispositivo móvel das ferramentas de desenvolvedor (F12 → ícone de celular/tablet).

## 8. Segurança — observação importante

A autenticação atual é **mockada** (token simples sem expiração, credenciais
fixas em código), adequada para demonstração e ambiente interno controlado.
Para uso em produção, recomenda-se:
- Trocar por um provedor real de autenticação (Supabase Auth, Firebase Auth, Auth0, etc.);
- Usar HTTPS;
- Adicionar hashing de senha e expiração/renovação de token caso a autenticação continue sendo própria.
