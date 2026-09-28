// Popula o banco com dados de demonstração. Execute com: npm run seed
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const arquivo = path.resolve(__dirname, '..', process.env.DB_FILE || './data/petshop.db');

// Reseta o banco para evitar duplicar os dados de teste ao rodar o seed mais de uma vez
db.pragma('foreign_keys = OFF');
['notificacoes', 'folha_pagamento', 'pagamentos', 'movimentacoes_estoque', 'exames', 'vacinas',
  'prontuario_medicamentos', 'prontuarios', 'consultas', 'produtos', 'animais', 'veterinarios',
  'funcionarios', 'clientes', 'usuarios'].forEach((t) => db.prepare(`DELETE FROM ${t}`).run());
db.pragma('foreign_keys = ON');

const hash = (s) => bcrypt.hashSync(s, 10);
const criarUsuario = (nome, email, senha, perfil) =>
  db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
    .run(nome, email, hash(senha), perfil).lastInsertRowid;

console.log('Criando usuários de demonstração...');

const adminId = criarUsuario('Ana Beatriz Souza', 'admin@petshop.com', 'admin123', 'ADMINISTRADOR');
db.prepare(`INSERT INTO funcionarios (usuario_id, nome, cargo, perfil_acesso, salario_base, data_admissao)
  VALUES (?, 'Ana Beatriz Souza', 'Administradora', 'ADMINISTRADOR', 4200, '2022-03-01')`).run(adminId);

const vets = [
  { nome: 'Dr. Rafael Lima', email: 'veterinario@petshop.com', senha: 'vet123', crmv: 'CRMV-SP 24581', especialidade: 'Clínica Geral' },
  { nome: 'Dra. Camila Torres', email: 'camila.torres@petshop.com', senha: 'vet123', crmv: 'CRMV-SP 31022', especialidade: 'Dermatologia' },
];
const vetIds = vets.map((v) => {
  const uid = criarUsuario(v.nome, v.email, v.senha, 'VETERINARIO');
  db.prepare(`INSERT INTO funcionarios (usuario_id, nome, cargo, perfil_acesso, salario_base, data_admissao)
    VALUES (?, ?, 'Médico(a) Veterinário(a)', 'VETERINARIO', 5200, '2023-02-10')`).run(uid, v.nome);
  return db.prepare('INSERT INTO veterinarios (usuario_id, crmv, especialidade) VALUES (?, ?, ?)').run(uid, v.crmv, v.especialidade).lastInsertRowid;
});

const clientesDemo = [
  { nome: 'Cliente Demonstração', email: 'cliente@petshop.com', senha: 'cliente123', cpf: '11122233344', telefone: '(11) 98888-1234', endereco: 'Rua das Flores, 120 - São Paulo/SP' },
  { nome: 'João Pedro Almeida', email: 'joao.almeida@example.com', senha: 'cliente123', cpf: '22233344455', telefone: '(11) 97777-5678', endereco: 'Av. Brasil, 900 - São Paulo/SP' },
  { nome: 'Marina Costa', email: 'marina.costa@example.com', senha: 'cliente123', cpf: '33344455566', telefone: '(11) 96666-4321', endereco: 'Rua Verde, 45 - São Paulo/SP' },
];
const clienteIds = clientesDemo.map((c) => {
  const uid = criarUsuario(c.nome, c.email, c.senha, 'CLIENTE');
  return db.prepare('INSERT INTO clientes (usuario_id, cpf, telefone, endereco) VALUES (?, ?, ?, ?)').run(uid, c.cpf, c.telefone, c.endereco).lastInsertRowid;
});

