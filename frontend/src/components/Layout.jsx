import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const MENUS = {
  ADMINISTRADOR: [
    { to: '/admin', fim: true, icone: '📊', rotulo: 'Painel' },
    { to: '/admin/clientes', icone: '🧑‍🤝‍🧑', rotulo: 'Clientes' },
    { to: '/admin/consultas', icone: '🗓️', rotulo: 'Consultas' },
    { to: '/admin/produtos', icone: '🛍️', rotulo: 'Produtos' },
    { to: '/admin/funcionarios', icone: '👥', rotulo: 'Funcionários' },
    { to: '/admin/folha-pagamento', icone: '💰', rotulo: 'Folha de pagamento' },
  ],
  VETERINARIO: [
    { to: '/veterinario', fim: true, icone: '📊', rotulo: 'Painel' },
    { to: '/veterinario/agenda', icone: '🗓️', rotulo: 'Agenda' },
    { to: '/veterinario/animais', icone: '🐾', rotulo: 'Animais' },
    { to: '/veterinario/medicamentos', icone: '💊', rotulo: 'Medicamentos' },
  ],
  CLIENTE: [
    { to: '/cliente', fim: true, icone: '📊', rotulo: 'Início' },
    { to: '/cliente/animais', icone: '🐾', rotulo: 'Meus animais' },
    { to: '/cliente/agendar', icone: '🗓️', rotulo: 'Agendar consulta' },
    { to: '/cliente/consultas', icone: '📋', rotulo: 'Minhas consultas' },
    { to: '/cliente/perfil', icone: '⚙️', rotulo: 'Meu perfil' },
  ],
};

const NOME_PERFIL = { ADMINISTRADOR: 'Administrador(a)', VETERINARIO: 'Veterinário(a)', CLIENTE: 'Cliente' };

export default function Layout({ children, titulo, subtitulo, acoes }) {
  const { usuario, sair } = useAuth();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [notifAberta, setNotifAberta] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();

  const carregarNotificacoes = useCallback(() => {
    api.get('/notificacoes').then(setNotificacoes).catch(() => {});
  }, []);

  useEffect(() => {
    carregarNotificacoes();
    const t = setInterval(carregarNotificacoes, 60000);
    return () => clearInterval(t);
  }, [carregarNotificacoes]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const menus = MENUS[usuario.perfil] || [];

  const marcarTodasLidas = () => {
    api.put('/notificacoes/marcar-todas-lidas').then(() => setNotificacoes((n) => n.map((x) => ({ ...x, lida: 1 }))));
  };

  return (
    <div className="app-shell">
      {sidebarAberta && <div className="overlay-mobile" onClick={() => setSidebarAberta(false)} />}
      <aside className={`app-sidebar ${sidebarAberta ? 'aberta' : ''}`}>
        <div className="marca">🐾 Patinhas & Cia</div>
        <nav>
          {menus.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.fim} onClick={() => setSidebarAberta(false)}
              className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <span>{m.icone}</span> {m.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="rodape-sidebar">
          Logado como<br /><strong style={{ color: '#F4F1E8' }}>{NOME_PERFIL[usuario.perfil]}</strong>
        </div>
      </aside>

      <div className="app-conteudo">
        <header className="app-topbar">
          <div className="linha">
            <button className="menu-mobile-botao" onClick={() => setSidebarAberta(true)} aria-label="Abrir menu">☰</button>
          </div>
          <div className="linha">
            <div style={{ position: 'relative' }}>
              <button className="btn btn-texto" onClick={() => setNotifAberta((v) => !v)} aria-label="Notificações">
                🔔 {naoLidas > 0 && <Selinho n={naoLidas} />}
              </button>
              {notifAberta && (
                <div className="cartao" style={{ position: 'absolute', right: 0, top: '110%', width: 320, zIndex: 40 }}>
                  <div className="espaco-entre" style={{ marginBottom: '.6rem' }}>
                    <strong>Notificações</strong>
                    {naoLidas > 0 && <button className="btn btn-texto btn-pequeno" onClick={marcarTodasLidas}>Marcar todas como lidas</button>}
                  </div>
                  <div className="lista-notificacoes">
                    {notificacoes.length === 0 && <p className="texto-suave" style={{ margin: 0 }}>Nenhuma notificação por aqui.</p>}
                    {notificacoes.map((n) => (
                      <div key={n.id} className={`item-notificacao ${!n.lida ? 'nao-lida' : ''}`}>
                        {n.mensagem}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="linha" style={{ gap: '.6rem' }}>
              <div className="avatar-inicial">{usuario.nome.charAt(0).toUpperCase()}</div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{usuario.nome}</div>
                <div className="texto-suave" style={{ fontSize: '.78rem' }}>{NOME_PERFIL[usuario.perfil]}</div>
              </div>
            </div>
            <button className="btn btn-secundario btn-pequeno" onClick={() => sair()}>Sair</button>
          </div>
        </header>

        <main className="app-main">
          {(titulo || acoes) && (
            <div className="titulo-pagina">
              <div>
                <h1>{titulo}</h1>
                {subtitulo && <p>{subtitulo}</p>}
              </div>
              {acoes}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function Selinho({ n }) {
  return (
    <span style={{
      position: 'absolute', top: -2, right: -2, background: 'var(--cor-erro)', color: 'white',
      borderRadius: '999px', fontSize: '.65rem', minWidth: 16, height: 16, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontWeight: 800,
    }}>{n}</span>
  );
}
