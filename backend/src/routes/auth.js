const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { autenticar } = require('../middleware/auth');
const { falha, emailValido, texto } = require('../utils');

const router = express.Router();

const gerarToken = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
const publico = (u) => ({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil });

router.post('/login', (req, res) => {
  const email = texto(req.body.email, 150).toLowerCase();
  const senha = String(req.body.senha || '');
  if (!email || !senha) falha(400, 'Informe e-mail e senha.', 'CAMPOS_OBRIGATORIOS');
  if (!emailValido(email)) falha(400, 'Digite um e-mail válido.', 'EMAIL_INVALIDO');

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) falha(401, 'Não encontramos uma conta com esse e-mail.', 'USUARIO_INEXISTENTE');
  if (!bcrypt.compareSync(senha, usuario.senha_hash)) falha(401, 'Senha incorreta. Tente novamente.', 'SENHA_INCORRETA');
  if (!usuario.ativo) falha(403, 'Este usuário está desativado. Fale com a administração.', 'USUARIO_INATIVO');

  res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
});

// Auto cadastro: sempre cria um usuário com perfil CLIENTE
router.post('/registro', (req, res) => {
  const nome = texto(req.body.nome, 120);
  const email = texto(req.body.email, 150).toLowerCase();
  const telefone = texto(req.body.telefone, 30);
  const senha = String(req.body.senha || '');
  if (!nome) falha(400, 'Informe seu nome.');
  if (!emailValido(email)) falha(400, 'Digite um e-mail válido.');
  if (senha.length < 6) falha(400, 'A senha deve ter pelo menos 6 caracteres.');

  const criar = db.transaction(() => {
    const u = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
      .run(nome, email, bcrypt.hashSync(senha, 10), 'CLIENTE');
    db.prepare('INSERT INTO clientes (usuario_id, telefone) VALUES (?, ?)').run(u.lastInsertRowid, telefone);
    return u.lastInsertRowid;
  });
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(criar());
  res.status(201).json({ token: gerarToken(usuario), usuario: publico(usuario) });
});

router.get('/me', autenticar, (req, res) => res.json({ usuario: publico(req.usuario) }));

module.exports = router;
