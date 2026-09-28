import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Carregando, EstadoVazio, Modal, Campo, Selo, formatarMoeda } from '../../components/ui.jsx';

const FUNC_VAZIO = { nome: '', cargo: '', telefone: '', salario_base: '' };

export default function Funcionarios() {
  const [lista, setLista] = useState(null);
  const [modalForm, setModalForm] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => { api.get('/funcionarios').then(setLista); }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const alternarStatus = async (f) => {
    try { await api.put(`/funcionarios/${f.id}/status`, { ativo: f.ativo ? 0 : 1 }); toast.sucesso(f.ativo ? 'Funcionário desativado.' : 'Funcionário ativado.'); carregar(); }
    catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível atualizar.'); }
  };

  return (
    <Layout titulo="Funcionários" subtitulo="Equipe da Patinhas & Cia (veterinários são cadastrados na tela de Veterinários)"
      acoes={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>+ Novo funcionário</button>}>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="👥" titulo="Nenhum funcionário cadastrado" acao={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>Cadastrar funcionário</button>} />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>Cargo</th><th>Telefone</th><th>Salário base</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.id}>
                  <td>{f.nome}</td><td>{f.cargo}</td><td>{f.telefone || '—'}</td><td>{formatarMoeda(f.salario_base)}</td>
                  <td><Selo tom={f.ativo ? 'verde' : 'cinza'}>{f.ativo ? 'Ativo' : 'Inativo'}</Selo></td>
                  <td>
                    <div className="linha" style={{ gap: '.4rem' }}>
                      <button className="btn btn-texto btn-pequeno" onClick={() => setModalForm(f)}>Editar</button>
                      <button className="btn btn-texto btn-pequeno" onClick={() => alternarStatus(f)}>{f.ativo ? 'Desativar' : 'Ativar'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalForm && <FormFuncionario funcionario={modalForm === 'novo' ? null : modalForm} onFechar={() => setModalForm(null)} onSalvo={() => { setModalForm(null); carregar(); }} />}
    </Layout>
  );
}

function FormFuncionario({ funcionario, onFechar, onSalvo }) {
  const [form, setForm] = useState(funcionario ? { ...FUNC_VAZIO, ...funcionario } : FUNC_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();
  const mudar = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome.';
    if (!form.cargo.trim()) e.cargo = 'Informe o cargo.';
    if (form.salario_base === '' || Number(form.salario_base) < 0) e.salario_base = 'Informe um salário válido.';
    setErros(e); return Object.keys(e).length === 0;
  };

  const aoSalvar = async (evt) => {
    evt.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    try {
      if (funcionario) await api.put(`/funcionarios/${funcionario.id}`, form);
      else await api.post('/funcionarios', form);
      toast.sucesso(funcionario ? 'Funcionário atualizado.' : 'Funcionário cadastrado.');
      onSalvo();
    } catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo={funcionario ? 'Editar funcionário' : 'Novo funcionário'} onFechar={onFechar}>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Nome" erro={erros.nome}><input value={form.nome} onChange={mudar('nome')} /></Campo>
        <div className="linha-campos">
          <Campo label="Cargo" erro={erros.cargo}><input value={form.cargo} onChange={mudar('cargo')} /></Campo>
          <Campo label="Telefone"><input value={form.telefone} onChange={mudar('telefone')} /></Campo>
        </div>
        <Campo label="Salário base (R$)" erro={erros.salario_base}><input type="number" step="0.01" min="0" value={form.salario_base} onChange={mudar('salario_base')} /></Campo>
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
