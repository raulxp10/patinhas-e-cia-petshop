import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Cartao, Carregando, Campo } from '../../components/ui.jsx';

export default function MeuPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState(null);
  const [senhas, setSenhas] = useState({ senha_atual: '', nova_senha: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  useEffect(() => { api.get('/clientes/me').then((p) => { setPerfil(p); setForm(p); }); }, []);
  const mudar = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));
  const mudarSenha = (c) => (e) => setSenhas((s) => ({ ...s, [c]: e.target.value }));

  const aoSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    if (senhas.nova_senha && senhas.nova_senha.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setSalvando(true);
    try {
      const atualizado = await api.put('/clientes/me', { ...form, ...senhas });
      setPerfil(atualizado); setForm(atualizado);
      setSenhas({ senha_atual: '', nova_senha: '' });
      toast.sucesso('Perfil atualizado.');
    } catch (e) { setErro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  };

  if (!perfil || !form) return <Layout titulo="Meu perfil"><Carregando /></Layout>;

  return (
    <Layout titulo="Meu perfil" subtitulo="Mantenha seus dados atualizados">
      <Cartao style={{ maxWidth: 520 }}>
        <form onSubmit={aoSalvar} noValidate>
          <Campo label="Nome completo"><input value={form.nome} onChange={mudar('nome')} /></Campo>
          <Campo label="E-mail"><input type="email" value={form.email} onChange={mudar('email')} /></Campo>
          <div className="linha-campos">
            <Campo label="CPF"><input value={form.cpf || ''} onChange={mudar('cpf')} /></Campo>
            <Campo label="Telefone"><input value={form.telefone || ''} onChange={mudar('telefone')} /></Campo>
          </div>
          <Campo label="Endereço"><input value={form.endereco || ''} onChange={mudar('endereco')} /></Campo>

          <h3 style={{ marginTop: '1.4rem' }}>Alterar senha</h3>
          <div className="linha-campos">
            <Campo label="Senha atual"><input type="password" value={senhas.senha_atual} onChange={mudarSenha('senha_atual')} /></Campo>
            <Campo label="Nova senha"><input type="password" value={senhas.nova_senha} onChange={mudarSenha('nova_senha')} /></Campo>
          </div>

          {erro && <p className="erro">{erro}</p>}
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
        </form>
      </Cartao>
    </Layout>
  );
}
