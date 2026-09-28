const express = require('express');
const db = require('../db');
const { autenticar } = require('../middleware/auth');
const { clienteIdDoUsuario, veterinarioIdDoUsuario } = require('../queries');
const { gerarLembretes } = require('../notificar');

const router = express.Router();
router.use(autenticar);

router.get('/', (req, res) => {
  gerarLembretes(req.usuario, clienteIdDoUsuario(req.usuario.id), veterinarioIdDoUsuario(req.usuario.id));
  const lista = db.prepare('SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY lida, criada_em DESC LIMIT 40').all(req.usuario.id);
  res.json(lista);
});

router.put('/:id/lida', (req, res) => {
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?').run(req.params.id, req.usuario.id);
  res.json({ ok: true });
});

router.put('/marcar-todas-lidas', (req, res) => {
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?').run(req.usuario.id);
  res.json({ ok: true });
});

module.exports = router;