console.log('Cadastrando animais...');
const animais = [
  { cliente: 0, nome: 'Bidu', especie: 'Cachorro', raca: 'Golden Retriever', sexo: 'Macho', nasc: '2021-05-14', peso: 28.5, cor: 'Dourado', alergias: '' },
  { cliente: 0, nome: 'Mingau', especie: 'Gato', raca: 'SRD', sexo: 'Fêmea', nasc: '2022-08-02', peso: 4.1, cor: 'Cinza e branco', alergias: 'Sensibilidade a frango' },
  { cliente: 1, nome: 'Thor', especie: 'Cachorro', raca: 'Bulldog Francês', sexo: 'Macho', nasc: '2020-01-20', peso: 12.2, cor: 'Atigrado', alergias: '' },
  { cliente: 2, nome: 'Luna', especie: 'Gato', raca: 'Siamês', sexo: 'Fêmea', nasc: '2023-03-10', peso: 3.6, cor: 'Creme', alergias: '' },
];
const animalIds = animais.map((a) =>
  db.prepare(`INSERT INTO animais (cliente_id, nome, especie, raca, sexo, data_nascimento, peso, cor, observacoes, alergias)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?)`)
    .run(clienteIds[a.cliente], a.nome, a.especie, a.raca, a.sexo, a.nasc, a.peso, a.cor, a.alergias).lastInsertRowid
);

console.log('Cadastrando produtos...');
const produtos = [
  { nome: 'Ração Premium Cães Adultos 15kg', categoria: 'Ração', descricao: 'Ração completa para cães adultos de porte médio e grande.', preco: 189.9, estoque: 24, min: 5 },
  { nome: 'Ração Filhotes Gatos 3kg', categoria: 'Ração', descricao: 'Fórmula para gatos filhotes até 12 meses.', preco: 79.9, estoque: 3, min: 5 },
  { nome: 'Bolinha de Borracha', categoria: 'Brinquedos', descricao: 'Brinquedo resistente para cães.', preco: 24.9, estoque: 40, min: 8 },
  { nome: 'Arranhador para Gatos', categoria: 'Brinquedos', descricao: 'Arranhador com sisal natural.', preco: 119.9, estoque: 6, min: 3 },
  { nome: 'Shampoo Neutro 500ml', categoria: 'Higiene', descricao: 'Shampoo suave para todos os tipos de pelagem.', preco: 34.9, estoque: 18, min: 5 },
  { nome: 'Coleira Ajustável M', categoria: 'Acessórios', descricao: 'Coleira em nylon reforçado, tamanho médio.', preco: 39.9, estoque: 15, min: 4 },
  { nome: 'Caixa de Transporte N2', categoria: 'Acessórios', descricao: 'Caixa de transporte para gatos e cães pequenos.', preco: 149.9, estoque: 2, min: 3 },
  { nome: 'Amoxicilina Pet 250mg (c/10)', categoria: 'Medicamentos', descricao: 'Antibiótico de amplo espectro.', preco: 45.0, estoque: 20, min: 5, classe: 'Antibiótico', indicacao: 'Infecções bacterianas', dosagem: '1 comprimido a cada 12h conforme peso' },
  { nome: 'Antipulgas e Carrapatos (cães até 10kg)', categoria: 'Medicamentos', descricao: 'Proteção mensal contra pulgas e carrapatos.', preco: 89.9, estoque: 12, min: 4, classe: 'Antiparasitário', indicacao: 'Prevenção de ectoparasitas', dosagem: '1 pipeta mensal' },
  { nome: 'Anti-inflamatório Pet 20mg', categoria: 'Medicamentos', descricao: 'Uso sob prescrição veterinária.', preco: 38.5, estoque: 4, min: 5, classe: 'Anti-inflamatório', indicacao: 'Dores e inflamações pós-cirúrgicas', dosagem: '0,5mg/kg a cada 24h' },
];
const produtoIds = produtos.map((p) =>
  db.prepare(`INSERT INTO produtos (nome, categoria, descricao, preco, estoque, estoque_minimo, classe, indicacao, dosagem)
    VALUES (@nome, @categoria, @descricao, @preco, @estoque, @min, @classe, @indicacao, @dosagem)`)
    .run({ classe: null, indicacao: null, dosagem: null, ...p }).lastInsertRowid
);

