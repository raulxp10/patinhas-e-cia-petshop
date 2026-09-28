import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Carregando, EstadoVazio, Selo, STATUS_CONSULTA, formatarData } from '../../components/ui.jsx';

const FILTROS = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'AGENDADA', rotulo: 'Agendadas' },
  { valor: 'CONFIRMADA', rotulo: 'Confirmadas' },
  { valor: 'REALIZADA', rotulo: 'Realizadas' },
  { valor: 'CANCELADA', rotulo: 'Canceladas' },
];

export default function ConsultasAdmin() {
  const [status, setStatus] = useState('');
  const [lista, setLista] = useState(null);

  const carregar = useCallback(() => {
    const params = status ? `?status=${status}` : '';
    api.get(`/consultas${params}`).then(setLista);
  }, [status]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Consultas" subtitulo="Todas as consultas da clínica">
      <div className="abas" style={{ maxWidth: 560 }}>
        {FILTROS.map((f) => (
          <button key={f.valor} className={status === f.valor ? 'ativa' : ''} onClick={() => setStatus(f.valor)}>{f.rotulo}</button>
        ))}
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🗓️" titulo="Nenhuma consulta encontrada" descricao="Não há consultas para este filtro." />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Data</th><th>Horário</th><th>Animal</th><th>Tutor</th><th>Veterinário</th><th>Motivo</th><th>Status</th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{formatarData(c.data)}</td><td>{c.horario}</td><td>{c.animal_nome}</td><td>{c.tutor_nome}</td>
                  <td>{c.veterinario_nome}</td><td>{c.motivo}</td>
                  <td><Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
