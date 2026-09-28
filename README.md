# 🐾 Patinhas & Cia — Pet Shop e Clínica Veterinária

Sistema web acadêmico de gestão de uma pet shop com clínica veterinária, com três perfis de acesso
(Administrador, Veterinário e Cliente), frontend e backend integrados, banco de dados e autenticação real.

## Arquitetura

**Backend:** Node.js + Express, com SQLite (via `better-sqlite3`) como banco de dados — simples de rodar
localmente, sem precisar instalar um servidor de banco separado. A senha dos usuários é armazenada com hash
(`bcryptjs`), a autenticação usa JWT e cada rota valida o perfil do usuário antes de responder (nunca confiando
apenas no que o frontend esconde na tela).

**Frontend:** React (com Vite) e React Router, em JavaScript puro, com CSS próprio (sem framework de UI) para
manter o código simples de ler. O frontend guarda o token JWT no `localStorage` e o envia em toda requisição.

**Banco de dados:** modelado em `backend/src/schema.sql`, com entidades para usuários, clientes, funcionários,
veterinários, animais, consultas, prontuários, medicamentos/produtos, movimentações de estoque, pagamentos,
folha de pagamento e notificações — relacionadas por chaves estrangeiras, evitando duplicação de dados (por
exemplo, o histórico médico vive junto do animal e da consulta, não espalhado em vários lugares).

```
petshop/
├── backend/         → API Express + SQLite
│   └── src/
│       ├── routes/      → uma rota por recurso (clientes, animais, consultas...)
│       ├── middleware/  → autenticação e controle de acesso por perfil
│       ├── schema.sql   → modelagem do banco
│       └── seed.js      → dados de demonstração
└── frontend/        → React + Vite
    └── src/
        ├── pages/admin, veterinario, cliente  → uma pasta por perfil
        ├── components/   → Layout, formulários, cartões, modais reutilizáveis
        └── context/      → autenticação e notificações (toasts)
```

## Como executar localmente

Pré-requisitos: Node.js 18 ou mais recente.

### 1. Backend

```bash
cd backend
npm install
npm run seed     # cria o banco SQLite e popula com dados de demonstração
npm run dev       # inicia a API em http://localhost:3001
```

O arquivo `.env` já vem preenchido (copiado de `.env.example`) com valores padrão para rodar localmente.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev       # inicia o site em http://localhost:5173
```

Abra `http://localhost:5173` no navegador.

## Credenciais de demonstração

> Estas contas existem apenas para fins de demonstração do projeto acadêmico.

| Perfil          | E-mail                     | Senha        |
|------------------|-----------------------------|--------------|
| Administrador    | admin@petshop.com          | admin123     |
| Veterinário      | veterinario@petshop.com    | vet123       |
| Cliente          | cliente@petshop.com        | cliente123   |

A tela de login também tem botões que preenchem essas credenciais automaticamente.

## Principais funcionalidades

- **Login/logout com JWT**, rotas protegidas por perfil (um cliente não acessa telas administrativas mesmo
  digitando a URL diretamente — o backend recusa a requisição).
- **Administrador:** dashboard com indicadores, CRUD completo de clientes (com histórico de consultas e
  pagamentos), CRUD de produtos com alerta de estoque baixo, gestão de funcionários e folha de pagamento,
  visão geral de todas as consultas.
- **Veterinário:** dashboard com agenda do dia, agenda por data com confirmação/cancelamento, registro de
  atendimento (queixa, diagnóstico, medicamentos prescritos — que já dão baixa no estoque quando vinculados a
  um produto), busca de animais com ficha e histórico médico completo, consulta de medicamentos disponíveis.
- **Cliente:** dashboard simples, cadastro dos próprios animais (com foto), ficha do animal com histórico
  (somente leitura para os dados médicos, editável para os dados cadastrais), agendamento de consulta em
  etapas (impede dois agendamentos no mesmo horário para o mesmo veterinário), cancelamento de consultas,
  edição do próprio perfil.
- **Notificações:** geradas automaticamente para consulta próxima, confirmada, cancelada, atendimento
  registrado e estoque baixo — visíveis no sininho no topo da tela.
- **Estados vazios e mensagens de erro amigáveis** em toda a aplicação (ex.: "Você ainda não cadastrou nenhum
  animal", horário já ocupado, senha incorreta, sessão expirada).

## Sobre a persistência dos dados

Todos os cadastros são salvos no arquivo SQLite (`backend/data/petshop.db`, criado automaticamente). Ao recarregar
a página ou reiniciar o backend, os dados continuam lá — só o comando `npm run seed` reseta o banco.
