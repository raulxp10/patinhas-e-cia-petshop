import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Busca, Carregando, EstadoVazio, Modal, Selo, STATUS_CONSULTA, formatarData } from '../../components/ui.jsx';

export default function AnimaisVet() {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState(null);
  const [selecionado, setSelecionado] = useState(null);

  const carregar = useCallback(() => { api.get(`/animais?q=${encodeURIComponent(busca)}`).then(setLista); }, [busca]);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Animais" subtitulo="Pesquise um animal para ver sua ficha e histórico médico">
      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar por nome do animal, espécie ou tutor" />
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🐾" titulo="Nenhum animal encontrado" descricao="Tente pesquisar por outro termo." />
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>Espécie / raça</th><th>Tutor</th><th></th></tr></thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td><td>{a.especie}{a.raca ? ` — ${a.raca}` : ''}</td><td>{a.tutor_nome}</td>
                  <td><button className="btn btn-texto btn-pequeno" onClick={() => setSelecionado(a.id)}>Ver ficha</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selecionado && <FichaAnimal id={selecionado} onFechar={() => setSelecionado(null)} />}
    </Layout>
  );
}

function FichaAnimal({ id, onFechar }) {
  const [animal, setAnimal] = useState(null);
  const [aba, setAba] = useState('resumo');

  useEffect(() => { api.get(`/animais/${id}`).then(setAnimal); }, [id]);

  return (
    <Modal titulo={animal ? animal.nome : 'Carregando...'} onFechar={onFechar} largura={680}>
      {!animal ? <Carregando /> : (
        <div className="pilha">
          <div className="linha" style={{ alignItems: 'flex-start' }}>
            {animal.foto ? <img src={animal.foto} alt={animal.nome} className="avatar-inicial" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }} /> : <div className="avatar-inicial" style={{ width: 64, height: 64, borderRadius: 14, fontSize: '1.6rem' }}>{animal.nome.charAt(0)}</div>}
            <div>
              <p style={{ margin: 0 }}><strong>{animal.especie}</strong>{animal.raca ? ` — ${animal.raca}` : ''} • {animal.sexo}</p>
              <p className="texto-suave" style={{ margin: '.2rem 0 0' }}>Tutor: {animal.tutor_nome} • {animal.tutor_telefone}</p>
              {animal.alergias && <p style={{ color: 'var(--cor-erro)', margin: '.3rem 0 0', fontWeight: 700 }}>⚠️ Alergias: {animal.alergias}</p>}
            </div>
          </div>

          <div className="abas">
            <button className={aba === 'resumo' ? 'ativa' : ''} onClick={() => setAba('resumo')}>Dados</button>
            <button className={aba === 'consultas' ? 'ativa' : ''} onClick={() => setAba('consultas')}>Consultas</button>
            <button className={aba === 'prontuarios' ? 'ativa' : ''} onClick={() => setAba('prontuarios')}>Prontuários</button>
            <button className={aba === 'vacinas' ? 'ativa' : ''} onClick={() => setAba('vacinas')}>Vacinas</button>
          </div>

          {aba === 'resumo' && (
            <div className="linha-campos" style={{ fontSize: '.92rem' }}>
              <p><strong>Nascimento:</strong> {formatarData(animal.data_nascimento)}</p>
              <p><strong>Peso:</strong> {animal.peso ? `${animal.peso} kg` : '—'}</p>
              <p><strong>Cor:</strong> {animal.cor || '—'}</p>
              <p style={{ gridColumn: '1 / -1' }}><strong>Observações:</strong> {animal.observacoes || 'Nenhuma.'}</p>
            </div>
          )}

          {aba === 'consultas' && (
            animal.consultas.length === 0 ? <p className="texto-suave">Nenhuma consulta registrada.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {animal.consultas.map((c) => (
                  <div key={c.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.5rem' }}>
                    <div>{formatarData(c.data)} às {c.horario} — {c.veterinario_nome}<div className="texto-suave" style={{ fontSize: '.85rem' }}>{c.motivo}</div></div>
                    <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
                  </div>
                ))}
              </div>
            )
          )}

          {aba === 'prontuarios' && (
            animal.prontuarios.length === 0 ? <p className="texto-suave">Nenhum atendimento registrado ainda.</p> : (
              <div className="pilha" style={{ gap: '.8rem' }}>
                {animal.prontuarios.map((p) => (
                  <div key={p.id} className="cartao" style={{ padding: '.9rem 1rem' }}>
                    <div className="espaco-entre"><strong>{formatarData(p.data)} — {p.veterinario_nome}</strong></div>
                    <p style={{ margin: '.4rem 0' }}><strong>Queixa:</strong> {p.queixa_principal}</p>
                    {p.diagnostico && <p style={{ margin: '.2rem 0' }}><strong>Diagnóstico:</strong> {p.diagnostico}</p>}
                    {p.recomendacoes && <p style={{ margin: '.2rem 0' }}><strong>Recomendações:</strong> {p.recomendacoes}</p>}
                  </div>
                ))}
              </div>
            )
          )}

          {aba === 'vacinas' && (
            animal.vacinas.length === 0 ? <p className="texto-suave">Nenhuma vacina registrada.</p> : (
              <div className="pilha" style={{ gap: '.5rem' }}>
                {animal.vacinas.map((v) => (
                  <div key={v.id} className="espaco-entre">
                    <span>{v.nome}</span>
                    <span className="texto-suave">{formatarData(v.data_aplicacao)}{v.proxima_dose ? ` • próxima: ${formatarData(v.proxima_dose)}` : ''}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  );
}
