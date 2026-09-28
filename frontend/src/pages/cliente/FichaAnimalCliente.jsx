import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { Cartao, Carregando, Selo, STATUS_CONSULTA, formatarData } from '../../components/ui.jsx';
import { FormAnimal } from './MeusAnimais.jsx';

export default function FichaAnimalCliente() {
  const { id } = useParams();
  const [animal, setAnimal] = useState(null);
  const [editando, setEditando] = useState(false);

  const carregar = () => api.get(`/animais/${id}`).then(setAnimal);
  useEffect(() => { carregar(); }, [id]);

  if (!animal) return <Layout titulo="Ficha do animal"><Carregando /></Layout>;

  return (
    <Layout titulo={animal.nome} subtitulo={`${animal.especie}${animal.raca ? ` — ${animal.raca}` : ''} • ${animal.sexo}`}
      acoes={<div className="linha"><Link to="/cliente/animais" className="btn btn-secundario btn-pequeno">← Voltar</Link><button className="btn btn-primario btn-pequeno" onClick={() => setEditando(true)}>Editar dados</button></div>}>

      <div className="pilha">
        <Cartao>
          <div className="linha" style={{ alignItems: 'flex-start' }}>
            {animal.foto ? <img src={animal.foto} alt={animal.nome} className="avatar-foto" style={{ width: 84, height: 84 }} /> : <div className="avatar-inicial" style={{ width: 84, height: 84, fontSize: '1.8rem' }}>{animal.nome.charAt(0)}</div>}
            <div className="linha-campos" style={{ flex: 1 }}>
              <p><strong>Nascimento:</strong> {formatarData(animal.data_nascimento)}</p>
              <p><strong>Peso:</strong> {animal.peso ? `${animal.peso} kg` : '—'}</p>
              <p><strong>Cor:</strong> {animal.cor || '—'}</p>
              <p><strong>Alergias:</strong> {animal.alergias || 'Nenhuma registrada'}</p>
            </div>
          </div>
          {animal.observacoes && <p className="texto-suave" style={{ marginTop: '.6rem' }}>{animal.observacoes}</p>}
        </Cartao>

        <Cartao>
          <h3>Histórico de consultas</h3>
          {animal.consultas.length === 0 ? <p className="texto-suave">Nenhuma consulta registrada ainda.</p> : (
            <div className="pilha" style={{ gap: '.5rem' }}>
              {animal.consultas.map((c) => (
                <div key={c.id} className="espaco-entre" style={{ borderBottom: '1px solid var(--cor-borda)', paddingBottom: '.5rem' }}>
                  <div>{formatarData(c.data)} às {c.horario} — {c.veterinario_nome}<div className="texto-suave" style={{ fontSize: '.85rem' }}>{c.motivo}</div></div>
                  <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao>
          <h3>Vacinas</h3>
          {animal.vacinas.length === 0 ? <p className="texto-suave">Nenhuma vacina registrada ainda.</p> : (
            <div className="pilha" style={{ gap: '.5rem' }}>
              {animal.vacinas.map((v) => (
                <div key={v.id} className="espaco-entre"><span>{v.nome}</span><span className="texto-suave">{formatarData(v.data_aplicacao)}</span></div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao>
          <h3>Registros médicos (prontuários)</h3>
          <p className="texto-suave" style={{ marginTop: '-.4rem' }}>Estas informações são registradas pelo veterinário e não podem ser alteradas por aqui.</p>
          {animal.prontuarios.length === 0 ? <p className="texto-suave">Nenhum atendimento registrado ainda.</p> : (
            <div className="pilha" style={{ gap: '.8rem' }}>
              {animal.prontuarios.map((p) => (
                <div key={p.id} className="cartao" style={{ padding: '.9rem 1rem' }}>
                  <strong>{formatarData(p.data)} — {p.veterinario_nome}</strong>
                  <p style={{ margin: '.4rem 0' }}><strong>Diagnóstico:</strong> {p.diagnostico || 'Não informado'}</p>
                  {p.recomendacoes && <p style={{ margin: '.2rem 0' }}><strong>Recomendações:</strong> {p.recomendacoes}</p>}
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>

      {editando && <FormAnimal animal={animal} onFechar={() => setEditando(false)} onSalvo={() => { setEditando(false); carregar(); }} />}
    </Layout>
  );
}
