import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErroApi } from '../lib/api.js';

export default function Registro() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const aoEnviar = async (e) => {
    e.preventDefault();
    setErro('');
    if (!form.nome || !form.email || !form.senha) { setErro('Preencha nome, e-mail e senha.'); return; }
    setEnviando(true);
    try {
      await registrar(form);
      navigate('/cliente', { replace: true });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="tela-auth">
      <div className="lado-arte">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontFamily: 'var(--fonte-titulo)', fontSize: '1.3rem' }}>🐾 Patinhas & Cia</Link>
        <div>
          <h2 style={{ color: 'white' }}>Crie sua conta de cliente</h2>
          <p style={{ opacity: .9 }}>Cadastre seus animais e agende consultas em poucos cliques.</p>
        </div>
      </div>
      <div className="lado-form">
        <div className="caixa-auth">
          <h2>Criar conta</h2>
          <form onSubmit={aoEnviar} noValidate>
            <div className="campo">
              <label htmlFor="nome">Nome completo</label>
              <input id="nome" value={form.nome} onChange={mudar('nome')} />
            </div>
            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" value={form.email} onChange={mudar('email')} autoComplete="username" />
            </div>
            <div className="campo">
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" value={form.telefone} onChange={mudar('telefone')} placeholder="(11) 90000-0000" />
            </div>
            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input id="senha" type="password" value={form.senha} onChange={mudar('senha')} autoComplete="new-password" />
              <span className="dica">Pelo menos 6 caracteres.</span>
            </div>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Criando conta...' : 'Criar conta'}</button>
          </form>
          <p className="texto-suave" style={{ marginTop: '1rem', fontSize: '.9rem' }}>
            Já tem conta? <Link to="/entrar" style={{ color: 'var(--cor-primaria-forte)', fontWeight: 700 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
