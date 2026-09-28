const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { clienteIdDoUsuario, veterinarioIdDoUsuario, CONSULTA_SELECT } = require('../queries');
const { hojeISO } = require('../utils');

const router = express.Router();
router.use(autenticar);

router.get('/admin', exigirPerfil('ADMINISTRADOR'), (req, res) => {
  const hoje = hojeISO();
  const um = (sql, ...p) => db.prepare(sql).get(...p);
  res.json({
    totalClientes: um('SELECT COUNT(*) n FROM clientes').n,
    totalAnimais: um('SELECT COUNT(*) n FROM animais').n,
    consultasHoje: um("SELECT COUNT(*) n FROM consultas WHERE data = ? AND status <> 'CANCELADA'", hoje).n,
    consultasAgendadas: um("SELECT COUNT(*) n FROM consultas WHERE status IN ('AGENDADA','CONFIRMADA') AND data >= ?", hoje).n,
    totalProdutos: um('SELECT COUNT(*) n FROM produtos WHERE ativo = 1').n,
    produtosEstoqueBaixo: um('SELECT COUNT(*) n FROM produtos WHERE ativo = 1 AND estoque <= estoque_minimo').n,
    totalFuncionarios: um('SELECT COUNT(*) n FROM funcionarios WHERE ativo = 1').n,
    faturamentoMes: um("SELECT COALESCE(SUM(valor),0) v FROM pagamentos WHERE status = 'PAGO' AND strftime('%Y-%m', data) = strftime('%Y-%m','now')").v,
    faturamentoPorMes: db.prepare(`
      SELECT strftime('%Y-%m', data) AS mes, SUM(valor) AS total FROM pagamentos WHERE status = 'PAGO'
       GROUP BY mes ORDER BY mes DESC LIMIT 6`).all().reverse(),
    proximasConsultas: db.prepare(`${CONSULTA_SELECT} WHERE c.data >= ? AND c.status IN ('AGENDADA','CONFIRMADA') ORDER BY c.data, c.horario LIMIT 6`).all(hoje),
    produtosBaixoEstoque: db.prepare('SELECT id, nome, estoque, estoque_minimo FROM produtos WHERE ativo = 1 AND estoque <= estoque_minimo ORDER BY estoque LIMIT 6').all(),
  });
});

router.get('/veterinario', exigirPerfil('VETERINARIO'), (req, res) => {
  const vetId = veterinarioIdDoUsuario(req.usuario.id);
  const hoje = hojeISO();
  res.json({
    consultasHoje: db.prepare(`${CONSULTA_SELECT} WHERE v.id = ? AND c.data = ? AND c.status <> 'CANCELADA' ORDER BY c.horario`).all(vetId, hoje),
    proximosAtendimentos: db.prepare(`${CONSULTA_SELECT} WHERE v.id = ? AND c.data > ? AND c.status IN ('AGENDADA','CONFIRMADA') ORDER BY c.data, c.horario LIMIT 5`).all(vetId, hoje),
    atendidosRecentemente: db.prepare(`${CONSULTA_SELECT} WHERE v.id = ? AND c.status = 'REALIZADA' ORDER BY c.data DESC, c.horario DESC LIMIT 5`).all(vetId),
    totalAtendimentosMes: db.prepare("SELECT COUNT(*) n FROM consultas WHERE veterinario_id = ? AND status = 'REALIZADA' AND strftime('%Y-%m', data) = strftime('%Y-%m','now')").get(vetId).n,
  });
});

router.get('/cliente', exigirPerfil('CLIENTE'), (req, res) => {
  const clienteId = clienteIdDoUsuario(req.usuario.id);
  const hoje = hojeISO();
  res.json({
    proximaConsulta: db.prepare(`${CONSULTA_SELECT} WHERE cl.id = ? AND c.data >= ? AND c.status IN ('AGENDADA','CONFIRMADA') ORDER BY c.data, c.horario LIMIT 1`).get(clienteId, hoje) || null,
    meusAnimais: db.prepare('SELECT id, nome, especie, raca, foto FROM animais WHERE cliente_id = ? ORDER BY nome').all(clienteId),
    ultimosAtendimentos: db.prepare(`${CONSULTA_SELECT} WHERE cl.id = ? AND c.status = 'REALIZADA' ORDER BY c.data DESC LIMIT 5`).all(clienteId),
  });
});

module.exports = router;
