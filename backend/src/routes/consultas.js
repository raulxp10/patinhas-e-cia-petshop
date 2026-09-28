const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { clienteIdDoUsuario, veterinarioIdDoUsuario, CONSULTA_SELECT, consultaPermitida } = require('../queries');
const { notificar, notificarAdmins } = require('../notificar');
const { falha, texto, dataValida, hojeISO, HORARIOS, diaDaSemana } = require('../utils');

const router = express.Router();
router.use(autenticar);

// Horários livres de um veterinário em uma data (considera almoço e domingo fechado)
router.get('/horarios-disponiveis', (req, res) => {
  const veterinarioId = Number(req.query.veterinario_id);
  const data = req.query.data;
  if (!veterinarioId || !dataValida(data)) falha(400, 'Informe veterinário e data válidos.');
  if (diaDaSemana(data) === 0) return res.json([]); // domingo: clínica fechada
  const ocupados = new Set(
    db.prepare("SELECT horario FROM consultas WHERE veterinario_id = ? AND data = ? AND status <> 'CANCELADA'")
      .all(veterinarioId, data).map((r) => r.horario)
  );
  let livres = HORARIOS.filter((h) => !ocupados.has(h));
  if (data === hojeISO()) {
    const agora = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    livres = livres.filter((h) => h > agora);
  }
  res.json(livres);
});

router.get('/', (req, res) => {
  const { status, data, veterinario_id } = req.query;
  let where = '1=1';
  const params = {};
  if (req.usuario.perfil === 'CLIENTE') { where += ' AND cl.id = @clienteId'; params.clienteId = clienteIdDoUsuario(req.usuario.id); }
  if (req.usuario.perfil === 'VETERINARIO') { where += ' AND v.id = @vetId'; params.vetId = veterinarioIdDoUsuario(req.usuario.id); }
  if (status) { where += ' AND c.status = @status'; params.status = status; }
  if (data) { where += ' AND c.data = @data'; params.data = data; }
  if (veterinario_id && req.usuario.perfil === 'ADMINISTRADOR') { where += ' AND v.id = @vetId2'; params.vetId2 = Number(veterinario_id); }
  const lista = db.prepare(`${CONSULTA_SELECT} WHERE ${where} ORDER BY c.data, c.horario`).all(params);
  res.json(lista);
});

router.get('/:id', (req, res) => res.json(consultaPermitida(req.usuario, req.params.id)));

// Agendamento — feito pelo cliente (para si) ou pelo administrador (para qualquer cliente)
router.post('/', (req, res) => {
  const animalId = Number(req.body.animal_id);
  const veterinarioId = Number(req.body.veterinario_id);
  const data = req.body.data;
  const horario = req.body.horario;
  const motivo = texto(req.body.motivo, 300);

  if (!animalId || !veterinarioId) falha(400, 'Selecione o animal e o veterinário.');
  if (!dataValida(data)) falha(400, 'Informe uma data válida.');
  if (!HORARIOS.includes(horario)) falha(400, 'Selecione um horário válido.');
  if (!motivo) falha(400, 'Informe o motivo da consulta.');
  if (data < hojeISO()) falha(400, 'Não é possível agendar em uma data que já passou.');

  const animal = db.prepare('SELECT * FROM animais WHERE id = ?').get(animalId);
  if (!animal) falha(404, 'Animal não encontrado.');
  if (req.usuario.perfil === 'CLIENTE' && animal.cliente_id !== clienteIdDoUsuario(req.usuario.id)) {
    falha(403, 'Você só pode agendar consultas para os seus próprios animais.', 'ACESSO_NEGADO');
  }
  const vet = db.prepare('SELECT * FROM veterinarios WHERE id = ?').get(veterinarioId);
  if (!vet) falha(404, 'Veterinário não encontrado.');

  let consultaId;
  try {
    consultaId = db.prepare('INSERT INTO consultas (animal_id, veterinario_id, data, horario, motivo) VALUES (?, ?, ?, ?, ?)')
      .run(animalId, veterinarioId, data, horario, motivo).lastInsertRowid;
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) falha(409, 'Esse horário acabou de ser reservado. Escolha outro.', 'HORARIO_OCUPADO');
    throw e;
  }
  notificar(vet.usuario_id, 'CONSULTA_CONFIRMADA', `Nova consulta agendada: ${animal.nome} em ${data.split('-').reverse().join('/')} às ${horario}.`);
  res.status(201).json(consultaPermitida(req.usuario, consultaId));
});