console.log('Agendando consultas...');
const hoje = new Date();
const isoOffset = (dias, hora) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + dias);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { data: iso, horario: hora };
};
const consultas = [
  { animal: 0, vet: 0, quando: isoOffset(0, '09:00'), motivo: 'Consulta de rotina', status: 'CONFIRMADA' },
  { animal: 2, vet: 0, quando: isoOffset(0, '10:30'), motivo: 'Coceira excessiva', status: 'AGENDADA' },
  { animal: 1, vet: 1, quando: isoOffset(1, '14:00'), motivo: 'Vacinação anual', status: 'AGENDADA' },
  { animal: 3, vet: 1, quando: isoOffset(3, '15:30'), motivo: 'Avaliação dermatológica', status: 'CONFIRMADA' },
  { animal: 0, vet: 0, quando: isoOffset(-10, '09:30'), motivo: 'Check-up geral', status: 'REALIZADA' },
];
const consultaIds = consultas.map((c) =>
  db.prepare('INSERT INTO consultas (animal_id, veterinario_id, data, horario, motivo, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(animalIds[c.animal], vetIds[c.vet], c.quando.data, c.quando.horario, c.motivo, c.status).lastInsertRowid
);

// Prontuário da consulta já realizada (Bidu)
const prontuarioId = db.prepare(`INSERT INTO prontuarios
  (consulta_id, animal_id, veterinario_id, queixa_principal, observacoes, diagnostico, peso, temperatura, recomendacoes, retorno)
  VALUES (?, ?, ?, 'Check-up de rotina', 'Animal ativo e saudável, sem queixas do tutor.', 'Nenhuma alteração encontrada.', 28.5, 38.4, 'Manter alimentação e exercícios regulares.', '6 meses')`)
  .run(consultaIds[4], animalIds[0], vetIds[0]).lastInsertRowid;
db.prepare('INSERT INTO prontuario_medicamentos (prontuario_id, produto_id, nome, dosagem, quantidade) VALUES (?, ?, ?, ?, ?)')
  .run(prontuarioId, produtoIds[7], 'Vermífugo de rotina', '1 comprimido dose única', 1);

db.prepare("INSERT INTO vacinas (animal_id, veterinario_id, nome, data_aplicacao, proxima_dose) VALUES (?, ?, 'V10 (múltipla)', date('now','-3 months'), date('now','+9 months'))")
  .run(animalIds[0], vetIds[0]);
db.prepare("INSERT INTO vacinas (animal_id, veterinario_id, nome, data_aplicacao, proxima_dose) VALUES (?, ?, 'Antirrábica', date('now','-2 months'), date('now','+10 months'))")
  .run(animalIds[1], vetIds[1]);

console.log('Registrando pagamentos e folha de pagamento...');
db.prepare("INSERT INTO pagamentos (cliente_id, consulta_id, descricao, tipo, quantidade, valor, status, data) VALUES (?, ?, 'Check-up geral - Bidu', 'SERVICO', 1, 120, 'PAGO', date('now','-10 days'))")
  .run(clienteIds[0], consultaIds[4]);
db.prepare("INSERT INTO pagamentos (cliente_id, produto_id, descricao, tipo, quantidade, valor, status, data) VALUES (?, ?, 'Ração Premium Cães Adultos 15kg (x1)', 'COMPRA', 1, 189.9, 'PAGO', date('now','-9 days'))")
  .run(clienteIds[0], produtoIds[0]);
db.prepare("INSERT INTO pagamentos (cliente_id, descricao, tipo, quantidade, valor, status, data) VALUES (?, 'Banho e tosa - Thor', 'SERVICO', 1, 80, 'PAGO', date('now','-5 days'))")
  .run(clienteIds[1]);

const funcionarios = db.prepare('SELECT * FROM funcionarios').all();
funcionarios.forEach((f) => {
  const liquido = f.salario_base * 0.9;
  db.prepare(`INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_base, bonificacoes, descontos, salario_liquido, data_pagamento, status)
    VALUES (?, strftime('%Y-%m','now','-1 month'), ?, 0, ?, ?, date('now','-15 days'), 'PAGO')`)
    .run(f.id, f.salario_base, f.salario_base * 0.1, liquido);
  db.prepare(`INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_base, bonificacoes, descontos, salario_liquido, status)
    VALUES (?, strftime('%Y-%m','now'), ?, 0, 0, ?, 'PENDENTE')`)
    .run(f.id, f.salario_base, f.salario_base);
});

console.log('\nBanco populado com sucesso em: ' + arquivo);
console.log('\nCredenciais de demonstração:');
console.log('  Administrador  -> admin@petshop.com / admin123');
console.log('  Veterinário    -> veterinario@petshop.com / vet123');
console.log('  Cliente        -> cliente@petshop.com / cliente123');
