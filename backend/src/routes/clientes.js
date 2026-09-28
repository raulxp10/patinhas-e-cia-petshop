const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { clienteIdDoUsuario } = require('../queries');
const { verificarEstoqueBaixo } = require('../notificar');
const { falha, emailValido, soDigitos, texto, numero, hojeISO, dataValida } = require('../utils');

const router = express.Router();
router.use(autenticar);

const CLIENTE_SELECT = `
  SELECT c.id, c.usuario_id, u.nome, u.email, c.cpf, c.telefone, c.endereco, u.criado_em,
         (SELECT COUNT(*) FROM animais a WHERE a.cliente_id = c.id) AS total_animais
    FROM clientes c JOIN usuarios u ON u.id = c.usuario_id`;

function validarCliente(b, criando) {
  const dados = {
    nome: texto(b.nome, 120),
    email: texto(b.email, 150).toLowerCase(),
    cpf: soDigitos(b.cpf),
    telefone: texto(b.telefone, 30),
    endereco: texto(b.endereco, 250),
    senha: String(b.senha || ''),
  };
  if (!dados.nome) falha(400, 'Informe o nome.');
  if (!emailValido(dados.email)) falha(400, 'Informe um e-mail válido.');
  if (dados.cpf && dados.cpf.length !== 11) falha(400, 'O CPF deve ter 11 números.');
  if ((criando || dados.senha) && dados.senha.length < 6) falha(400, 'A senha deve ter pelo menos 6 caracteres.');
  return dados;
}

// ---------- Cliente logado: o próprio perfil ----------
router.get('/me', exigirPerfil('CLIENTE'), (req, res) => {
  res.json(db.prepare(`${CLIENTE_SELECT} WHERE c.usuario_id = ?`).get(req.usuario.id));
});

router.put('/me', exigirPerfil('CLIENTE'), (req, res) => {
  const dados = validarCliente(req.body, false);
  const { senha_atual, nova_senha } = req.body;
  const atual = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);

  let novoHash = atual.senha_hash;
  if (senha_atual || nova_senha) {
    if (!bcrypt.compareSync(String(senha_atual || ''), atual.senha_hash)) falha(400, 'A senha atual está incorreta.');
    if (String(nova_senha || '').length < 6) falha(400, 'A nova senha deve ter pelo menos 6 caracteres.');
    novoHash = bcrypt.hashSync(nova_senha, 10);
  }
  db.transaction(() => {
    db.prepare('UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?').run(dados.nome, dados.email, novoHash, req.usuario.id);
    db.prepare('UPDATE clientes SET cpf = ?, telefone = ?, endereco = ? WHERE usuario_id = ?').run(dados.cpf, dados.telefone, dados.endereco, req.usuario.id);
  })();
  res.json(db.prepare(`${CLIENTE_SELECT} WHERE c.usuario_id = ?`).get(req.usuario.id));
});

// ---------- A partir daqui, apenas administrador ----------
router.use(exigirPerfil('ADMINISTRADOR'));

router.get('/', (req, res) => {
  const q = `%${texto(req.query.q, 80)}%`;
  const lista = db.prepare(`${CLIENTE_SELECT}
    WHERE u.nome LIKE @q OR u.email LIKE @q OR c.cpf LIKE @q OR c.telefone LIKE @q
    ORDER BY u.nome`).all({ q });
  res.json(lista);
});

router.post('/', (req, res) => {
  const d = validarCliente(req.body, true);
  const id = db.transaction(() => {
    const u = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
      .run(d.nome, d.email, bcrypt.hashSync(d.senha, 10), 'CLIENTE');
    return db.prepare('INSERT INTO clientes (usuario_id, cpf, telefone, endereco) VALUES (?, ?, ?, ?)')
      .run(u.lastInsertRowid, d.cpf, d.telefone, d.endereco).lastInsertRowid;
  })();
  res.status(201).json(db.prepare(`${CLIENTE_SELECT} WHERE c.id = ?`).get(id));
});

function buscarCliente(id) {
  const c = db.prepare(`${CLIENTE_SELECT} WHERE c.id = ?`).get(id);
  if (!c) falha(404, 'Cliente não encontrado.');
  return c;
}

