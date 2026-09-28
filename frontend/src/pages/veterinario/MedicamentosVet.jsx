import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Busca, Carregando, EstadoVazio, Selo } from '../../components/ui.jsx';

export default function MedicamentosVet() {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState(null);

  const carregar = useCallback(() => {
    api.get(`/produtos?categoria=Medicamentos&q=${encodeURIComponent(busca)}`).then(setLista);
  }, [busca]);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Medicamentos" subtitulo="Consulte os medicamentos disponíveis no estoque">
      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar medicamento por nome ou indicação" />
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="💊" titulo="Nenhum medicamento encontrado" />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>Classe</th><th>Indicação</th><th>Dosagem</th><th>Estoque</th></tr></thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id}>
                  <td>{m.nome}</td><td>{m.classe || '—'}</td><td>{m.indicacao || '—'}</td><td>{m.dosagem || '—'}</td>
                  <td>{m.estoque} un. {m.estoque <= m.estoque_minimo && <Selo tom="laranja">Baixo</Selo>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
