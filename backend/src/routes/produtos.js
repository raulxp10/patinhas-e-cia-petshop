const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { verificarEstoqueBaixo } = require('../notificar');
const { falha, texto, numero, imagemOuNula } = require('../utils');

const router = express.Router();
router.use(autenticar);

const CATEGORIAS = ['Ração', 'Brinquedos', 'Higiene', 'Acessórios', 'Medicamentos', 'Outros'];

function validarProduto(b) {
  const d = {
    nome: texto(b.nome, 100),
    categoria: b.categoria,
    descricao: texto(b.descricao, 400),
    preco: numero(b.preco),
    estoque: Math.floor(numero(b.estoque)),
    estoque_minimo: Math.floor(numero(b.estoque_minimo ?? 0)),
    imagem: imagemOuNula(b.imagem),
    classe: texto(b.classe, 60),
    indicacao: texto(b.indicacao, 200),
    dosagem: texto(b.dosagem, 100),
  };
  if (!d.nome) falha(400, 'Informe o nome do produto.');
  if (!CATEGORIAS.includes(d.categoria)) falha(400, 'Escolha uma categoria válida.');
  if (Number.isNaN(d.preco) || d.preco < 0) falha(400, 'Informe um preço válido.');
  if (Number.isNaN(d.estoque) || d.estoque < 0) falha(400, 'Informe uma quantidade em estoque válida.');
  if (Number.isNaN(d.estoque_minimo) || d.estoque_minimo < 0) d.estoque_minimo = 0;
  return d;
}

// Todos os perfis logados podem consultar produtos (o veterinário usa isso na tela de medicamentos)
router.get('/', (req, res) => {
  const q = `%${texto(req.query.q, 80)}%`;
  const categoria = req.query.categoria;
  let sql = 'SELECT * FROM produtos WHERE ativo = 1 AND (nome LIKE @q OR descricao LIKE @q OR indicacao LIKE @q)';
  const params = { q };
  if (categoria && CATEGORIAS.includes(categoria)) { sql += ' AND categoria = @categoria'; params.categoria = categoria; }
  if (req.query.baixo === '1') sql += ' AND estoque <= estoque_minimo';
  sql += ' ORDER BY nome';
  res.json(db.prepare(sql).all(params));
});

router.get('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) falha(404, 'Produto não encontrado.');
  res.json(produto);
});

router.use(exigirPerfil('ADMINISTRADOR'));

router.post('/', (req, res) => {
  const d = validarProduto(req.body);
  const id = db.prepare(`INSERT INTO produtos (nome, categoria, descricao, preco, estoque, estoque_minimo, imagem, classe, indicacao, dosagem)
    VALUES (@nome, @categoria, @descricao, @preco, @estoque, @estoque_minimo, @imagem, @classe, @indicacao, @dosagem)`).run(d).lastInsertRowid;
  verificarEstoqueBaixo(id);
  res.status(201).json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) falha(404, 'Produto não encontrado.');
  const d = validarProduto(req.body);
  db.prepare(`UPDATE produtos SET nome=@nome, categoria=@categoria, descricao=@descricao, preco=@preco, estoque=@estoque,
      estoque_minimo=@estoque_minimo, imagem=@imagem, classe=@classe, indicacao=@indicacao, dosagem=@dosagem WHERE id=@id`)
    .run({ ...d, id: produto.id });
  verificarEstoqueBaixo(produto.id);
  res.json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto.id));
});

router.delete('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) falha(404, 'Produto não encontrado.');
  db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(produto.id);
  res.json({ ok: true });
});

// Ajuste manual de estoque (entrada/saída avulsa)
router.post('/:id/movimentar', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) falha(404, 'Produto não encontrado.');
  const tipo = req.body.tipo;
  const quantidade = Math.floor(numero(req.body.quantidade));
  if (!['ENTRADA', 'SAIDA'].includes(tipo)) falha(400, 'Tipo de movimentação inválido.');
  if (!(quantidade > 0)) falha(400, 'Informe uma quantidade válida.');
  if (tipo === 'SAIDA' && produto.estoque < quantidade) falha(400, 'Estoque insuficiente para essa saída.');

  db.transaction(() => {
    const novoEstoque = tipo === 'ENTRADA' ? produto.estoque + quantidade : produto.estoque - quantidade;
    db.prepare('UPDATE produtos SET estoque = ? WHERE id = ?').run(novoEstoque, produto.id);
    db.prepare('INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo) VALUES (?, ?, ?, ?)')
      .run(produto.id, tipo, quantidade, texto(req.body.motivo, 200));
  })();
  verificarEstoqueBaixo(produto.id);
  res.json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto.id));
});

module.exports = router;
