import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Cartao, Carregando, EstadoVazio, Selo, STATUS_CONSULTA, formatarData, ConfirmarExclusao } from '../../components/ui.jsx';

export default function MinhasConsultas() {
  const [lista, setLista] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => { api.get('/consultas').then(setLista); }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const podeCancelar = (c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA';

  return (
    <Layout titulo="Minhas consultas" subtitulo="Consultas agendadas, realizadas e canceladas"
      acoes={<Link to="/cliente/agendar" className="btn btn-primario">+ Agendar consulta</Link>}>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🗓️" titulo="Você ainda não tem consultas" acao={<Link to="/cliente/agendar" className="btn btn-primario">Agendar minha primeira consulta</Link>} />
      ) : (
        <div className="pilha" style={{ gap: '.8rem' }}>
          {lista.map((c) => (
            <Cartao key={c.id}>
              <div className="espaco-entre">
                <div>
                  <strong>{c.animal_nome}</strong> <span className="texto-suave">com {c.veterinario_nome}</span>
                  <div className="texto-suave" style={{ fontSize: '.88rem' }}>{formatarData(c.data)} às {c.horario} • {c.motivo}</div>
                </div>
                <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
              </div>
              {podeCancelar(c) && (
                <div className="linha" style={{ marginTop: '.8rem' }}>
                  <button className="btn btn-texto btn-pequeno" style={{ color: 'var(--cor-erro)' }} onClick={() => setCancelando(c)}>Cancelar consulta</button>
                </div>
              )}
            </Cartao>
          ))}
        </div>
      )}

      {cancelando && (
        <ConfirmarExclusao titulo="Cancelar consulta" mensagem={`Deseja realmente cancelar a consulta de ${cancelando.animal_nome} em ${formatarData(cancelando.data)} às ${cancelando.horario}?`}
          onCancelar={() => setCancelando(null)}
          onConfirmar={async () => {
            try { await api.put(`/consultas/${cancelando.id}/status`, { status: 'CANCELADA' }); toast.sucesso('Consulta cancelada.'); setCancelando(null); carregar(); }
            catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível cancelar.'); }
          }} />
      )}
    </Layout>
  );
}
