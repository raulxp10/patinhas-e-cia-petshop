const jwt = require('jsonwebtoken');
const db = require('../db');
const { falha } = require('../utils');

// Exige um token válido e carrega o usuário em req.usuario
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!token) falha(401, 'Faça login para continuar.', 'NAO_AUTENTICADO');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') falha(401, 'Sua sessão expirou. Entre novamente.', 'SESSAO_EXPIRADA');
    falha(401, 'Sessão inválida. Entre novamente.', 'SESSAO_INVALIDA');
  }

  // Confere no banco: o usuário pode ter sido desativado depois do login
  const usuario = db.prepare('SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = ?').get(payload.id);
  if (!usuario) falha(401, 'Sessão inválida. Entre novamente.', 'SESSAO_INVALIDA');
  if (!usuario.ativo) falha(401, 'Este usuário foi desativado.', 'SESSAO_INVALIDA');

  req.usuario = usuario;
  next();
}

// Restringe a rota a determinados perfis
const exigirPerfil = (...perfis) => (req, res, next) => {
  if (!perfis.includes(req.usuario.perfil)) {
    falha(403, 'Você não tem permissão para acessar este recurso.', 'ACESSO_NEGADO');
  }
  next();
};

module.exports = { autenticar, exigirPerfil };
