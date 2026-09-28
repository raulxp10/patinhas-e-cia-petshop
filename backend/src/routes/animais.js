const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { clienteIdDoUsuario } = require('../queries');
const { falha, texto, numero, dataValida, imagemOuNula } = require('../utils');

const router = express.Router();
router.use(autenticar);

const ANIMAL_SELECT = `
  SELECT a.*, u.nome AS tutor_nome, u.email AS tutor_email, c.telefone AS tutor_telefone
    FROM animais a JOIN clientes c ON c.id = a.cliente_id JOIN usuarios u ON u.id = c.usuario_id`;

function validarAnimal(b) {
  const d = {
    nome: texto(b.nome, 60),
    especie: texto(b.especie, 40),
    raca: texto(b.raca, 60),
    sexo: b.sexo,
    data_nascimento: b.data_nascimento || null,
    peso: b.peso === '' || b.peso === undefined ? null : numero(b.peso),
    cor: texto(b.cor, 40),
    foto: imagemOuNula(b.foto),
    observacoes: texto(b.observacoes, 500),
    alergias: texto(b.alergias, 300),
  };
  if (!d.nome) falha(400, 'Informe o nome do animal.');
  if (!d.especie) falha(400, 'Informe a espécie do animal.');
  if (!['Macho', 'Fêmea'].includes(d.sexo)) falha(400, 'Informe o sexo do animal.');
  if (d.data_nascimento && !dataValida(d.data_nascimento)) falha(400, 'Data de nascimento inválida.');
  if (d.peso !== null && (Number.isNaN(d.peso) || d.peso < 0)) falha(400, 'Peso inválido.');
  return d;
}

// Verifica se o usuário logado pode acessar o animal (tutor, veterinário ou admin)
function animalPermitido(usuario, id) {
  const animal = db.prepare(`${ANIMAL_SELECT} WHERE a.id = ?`).get(id);
  if (!animal) falha(404, 'Animal não encontrado.');
  if (usuario.perfil === 'CLIENTE' && animal.cliente_id !== clienteIdDoUsuario(usuario.id)) {
    falha(403, 'Este animal pertence a outro tutor.', 'ACESSO_NEGADO');
  }
  return animal;
}

router.get('/', (req, res) => {
  const q = `%${texto(req.query.q, 80)}%`;
  let where = '(a.nome LIKE @q OR u.nome LIKE @q OR a.especie LIKE @q)';
  const params = { q };
  if (req.usuario.perfil === 'CLIENTE') {
    where += ' AND a.cliente_id = @clienteId';
    params.clienteId = clienteIdDoUsuario(req.usuario.id);
  }
  const lista = db.prepare(`${ANIMAL_SELECT} WHERE ${where} ORDER BY a.nome`).all(params);
  res.json(lista);
});

router.post('/', (req, res) => {
  const d = validarAnimal(req.body);
  let clienteId;
  if (req.usuario.perfil === 'CLIENTE') {
    clienteId = clienteIdDoUsuario(req.usuario.id);
  } else if (req.usuario.perfil === 'ADMINISTRADOR') {
    clienteId = Number(req.body.cliente_id);
    if (!clienteId) falha(400, 'Selecione o tutor do animal.');
  } else {
    falha(403, 'Veterinários não podem cadastrar animais novos.', 'ACESSO_NEGADO');
  }
  const id = db.prepare(`INSERT INTO animais (cliente_id, nome, especie, raca, sexo, data_nascimento, peso, cor, foto, observacoes, alergias)
    VALUES (@clienteId, @nome, @especie, @raca, @sexo, @data_nascimento, @peso, @cor, @foto, @observacoes, @alergias)`)
    .run({ ...d, clienteId }).lastInsertRowid;
  res.status(201).json(db.prepare(`${ANIMAL_SELECT} WHERE a.id = ?`).get(id));
});

router.get('/:id', (req, res) => {
  const animal = animalPermitido(req.usuario, req.params.id);
  const consultas = db.prepare(`
    SELECT c.id, c.data, c.horario, c.motivo, c.status, uv.nome AS veterinario_nome
      FROM consultas c JOIN veterinarios v ON v.id = c.veterinario_id JOIN usuarios uv ON uv.id = v.usuario_id
     WHERE c.animal_id = ? ORDER BY c.data DESC, c.horario DESC`).all(animal.id);
  const prontuarios = db.prepare(`
    SELECT p.*, c.data, c.horario, uv.nome AS veterinario_nome
      FROM prontuarios p JOIN consultas c ON c.id = p.consulta_id
      JOIN veterinarios v ON v.id = p.veterinario_id JOIN usuarios uv ON uv.id = v.usuario_id
     WHERE p.animal_id = ? ORDER BY c.data DESC, c.horario DESC`).all(animal.id);
  const medicamentos = db.prepare(`
    SELECT pm.* FROM prontuario_medicamentos pm JOIN prontuarios p ON p.id = pm.prontuario_id WHERE p.animal_id = ?`).all(animal.id);
  const vacinas = db.prepare('SELECT * FROM vacinas WHERE animal_id = ? ORDER BY data_aplicacao DESC').all(animal.id);
  const exames = db.prepare('SELECT * FROM exames WHERE animal_id = ? ORDER BY data DESC').all(animal.id);
  res.json({ ...animal, consultas, prontuarios, medicamentos, vacinas, exames });
});

router.put('/:id', (req, res) => {
  const animal = animalPermitido(req.usuario, req.params.id);
  if (req.usuario.perfil === 'VETERINARIO') falha(403, 'Veterinários não podem editar os dados cadastrais do animal.', 'ACESSO_NEGADO');
  const d = validarAnimal({ ...animal, ...req.body });
  db.prepare(`UPDATE animais SET nome=@nome, especie=@especie, raca=@raca, sexo=@sexo, data_nascimento=@data_nascimento,
      peso=@peso, cor=@cor, foto=@foto, observacoes=@observacoes, alergias=@alergias WHERE id=@id`)
    .run({ ...d, id: animal.id });
  res.json(db.prepare(`${ANIMAL_SELECT} WHERE a.id = ?`).get(animal.id));
});

router.delete('/:id', (req, res) => {
  const animal = animalPermitido(req.usuario, req.params.id);
  if (req.usuario.perfil === 'VETERINARIO') falha(403, 'Veterinários não podem excluir animais.', 'ACESSO_NEGADO');
  db.prepare('DELETE FROM animais WHERE id = ?').run(animal.id);
  res.json({ ok: true });
});

// Vacinas e exames — registrados pelo veterinário
router.post('/:id/vacinas', exigirPerfil('VETERINARIO', 'ADMINISTRADOR'), (req, res) => {
  const animal = animalPermitido(req.usuario, req.params.id);
  const nome = texto(req.body.nome, 80);
  const data_aplicacao = req.body.data_aplicacao;
  if (!nome) falha(400, 'Informe o nome da vacina.');
  if (!dataValida(data_aplicacao)) falha(400, 'Informe a data de aplicação.');
  const vetId = db.prepare('SELECT id FROM veterinarios WHERE usuario_id = ?').get(req.usuario.id)?.id || null;
  db.prepare('INSERT INTO vacinas (animal_id, veterinario_id, nome, data_aplicacao, proxima_dose) VALUES (?, ?, ?, ?, ?)')
    .run(animal.id, vetId, nome, data_aplicacao, req.body.proxima_dose || null);
  res.status(201).json({ ok: true });
});

module.exports = router;
