const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { falha, emailValido, texto } = require('../utils');

const router = express.Router();
router.use(autenticar);

const VET_SELECT = `SELECT v.id, v.usuario_id, u.nome, u.email, v.crmv, v.especialidade, u.ativo
  FROM veterinarios v JOIN usuarios u ON u.id = v.usuario_id`;

// Qualquer usuário logado pode listar veterinários ativos (necessário para agendar consultas)
router.get('/', (req, res) => {
  res.json(db.prepare(`${VET_SELECT} WHERE u.ativo = 1 ORDER BY u.nome`).all());
});

router.use(exigirPerfil('ADMINISTRADOR'));

router.post('/', (req, res) => {
  const nome = texto(req.body.nome, 120);
  const email = texto(req.body.email, 150).toLowerCase();
  const crmv = texto(req.body.crmv, 30);
  const especialidade = texto(req.body.especialidade, 80);
  const senha = String(req.body.senha || '');
  if (!nome || !crmv) falha(400, 'Informe nome e CRMV.');
  if (!emailValido(email)) falha(400, 'Informe um e-mail válido.');
  if (senha.length < 6) falha(400, 'A senha deve ter pelo menos 6 caracteres.');

  const id = db.transaction(() => {
    const u = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
      .run(nome, email, bcrypt.hashSync(senha, 10), 'VETERINARIO');
    db.prepare('INSERT INTO funcionarios (usuario_id, nome, cargo, perfil_acesso, salario_base, data_admissao) VALUES (?, ?, ?, ?, ?, date(\'now\'))')
      .run(u.lastInsertRowid, nome, 'Veterinário(a)', 'VETERINARIO', Number(req.body.salario_base) || 0);
    return db.prepare('INSERT INTO veterinarios (usuario_id, crmv, especialidade) VALUES (?, ?, ?)')
      .run(u.lastInsertRowid, crmv, especialidade).lastInsertRowid;
  })();
  res.status(201).json(db.prepare(`${VET_SELECT} WHERE v.id = ?`).get(id));
});

router.put('/:id', (req, res) => {
  const vet = db.prepare(`${VET_SELECT} WHERE v.id = ?`).get(req.params.id);
  if (!vet) falha(404, 'Veterinário não encontrado.');
  const nome = texto(req.body.nome, 120) || vet.nome;
  const crmv = texto(req.body.crmv, 30) || vet.crmv;
  const especialidade = texto(req.body.especialidade, 80);
  db.transaction(() => {
    db.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').run(nome, vet.usuario_id);
    db.prepare('UPDATE veterinarios SET crmv = ?, especialidade = ? WHERE id = ?').run(crmv, especialidade, vet.id);
  })();
  res.json(db.prepare(`${VET_SELECT} WHERE v.id = ?`).get(vet.id));
});

module.exports = router;