router.put('/:id/status', (req, res) => {
  const consulta = consultaPermitida(req.usuario, req.params.id);
  const status = req.body.status;
  const validos = ['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'CANCELADA'];
  if (!validos.includes(status)) falha(400, 'Status inválido.');
  if (req.usuario.perfil === 'CLIENTE' && status !== 'CANCELADA') falha(403, 'Você só pode cancelar suas consultas.', 'ACESSO_NEGADO');
  if (consulta.status === 'REALIZADA') falha(400, 'Esta consulta já foi realizada e não pode ser alterada.');
  if (consulta.status === 'CANCELADA') falha(400, 'Esta consulta já está cancelada.');
  if (status === 'REALIZADA' && req.usuario.perfil === 'CLIENTE') falha(403, 'Apenas o veterinário pode concluir o atendimento.', 'ACESSO_NEGADO');

  db.prepare('UPDATE consultas SET status = ? WHERE id = ?').run(status, consulta.id);
  if (status === 'CANCELADA') {
    const msg = `Consulta cancelada: ${consulta.animal_nome} em ${consulta.data.split('-').reverse().join('/')} às ${consulta.horario}.`;
    notificar(db.prepare('SELECT usuario_id FROM veterinarios WHERE id = ?').get(consulta.veterinario_id).usuario_id, 'CONSULTA_CANCELADA', msg);
    notificar(db.prepare('SELECT usuario_id FROM clientes WHERE id = ?').get(consulta.cliente_id).usuario_id, 'CONSULTA_CANCELADA', msg);
  }
  if (status === 'CONFIRMADA') {
    notificar(db.prepare('SELECT usuario_id FROM clientes WHERE id = ?').get(consulta.cliente_id).usuario_id, 'CONSULTA_CONFIRMADA',
      `Sua consulta para ${consulta.animal_nome} foi confirmada para ${consulta.data.split('-').reverse().join('/')} às ${consulta.horario}.`);
  }
  res.json(consultaPermitida(req.usuario, consulta.id));
});

// Registro do atendimento (prontuário) — apenas o veterinário responsável
router.post('/:id/prontuario', exigirPerfil('VETERINARIO'), (req, res) => {
  const consulta = consultaPermitida(req.usuario, req.params.id);
  if (consulta.status === 'CANCELADA') falha(400, 'Não é possível registrar atendimento de uma consulta cancelada.');
  if (consulta.tem_prontuario) falha(400, 'Esta consulta já possui um registro de atendimento.');

  const queixa = texto(req.body.queixa_principal, 300);
  if (!queixa) falha(400, 'Informe a queixa principal.');
  const medicamentos = Array.isArray(req.body.medicamentos) ? req.body.medicamentos : [];

  const prontuarioId = db.transaction(() => {
    const id = db.prepare(`INSERT INTO prontuarios
      (consulta_id, animal_id, veterinario_id, queixa_principal, observacoes, diagnostico, peso, temperatura, recomendacoes, retorno, observacoes_adicionais)
      VALUES (@consultaId, @animalId, @veterinarioId, @queixa, @observacoes, @diagnostico, @peso, @temperatura, @recomendacoes, @retorno, @obsAdicionais)`)
      .run({
        consultaId: consulta.id, animalId: consulta.animal_id, veterinarioId: consulta.veterinario_id, queixa,
        observacoes: texto(req.body.observacoes, 500), diagnostico: texto(req.body.diagnostico, 500),
        peso: req.body.peso === '' || req.body.peso == null ? null : Number(req.body.peso),
        temperatura: req.body.temperatura === '' || req.body.temperatura == null ? null : Number(req.body.temperatura),
        recomendacoes: texto(req.body.recomendacoes, 500), retorno: texto(req.body.retorno, 100),
        obsAdicionais: texto(req.body.observacoes_adicionais, 500),
      }).lastInsertRowid;

    medicamentos.forEach((m) => {
      const nome = texto(m.nome, 100);
      if (!nome) return;
      db.prepare('INSERT INTO prontuario_medicamentos (prontuario_id, produto_id, nome, dosagem, quantidade) VALUES (?, ?, ?, ?, ?)')
        .run(id, m.produto_id || null, nome, texto(m.dosagem, 60), Math.max(0, Math.floor(Number(m.quantidade) || 0)));
    });
    db.prepare("UPDATE consultas SET status = 'REALIZADA' WHERE id = ?").run(consulta.id);
    return id;
  })();

  notificar(db.prepare('SELECT usuario_id FROM clientes WHERE id = ?').get(consulta.cliente_id).usuario_id, 'ATENDIMENTO_REGISTRADO',
    `O atendimento de ${consulta.animal_nome} foi registrado. Confira a ficha do seu animal.`);
  res.status(201).json(db.prepare('SELECT * FROM prontuarios WHERE id = ?').get(prontuarioId));
});

module.exports = router;
