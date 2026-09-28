import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Cartao, Carregando, EstadoVazio, Selo, STATUS_CONSULTA, formatarData } from '../../components/ui.jsx';

export default function DashboardCliente() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard/cliente').then(setD); }, []);

  return (
    <Layout titulo="Olá! 👋" subtitulo="Aqui está um resumo dos seus animais e consultas">
      {!d ? <Carregando /> : (
        <div className="pilha">
          <Cartao>
            <h3>Próxima consulta</h3>
            {!d.proximaConsulta ? (
              <EstadoVazio emoji="🗓️" titulo="Nenhuma consulta agendada" descricao="Que tal agendar uma consulta para o seu pet?"
                acao={<Link to="/cliente/agendar" className="btn btn-primario">Agendar consulta</Link>} />
            ) : (
              <div className="espaco-entre">
                <div>
                  <strong>{d.proximaConsulta.animal_nome}</strong> com {d.proximaConsulta.veterinario_nome}
                  <div className="texto-suave">{formatarData(d.proximaConsulta.data)} às {d.proximaConsulta.horario} • {d.proximaConsulta.motivo}</div>
                </div>
                <Selo tom={STATUS_CONSULTA[d.proximaConsulta.status].tom}>{STATUS_CONSULTA[d.proximaConsulta.status].texto}</Selo>
              </div>
            )}
          </Cartao>

          <Cartao>
            <div className="espaco-entre"><h3>Meus animais</h3><Link to="/cliente/animais" className="btn btn-texto btn-pequeno">Ver todos</Link></div>
            {d.meusAnimais.length === 0 ? (
              <EstadoVazio emoji="🐾" titulo="Você ainda não cadastrou nenhum animal." acao={<Link to="/cliente/animais" className="btn btn-primario">Adicionar meu primeiro animal</Link>} />
            ) : (
              <div className="grade-estat">
                {d.meusAnimais.map((a) => (
                  <Link key={a.id} to={`/cliente/animais/${a.id}`} className="cartao" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '.8rem', alignItems: 'center' }}>
                    {a.foto ? <img src={a.foto} alt={a.nome} className="avatar-foto" /> : <div className="avatar-inicial">{a.nome.charAt(0)}</div>}
                    <div><strong>{a.nome}</strong><div className="texto-suave" style={{ fontSize: '.85rem' }}>{a.especie}{a.raca ? ` — ${a.raca}` : ''}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </Cartao>

          <Cartao>
            <h3>Últimos atendimentos</h3>
            {d.ultimosAtendimentos.length === 0 ? <p className="texto-suave">Nenhum atendimento realizado ainda.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {d.ultimosAtendimentos.map((c) => (
                  <div key={c.id} className="espaco-entre"><span>{c.animal_nome} — {formatarData(c.data)}</span><span className="texto-suave">{c.veterinario_nome}</span></div>
                ))}
              </div>
            )}
          </Cartao>
        </div>
      )}
    </Layout>
  );
}
