import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Cartao, CartaoEstat, Carregando, Selo, STATUS_CONSULTA, formatarData, formatarMoeda } from '../../components/ui.jsx';

export default function DashboardAdmin() {
  const [d, setD] = useState(null);

  useEffect(() => { api.get('/dashboard/admin').then(setD); }, []);

  return (
    <Layout titulo="Painel administrativo" subtitulo="Visão geral da Patinhas & Cia">
      {!d ? <Carregando /> : (
        <div className="pilha">
          <div className="grade-estat">
            <CartaoEstat icone="🧑‍🤝‍🧑" rotulo="Clientes" valor={d.totalClientes} />
            <CartaoEstat icone="🐾" rotulo="Animais cadastrados" valor={d.totalAnimais} />
            <CartaoEstat icone="🗓️" rotulo="Consultas hoje" valor={d.consultasHoje} />
            <CartaoEstat icone="📅" rotulo="Consultas agendadas" valor={d.consultasAgendadas} />
            <CartaoEstat icone="🛍️" rotulo="Produtos ativos" valor={d.totalProdutos} />
            <CartaoEstat icone="👥" rotulo="Funcionários ativos" valor={d.totalFuncionarios} />
            <CartaoEstat icone="⚠️" rotulo="Estoque baixo" valor={d.produtosEstoqueBaixo} tom={d.produtosEstoqueBaixo > 0 ? 'var(--cor-alerta)' : undefined} />
            <CartaoEstat icone="💵" rotulo="Faturamento do mês" valor={formatarMoeda(d.faturamentoMes)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.2rem' }} className="responsivo-duas-colunas">
            <Cartao>
              <div className="espaco-entre"><h3>Próximas consultas</h3><Link to="/admin/consultas" className="btn btn-texto btn-pequeno">Ver todas</Link></div>
              {d.proximasConsultas.length === 0 ? <p className="texto-suave">Nenhuma consulta agendada no momento.</p> : (
                <div className="pilha" style={{ gap: '.6rem' }}>
                  {d.proximasConsultas.map((c) => (
                    <div key={c.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.6rem' }}>
                      <div>
                        <strong>{c.animal_nome}</strong> <span className="texto-suave">— {c.tutor_nome}</span>
                        <div className="texto-suave" style={{ fontSize: '.85rem' }}>{formatarData(c.data)} às {c.horario} • {c.veterinario_nome}</div>
                      </div>
                      <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
                    </div>
                  ))}
                </div>
              )}
            </Cartao>

            <Cartao>
              <div className="espaco-entre"><h3>Alertas de estoque</h3><Link to="/admin/produtos" className="btn btn-texto btn-pequeno">Ver produtos</Link></div>
              {d.produtosBaixoEstoque.length === 0 ? <p className="texto-suave">Nenhum produto com estoque baixo. 🎉</p> : (
                <div className="pilha" style={{ gap: '.6rem' }}>
                  {d.produtosBaixoEstoque.map((p) => (
                    <div key={p.id} className="espaco-entre">
                      <span>{p.nome}</span>
                      <Selo tom="laranja">{p.estoque} un. (mín. {p.estoque_minimo})</Selo>
                    </div>
                  ))}
                </div>
              )}
            </Cartao>
          </div>
        </div>
      )}
    </Layout>
  );
}
