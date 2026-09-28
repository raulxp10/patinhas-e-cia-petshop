const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { falha, numero, hojeISO } = require('../utils');

const router = express.Router();
router.use(autenticar, exigirPerfil('ADMINISTRADOR'));

const FOLHA_SELECT = `SELECT fp.*, f.nome AS funcionario_nome, f.cargo
  FROM folha_pagamento fp JOIN funcionarios f ON f.id = fp.funcionario_id`;

router.get('/', (req, res) => {
  const mes = req.query.mes;
  const sql = mes ? `${FOLHA_SELECT} WHERE fp.mes_referencia = ? ORDER BY f.nome` : `${FOLHA_SELECT} ORDER BY fp.mes_referencia DESC, f.nome`;
  res.json(mes ? db.prepare(sql).all(mes) : db.prepare(sql).all());
});

// Gera (ou atualiza, se ainda pendente) o lançamento do mês para um funcionário
router.post('/', (req, res) => {
  const funcionarioId = Number(req.body.funcionario_id);
  const mes = req.body.mes_referencia;
  const bonificacoes = numero(req.body.bonificacoes || 0);
  const descontos = numero(req.body.descontos || 0);
  if (!funcionarioId || !/^\d{4}-\d{2}$/.test(mes || '')) falha(400, 'Selecione o funcionário e o mês de referência.');

  const func = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(funcionarioId);
  if (!func) falha(404, 'Funcionário não encontrado.');
  const liquido = func.salario_base + bonificacoes - descontos;
  if (liquido < 0) falha(400, 'Os descontos não podem ser maiores que o salário mais as bonificações.');

  const existente = db.prepare('SELECT * FROM folha_pagamento WHERE funcionario_id = ? AND mes_referencia = ?').get(funcionarioId, mes);
  if (existente && existente.status === 'PAGO') falha(400, 'Este mês já foi pago e não pode ser alterado.');

  if (existente) {
    db.prepare('UPDATE folha_pagamento SET salario_base=?, bonificacoes=?, descontos=?, salario_liquido=? WHERE id=?')
      .run(func.salario_base, bonificacoes, descontos, liquido, existente.id);
    return res.json(db.prepare(`${FOLHA_SELECT} WHERE fp.id = ?`).get(existente.id));
  }
  const id = db.prepare(`INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_base, bonificacoes, descontos, salario_liquido)
    VALUES (?, ?, ?, ?, ?, ?)`).run(funcionarioId, mes, func.salario_base, bonificacoes, descontos, liquido).lastInsertRowid;
  res.status(201).json(db.prepare(`${FOLHA_SELECT} WHERE fp.id = ?`).get(id));
});

router.put('/:id/pagar', (req, res) => {
  const lancamento = db.prepare('SELECT * FROM folha_pagamento WHERE id = ?').get(req.params.id);
  if (!lancamento) falha(404, 'Lançamento não encontrado.');
  if (lancamento.status === 'PAGO') falha(400, 'Este lançamento já foi pago.');
  db.prepare("UPDATE folha_pagamento SET status = 'PAGO', data_pagamento = ? WHERE id = ?").run(hojeISO(), lancamento.id);
  res.json(db.prepare(`${FOLHA_SELECT} WHERE fp.id = ?`).get(lancamento.id));
});

module.exports = router;
