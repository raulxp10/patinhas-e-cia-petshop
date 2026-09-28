import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Busca, Carregando, EstadoVazio, Modal, ConfirmarExclusao, Campo, formatarMoeda, Selo } from '../../components/ui.jsx';

const CATEGORIAS = ['Ração', 'Brinquedos', 'Higiene', 'Acessórios', 'Medicamentos', 'Outros'];
const PRODUTO_VAZIO = { nome: '', categoria: 'Ração', descricao: '', preco: '', estoque: '', estoque_minimo: '5', classe: '', indicacao: '', dosagem: '' };

export default function ProdutosAdmin() {
  const [lista, setLista] = useState(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalForm, setModalForm] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [movimentar, setMovimentar] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => {
    const params = new URLSearchParams({ q: busca });
    if (categoria) params.set('categoria', categoria);
    api.get(`/produtos?${params}`).then(setLista).catch(() => toast.erro('Não foi possível carregar os produtos.'));
  }, [busca, categoria]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Produtos" subtitulo="Estoque da pet shop e medicamentos da clínica"
      acoes={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>+ Novo produto</button>}>

      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar produto" />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ padding: '.6em .8em', borderRadius: 10, border: '1.5px solid var(--cor-borda)' }}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🛍️" titulo="Nenhum produto encontrado" descricao="Cadastre o primeiro produto do estoque."
          acao={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>Cadastrar produto</button>} />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th></th></tr></thead>
            <tbody>
              {lista.map((p) => {
                const baixo = p.estoque <= p.estoque_minimo;
                return (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.categoria}</td>
                    <td>{formatarMoeda(p.preco)}</td>
                    <td>
                      <div className="linha" style={{ gap: '.5rem' }}>
                        {p.estoque} un. {baixo && <Selo tom="laranja">Estoque baixo</Selo>}
                      </div>
                    </td>
                    <td>
                      <div className="linha" style={{ gap: '.4rem' }}>
                        <button className="btn btn-texto btn-pequeno" onClick={() => setMovimentar(p)}>Movimentar</button>
                        <button className="btn btn-texto btn-pequeno" onClick={() => setModalForm(p)}>Editar</button>
                        <button className="btn btn-texto btn-pequeno" style={{ color: 'var(--cor-erro)' }} onClick={() => setExcluindo(p)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalForm && <FormProduto produto={modalForm === 'novo' ? null : modalForm} onFechar={() => setModalForm(null)} onSalvo={() => { setModalForm(null); carregar(); }} />}
      {movimentar && <MovimentarEstoque produto={movimentar} onFechar={() => setMovimentar(null)} onSalvo={() => { setMovimentar(null); carregar(); }} />}
      {excluindo && (
        <ConfirmarExclusao titulo="Excluir produto" mensagem={`Tem certeza que deseja excluir "${excluindo.nome}"?`}
          onCancelar={() => setExcluindo(null)}
          onConfirmar={async () => {
            try { await api.delete(`/produtos/${excluindo.id}`); toast.sucesso('Produto excluído.'); setExcluindo(null); carregar(); }
            catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível excluir.'); }
          }} />
      )}
    </Layout>
  );
}

function FormProduto({ produto, onFechar, onSalvo }) {
  const [form, setForm] = useState(produto ? { ...PRODUTO_VAZIO, ...produto } : PRODUTO_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();
  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const ehMedicamento = form.categoria === 'Medicamentos';

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome.';
    if (form.preco === '' || Number(form.preco) < 0) e.preco = 'Informe um preço válido.';
    if (form.estoque === '' || Number(form.estoque) < 0) e.estoque = 'Informe a quantidade em estoque.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const aoSalvar = async (evt) => {
    evt.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    try {
      if (produto) await api.put(`/produtos/${produto.id}`, form);
      else await api.post('/produtos', form);
      toast.sucesso(produto ? 'Produto atualizado.' : 'Produto cadastrado.');
      onSalvo();
    } catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo={produto ? 'Editar produto' : 'Novo produto'} onFechar={onFechar}>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Nome" erro={erros.nome}><input value={form.nome} onChange={mudar('nome')} /></Campo>
        <div className="linha-campos">
          <Campo label="Categoria"><select value={form.categoria} onChange={mudar('categoria')}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></Campo>
          <Campo label="Preço (R$)" erro={erros.preco}><input type="number" step="0.01" min="0" value={form.preco} onChange={mudar('preco')} /></Campo>
        </div>
        <div className="linha-campos">
          <Campo label="Estoque atual" erro={erros.estoque}><input type="number" min="0" value={form.estoque} onChange={mudar('estoque')} /></Campo>
          <Campo label="Estoque mínimo" dica="Alerta quando o estoque ficar igual ou abaixo"><input type="number" min="0" value={form.estoque_minimo} onChange={mudar('estoque_minimo')} /></Campo>
        </div>
        <Campo label="Descrição"><textarea rows={2} value={form.descricao} onChange={mudar('descricao')} /></Campo>
        {ehMedicamento && (
          <>
            <div className="linha-campos">
              <Campo label="Classe"><input value={form.classe} onChange={mudar('classe')} placeholder="Ex: Antibiótico" /></Campo>
              <Campo label="Dosagem"><input value={form.dosagem} onChange={mudar('dosagem')} placeholder="Ex: 1 comprimido a cada 12h" /></Campo>
            </div>
            <Campo label="Indicação"><input value={form.indicacao} onChange={mudar('indicacao')} /></Campo>
          </>
        )}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}

function MovimentarEstoque({ produto, onFechar, onSalvo }) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  const aoSalvar = async (e) => {
    e.preventDefault();
    if (!quantidade || Number(quantidade) <= 0) { setErro('Informe uma quantidade válida.'); return; }
    setSalvando(true);
    try {
      await api.post(`/produtos/${produto.id}/movimentar`, { tipo, quantidade, motivo });
      toast.sucesso('Estoque atualizado.');
      onSalvo();
    } catch (e) { setErro(e instanceof ErroApi ? e.message : 'Não foi possível movimentar o estoque.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo={`Movimentar estoque — ${produto.nome}`} onFechar={onFechar} largura={420}>
      <p className="texto-suave">Estoque atual: <strong>{produto.estoque} un.</strong></p>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Tipo de movimentação">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </select>
        </Campo>
        <Campo label="Quantidade"><input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></Campo>
        <Campo label="Motivo (opcional)"><input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: reposição de fornecedor" /></Campo>
        {erro && <p className="erro">{erro}</p>}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Confirmar'}</button>
        </div>
      </form>
    </Modal>
  );
}
