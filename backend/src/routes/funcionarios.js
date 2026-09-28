const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { falha, texto, numero, hojeISO } = require('../utils');

const router = express.Router();
router.use(autenticar, exigirPerfil('ADMINISTRADOR'));

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM funcionarios ORDER BY ativo DESC, nome').all());
});

router.post('/', (req, res) => {
  const nome = texto(req.body.nome, 120);
  const cargo = texto(req.body.cargo, 80);
  const salario_base = numero(req.body.salario_base);
  if (!nome || !cargo) falha(400, 'Informe nome e cargo.');
  if (Number.isNaN(salario_base) || salario_base < 0) falha(400, 'Informe um salário válido.');
  const id = db.prepare(`INSERT INTO funcionarios (nome, cargo, perfil_acesso, telefone, salario_base, data_admissao)
    VALUES (?, ?, 'NENHUM', ?, ?, ?)`).run(nome, cargo, texto(req.body.telefone, 30), salario_base, req.body.data_admissao || hojeISO()).lastInsertRowid;
  res.status(201).json(db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(req.params.id);
  if (!f) falha(404, 'Funcionário não encontrado.');
  const nome = texto(req.body.nome, 120) || f.nome;
  const cargo = texto(req.body.cargo, 80) || f.cargo;
  const salario_base = req.body.salario_base === undefined ? f.salario_base : numero(req.body.salario_base);
  if (Number.isNaN(salario_base) || salario_base < 0) falha(400, 'Informe um salário válido.');
  db.prepare('UPDATE funcionarios SET nome=?, cargo=?, telefone=?, salario_base=? WHERE id=?')
    .run(nome, cargo, texto(req.body.telefone, 30) || f.telefone, salario_base, f.id);
  res.json(db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(f.id));
});

router.put('/:id/status', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(req.params.id);
  if (!f) falha(404, 'Funcionário não encontrado.');
  db.prepare('UPDATE funcionarios SET ativo = ? WHERE id = ?').run(req.body.ativo ? 1 : 0, f.id);
  if (f.usuario_id) db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(req.body.ativo ? 1 : 0, f.usuario_id);
  res.json(db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(f.id));
});

module.exports = router;
