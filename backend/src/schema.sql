-- Modelagem do banco de dados (SQLite) - Patinhas & Cia

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('ADMINISTRADOR','VETERINARIO','CLIENTE')),
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  cpf TEXT,
  telefone TEXT,
  endereco TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL AND cpf <> '';

CREATE TABLE IF NOT EXISTS funcionarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  perfil_acesso TEXT NOT NULL DEFAULT 'NENHUM' CHECK (perfil_acesso IN ('ADMINISTRADOR','VETERINARIO','NENHUM')),
  telefone TEXT,
  salario_base REAL NOT NULL DEFAULT 0,
  data_admissao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS veterinarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  crmv TEXT NOT NULL,
  especialidade TEXT
);

CREATE TABLE IF NOT EXISTS animais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL,
  raca TEXT,
  sexo TEXT NOT NULL CHECK (sexo IN ('Macho','Fêmea')),
  data_nascimento TEXT,
  peso REAL,
  cor TEXT,
  foto TEXT,
  observacoes TEXT,
  alergias TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  veterinario_id INTEGER NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA','CONFIRMADA','REALIZADA','CANCELADA')),
  criada_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
-- Impede dois agendamentos no mesmo horário para o mesmo veterinário (consultas canceladas liberam o horário)
CREATE UNIQUE INDEX IF NOT EXISTS idx_consulta_horario
  ON consultas(veterinario_id, data, horario) WHERE status <> 'CANCELADA';

CREATE TABLE IF NOT EXISTS prontuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consulta_id INTEGER NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  veterinario_id INTEGER NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  queixa_principal TEXT NOT NULL,
  observacoes TEXT,
  diagnostico TEXT,
  peso REAL,
  temperatura REAL,
  recomendacoes TEXT,
  retorno TEXT,
  observacoes_adicionais TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Ração','Brinquedos','Higiene','Acessórios','Medicamentos','Outros')),
  descricao TEXT,
  preco REAL NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  imagem TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  -- usados apenas por medicamentos
  classe TEXT,
  indicacao TEXT,
  dosagem TEXT
);

CREATE TABLE IF NOT EXISTS prontuario_medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prontuario_id INTEGER NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  dosagem TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vacinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  veterinario_id INTEGER REFERENCES veterinarios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  data_aplicacao TEXT NOT NULL,
  proxima_dose TEXT
);

CREATE TABLE IF NOT EXISTS exames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  veterinario_id INTEGER REFERENCES veterinarios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  data TEXT NOT NULL,
  resultado TEXT
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA','SAIDA')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  criada_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  consulta_id INTEGER REFERENCES consultas(id) ON DELETE SET NULL,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('SERVICO','COMPRA')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAGO' CHECK (status IN ('PAGO','PENDENTE')),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folha_pagamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,          -- formato AAAA-MM
  salario_base REAL NOT NULL,
  bonificacoes REAL NOT NULL DEFAULT 0,
  descontos REAL NOT NULL DEFAULT 0,
  salario_liquido REAL NOT NULL,
  data_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','PAGO')),
  UNIQUE (funcionario_id, mes_referencia)
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  ref TEXT,                              -- evita notificações repetidas
  criada_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacoes(usuario_id, lida);
