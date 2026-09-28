import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Cartao, Busca, Carregando, EstadoVazio, Modal, ConfirmarExclusao, Campo, formatarData, formatarMoeda, Selo, STATUS_CONSULTA } from '../../components/ui.jsx';

const CLIENTE_VAZIO = { nome: '', email: '', cpf: '', telefone: '', endereco: '', senha: '' };

export default function Clientes() {
  const [lista, setLista] = useState(null);
  const [busca, setBusca] = useState('');
  const [modalForm, setModalForm] = useState(null); // null | 'novo' | cliente
  const [modalDetalhe, setModalDetalhe] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => {
    api.get(`/clientes?q=${encodeURIComponent(busca)}`).then(setLista).catch(() => toast.erro('Não foi possível carregar os clientes.'));
  }, [busca]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Clientes" subtitulo="Cadastre e gerencie os tutores da Patinhas & Cia"
      acoes={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>+ Novo cliente</button>}>

      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar por nome, e-mail, CPF ou telefone" />
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🧑‍🤝‍🧑" titulo="Nenhum cliente encontrado" descricao="Cadastre o primeiro cliente para começar."
          acao={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>Cadastrar cliente</button>} />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Animais</th><th>Cadastro</th><th></th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.email}</td>
                  <td>{c.telefone || '—'}</td>
                  <td>{c.total_animais}</td>
                  <td>{formatarData(c.criado_em?.slice(0, 10))}</td>
                  <td>
                    <div className="linha" style={{ gap: '.4rem' }}>
                      <button className="btn btn-texto btn-pequeno" onClick={() => setModalDetalhe(c)}>Detalhes</button>
                      <button className="btn btn-texto btn-pequeno" onClick={() => setModalForm(c)}>Editar</button>
                      <button className="btn btn-texto btn-pequeno" style={{ color: 'var(--cor-erro)' }} onClick={() => setExcluindo(c)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalForm && (
        <FormCliente cliente={modalForm === 'novo' ? null : modalForm} onFechar={() => setModalForm(null)}
          onSalvo={() => { setModalForm(null); carregar(); }} />
      )}

      {modalDetalhe && <DetalheCliente id={modalDetalhe.id} onFechar={() => setModalDetalhe(null)} />}

      {excluindo && (
        <ConfirmarExclusao titulo="Excluir cliente" mensagem={`Tem certeza que deseja excluir ${excluindo.nome}? Todos os animais e o histórico associados também serão removidos.`}
          onCancelar={() => setExcluindo(null)}
          onConfirmar={async () => {
            try { await api.delete(`/clientes/${excluindo.id}`); toast.sucesso('Cliente excluído.'); setExcluindo(null); carregar(); }
            catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível excluir.'); }
          }} />
      )}
    </Layout>
  );
}

function FormCliente({ cliente, onFechar, onSalvo }) {
  const [form, setForm] = useState(cliente ? { ...CLIENTE_VAZIO, ...cliente, senha: '' } : CLIENTE_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();
  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    if (!cliente && form.senha.length < 6) e.senha = 'A senha deve ter pelo menos 6 caracteres.';
    if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'O CPF deve ter 11 números.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const aoSalvar = async (evt) => {
    evt.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    try {
      if (cliente) await api.put(`/clientes/${cliente.id}`, form);
      else await api.post('/clientes', form);
      toast.sucesso(cliente ? 'Cliente atualizado.' : 'Cliente cadastrado.');
      onSalvo();
    } catch (e) {
      toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.');
    } finally { setSalvando(false); }
  };

  return (
    <Modal titulo={cliente ? 'Editar cliente' : 'Novo cliente'} onFechar={onFechar}>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Nome completo" erro={erros.nome}><input value={form.nome} onChange={mudar('nome')} /></Campo>
        <div className="linha-campos">
          <Campo label="E-mail" erro={erros.email}><input type="email" value={form.email} onChange={mudar('email')} /></Campo>
          <Campo label="CPF" erro={erros.cpf}><input value={form.cpf} onChange={mudar('cpf')} placeholder="Somente números" /></Campo>
        </div>
        <div className="linha-campos">
          <Campo label="Telefone"><input value={form.telefone} onChange={mudar('telefone')} /></Campo>
          <Campo label={cliente ? 'Nova senha (opcional)' : 'Senha'} erro={erros.senha}>
            <input type="password" value={form.senha} onChange={mudar('senha')} placeholder={cliente ? 'Deixe em branco para manter' : ''} />
          </Campo>
        </div>
        <Campo label="Endereço"><input value={form.endereco} onChange={mudar('endereco')} /></Campo>
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}

function DetalheCliente({ id, onFechar }) {
  const [cliente, setCliente] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [aba, setAba] = useState('animais');

  useEffect(() => {
    api.get(`/clientes/${id}`).then(setCliente);
    api.get(`/clientes/${id}/historico`).then(setHistorico);
  }, [id]);

  return (
    <Modal titulo={cliente ? cliente.nome : 'Carregando...'} onFechar={onFechar} largura={640}>
      {!cliente ? <Carregando /> : (
        <div className="pilha">
          <div className="texto-suave">{cliente.email} • {cliente.telefone || 'sem telefone'} • {cliente.endereco || 'sem endereço cadastrado'}</div>
          <div className="abas">
            <button className={aba === 'animais' ? 'ativa' : ''} onClick={() => setAba('animais')}>Animais ({cliente.animais.length})</button>
            <button className={aba === 'consultas' ? 'ativa' : ''} onClick={() => setAba('consultas')}>Consultas</button>
            <button className={aba === 'pagamentos' ? 'ativa' : ''} onClick={() => setAba('pagamentos')}>Pagamentos</button>
          </div>

          {aba === 'animais' && (
            cliente.animais.length === 0 ? <p className="texto-suave">Este cliente ainda não cadastrou animais.</p> : (
              <div className="pilha" style={{ gap: '.6rem' }}>
                {cliente.animais.map((a) => (
                  <div key={a.id} className="espaco-entre cartao" style={{ padding: '.8rem 1rem' }}>
                    <div><strong>{a.nome}</strong> <span className="texto-suave">— {a.especie}{a.raca ? `, ${a.raca}` : ''}</span></div>
                    <span className="texto-suave">{a.sexo}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {aba === 'consultas' && (
            !historico ? <Carregando /> : historico.consultas.length === 0 ? <p className="texto-suave">Nenhuma consulta registrada.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {historico.consultas.map((c) => (
                  <div key={c.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.5rem' }}>
                    <div><strong>{c.animal_nome}</strong> <span className="texto-suave">— {c.motivo}</span>
                      <div className="texto-suave" style={{ fontSize: '.83rem' }}>{formatarData(c.data)} às {c.horario} • {c.veterinario_nome}</div>
                    </div>
                    <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
                  </div>
                ))}
              </div>
            )
          )}

          {aba === 'pagamentos' && (
            !historico ? <Carregando /> : historico.pagamentos.length === 0 ? <p className="texto-suave">Nenhum pagamento registrado.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {historico.pagamentos.map((p) => (
                  <div key={p.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.5rem' }}>
                    <div>{p.descricao}<div className="texto-suave" style={{ fontSize: '.83rem' }}>{formatarData(p.data)} • {p.tipo === 'SERVICO' ? 'Serviço' : 'Compra'}</div></div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{formatarMoeda(p.valor)}</div>
                      <Selo tom={p.status === 'PAGO' ? 'verde' : 'laranja'}>{p.status === 'PAGO' ? 'Pago' : 'Pendente'}</Selo>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  );
}