router.get('/:id', (req, res) => {
  const cliente = buscarCliente(req.params.id);
  const animais = db.prepare('SELECT id, nome, especie, raca, sexo, data_nascimento, peso, foto FROM animais WHERE cliente_id = ? ORDER BY nome').all(cliente.id);
  res.json({ ...cliente, animais });
});

router.put('/:id', (req, res) => {
  const cliente = buscarCliente(req.params.id);
  const d = validarCliente(req.body, false);
  db.transaction(() => {
    db.prepare('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?').run(d.nome, d.email, cliente.usuario_id);
    if (d.senha) db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(bcrypt.hashSync(d.senha, 10), cliente.usuario_id);
    db.prepare('UPDATE clientes SET cpf = ?, telefone = ?, endereco = ? WHERE id = ?').run(d.cpf, d.telefone, d.endereco, cliente.id);
  })();
  res.json(buscarCliente(cliente.id));
});

// Excluir o usuário remove em cascata: cliente, animais, consultas, prontuários e pagamentos
router.delete('/:id', (req, res) => {
  const cliente = buscarCliente(req.params.id);
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(cliente.usuario_id);
  res.json({ ok: true });
});

router.get('/:id/historico', (req, res) => {
  const cliente = buscarCliente(req.params.id);
  const consultas = db.prepare(`
    SELECT c.id, c.data, c.horario, c.motivo, c.status, a.nome AS animal_nome, uv.nome AS veterinario_nome,
           (SELECT diagnostico FROM prontuarios p WHERE p.consulta_id = c.id) AS diagnostico
      FROM consultas c
      JOIN animais a ON a.id = c.animal_id
      JOIN veterinarios v ON v.id = c.veterinario_id
      JOIN usuarios uv ON uv.id = v.usuario_id
     WHERE a.cliente_id = ? ORDER BY c.data DESC, c.horario DESC`).all(cliente.id);
  const pagamentos = db.prepare('SELECT * FROM pagamentos WHERE cliente_id = ? ORDER BY data DESC, id DESC').all(cliente.id);
  res.json({ consultas, pagamentos });
});

// Registra uma compra ou serviço pago; se houver produto, baixa o estoque
router.post('/:id/pagamentos', (req, res) => {
  const cliente = buscarCliente(req.params.id);
  const tipo = req.body.tipo;
  const status = req.body.status || 'PAGO';
  const produtoId = req.body.produto_id ? Number(req.body.produto_id) : null;
  const quantidade = produtoId ? Math.floor(numero(req.body.quantidade || 1)) : 1;
  let descricao = texto(req.body.descricao, 200);
  let valor = numero(req.body.valor);
  const data = req.body.data || hojeISO();

  if (!['SERVICO', 'COMPRA'].includes(tipo)) falha(400, 'Escolha se é compra ou serviço.');
  if (!['PAGO', 'PENDENTE'].includes(status)) falha(400, 'Status de pagamento inválido.');
  if (!dataValida(data)) falha(400, 'Data inválida.');
  if (produtoId && !(quantidade > 0)) falha(400, 'Informe uma quantidade válida.');

  const registrar = db.transaction(() => {
    if (produtoId) {
      const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId);
      if (!produto) falha(404, 'Produto não encontrado.');
      if (produto.estoque < quantidade) falha(400, `Estoque insuficiente: restam ${produto.estoque} unidade(s) de ${produto.nome}.`);
      if (!descricao) descricao = `${produto.nome} (x${quantidade})`;
      if (Number.isNaN(valor)) valor = produto.preco * quantidade;
      db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?').run(quantidade, produtoId);
      db.prepare("INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo) VALUES (?, 'SAIDA', ?, ?)")
        .run(produtoId, quantidade, `Venda para ${cliente.nome}`);
    }
    if (!descricao) falha(400, 'Informe a descrição.');
    if (Number.isNaN(valor) || valor < 0) falha(400, 'Informe um valor válido.');
    db.prepare('INSERT INTO pagamentos (cliente_id, produto_id, descricao, tipo, quantidade, valor, status, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(cliente.id, produtoId, descricao, tipo, quantidade, valor, status, data);
  });
  registrar();
  if (produtoId) verificarEstoqueBaixo(produtoId);
  res.status(201).json({ ok: true });
});

module.exports = router;
