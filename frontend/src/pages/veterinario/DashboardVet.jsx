import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Cartao, CartaoEstat, Carregando, Selo, STATUS_CONSULTA, formatarData } from '../../components/ui.jsx';

export default function DashboardVet() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard/veterinario').then(setD); }, []);

  return (
    <Layout titulo="Painel do veterinário" subtitulo="Seus atendimentos de hoje e próximos">
      {!d ? <Carregando /> : (
        <div className="pilha">
          <div className="grade-estat">
            <CartaoEstat icone="🗓️" rotulo="Consultas hoje" valor={d.consultasHoje.length} />
            <CartaoEstat icone="📅" rotulo="Próximos atendimentos" valor={d.proximosAtendimentos.length} />
            <CartaoEstat icone="✅" rotulo="Atendimentos este mês" valor={d.totalAtendimentosMes} />
          </div>

          <Cartao>
            <div className="espaco-entre"><h3>Agenda de hoje</h3><Link to="/veterinario/agenda" className="btn btn-texto btn-pequeno">Ver agenda completa</Link></div>
            {d.consultasHoje.length === 0 ? <p className="texto-suave">Nenhuma consulta para hoje.</p> : (
              <div className="pilha" style={{ gap: '.6rem' }}>
                {d.consultasHoje.map((c) => (
                  <div key={c.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.6rem' }}>
                    <div><strong>{c.horario} — {c.animal_nome}</strong> <span className="texto-suave">({c.tutor_nome})</span><div className="texto-suave" style={{ fontSize: '.85rem' }}>{c.motivo}</div></div>
                    <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
                  </div>
                ))}
              </div>
            )}
          </Cartao>

          <Cartao>
            <h3>Atendidos recentemente</h3>
            {d.atendidosRecentemente.length === 0 ? <p className="texto-suave">Nenhum atendimento registrado ainda.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {d.atendidosRecentemente.map((c) => (
                  <div key={c.id} className="espaco-entre">
                    <span>{c.animal_nome} <span className="texto-suave">— {formatarData(c.data)}</span></span>
                  </div>
                ))}
              </div>
            )}
          </Cartao>
        </div>
      )}
    </Layout>
  );
}
