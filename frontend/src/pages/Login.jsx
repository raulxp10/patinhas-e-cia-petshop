import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { INICIO_POR_PERFIL } from '../components/RotaProtegida.jsx';
import { ErroApi } from '../lib/api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const local = useLocation();

  const preencherDemo = (tipoEmail, tipoSenha) => { setEmail(tipoEmail); setSenha(tipoSenha); setErro(''); };

  const aoEnviar = async (e) => {
    e.preventDefault();
    setErro('');
    if (!email || !senha) { setErro('Preencha e-mail e senha para continuar.'); return; }
    setEnviando(true);
    try {
      const usuario = await entrar(email.trim(), senha);
      const destino = local.state?.de || INICIO_POR_PERFIL[usuario.perfil];
      navigate(destino, { replace: true });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="tela-auth">
      <div className="lado-arte">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontFamily: 'var(--fonte-titulo)', fontSize: '1.3rem' }}>🐾 Patinhas & Cia</Link>
        <div>
          <h2 style={{ color: 'white' }}>Tudo o que seu pet precisa, em um só lugar.</h2>
          <p style={{ opacity: .9 }}>Acesse o sistema para acompanhar consultas, animais, agenda e muito mais.</p>
        </div>
      </div>
      <div className="lado-form">
        <div className="caixa-auth">
          <h2>Entrar</h2>
          <p className="texto-suave" style={{ marginTop: 0 }}>Use suas credenciais para acessar seu painel.</p>

          <form onSubmit={aoEnviar} noValidate>
            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="voce@exemplo.com" />
            </div>
            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
            </div>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
          </form>

          <p className="texto-suave" style={{ marginTop: '1rem', fontSize: '.9rem' }}>
            Ainda não tem conta? <Link to="/registrar" style={{ color: 'var(--cor-primaria-forte)', fontWeight: 700 }}>Cadastre-se como cliente</Link>
          </p>

          <div className="credenciais-demo">
            <strong>Credenciais de demonstração</strong>
            <p style={{ margin: '.5rem 0' }}>Clique para preencher automaticamente:</p>
            <div className="pilha" style={{ gap: '.4rem' }}>
              <button type="button" className="btn btn-texto btn-pequeno" style={{ justifyContent: 'flex-start' }} onClick={() => preencherDemo('admin@petshop.com', 'admin123')}>
                👑 Administrador — <code>admin@petshop.com</code>
              </button>
              <button type="button" className="btn btn-texto btn-pequeno" style={{ justifyContent: 'flex-start' }} onClick={() => preencherDemo('veterinario@petshop.com', 'vet123')}>
                🩺 Veterinário — <code>veterinario@petshop.com</code>
              </button>
              <button type="button" className="btn btn-texto btn-pequeno" style={{ justifyContent: 'flex-start' }} onClick={() => preencherDemo('cliente@petshop.com', 'cliente123')}>
                🐾 Cliente — <code>cliente@petshop.com</code>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
