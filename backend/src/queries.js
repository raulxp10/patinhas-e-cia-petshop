// Consultas SQL compartilhadas entre as rotas
const db = require('./db');
const { falha } = require('./utils');

const clienteIdDoUsuario = (usuarioId) =>
  db.prepare('SELECT id FROM clientes WHERE usuario_id = ?').get(usuarioId)?.id;

const veterinarioIdDoUsuario = (usuarioId) =>
  db.prepare('SELECT id FROM veterinarios WHERE usuario_id = ?').get(usuarioId)?.id;

// Consulta com os nomes do animal, tutor e veterinário já juntados
const CONSULTA_SELECT = `
  SELECT c.id, c.data, c.horario, c.motivo, c.status, c.criada_em,
         a.id AS animal_id, a.nome AS animal_nome, a.especie AS animal_especie, a.alergias AS animal_alergias,
         cl.id AS cliente_id, uc.nome AS tutor_nome, cl.telefone AS tutor_telefone,
         v.id AS veterinario_id, uv.nome AS veterinario_nome,
         EXISTS (SELECT 1 FROM prontuarios p WHERE p.consulta_id = c.id) AS tem_prontuario
    FROM consultas c
    JOIN animais a ON a.id = c.animal_id
    JOIN clientes cl ON cl.id = a.cliente_id
    JOIN usuarios uc ON uc.id = cl.usuario_id
    JOIN veterinarios v ON v.id = c.veterinario_id
    JOIN usuarios uv ON uv.id = v.usuario_id`;

// Garante que o usuário pode acessar a consulta; devolve a consulta
function consultaPermitida(usuario, id) {
  const consulta = db.prepare(`${CONSULTA_SELECT} WHERE c.id = ?`).get(id);
  if (!consulta) falha(404, 'Consulta não encontrada.');
  if (usuario.perfil === 'CLIENTE' && consulta.cliente_id !== clienteIdDoUsuario(usuario.id)) {
    falha(403, 'Você não tem permissão para acessar esta consulta.', 'ACESSO_NEGADO');
  }
  if (usuario.perfil === 'VETERINARIO' && consulta.veterinario_id !== veterinarioIdDoUsuario(usuario.id)) {
    falha(403, 'Esta consulta pertence a outro veterinário.', 'ACESSO_NEGADO');
  }
  return consulta;
}

module.exports = { clienteIdDoUsuario, veterinarioIdDoUsuario, CONSULTA_SELECT, consultaPermitida };
