import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Cartao, Carregando, EstadoVazio, formatarData } from '../../components/ui.jsx';

const hojeISO = () => new Date().toISOString().slice(0, 10);
const PASSOS = ['Animal', 'Veterinário', 'Data e horário', 'Motivo', 'Confirmar'];

export default function Agendar() {
  const [passo, setPasso] = useState(0);
  const [animais, setAnimais] = useState(null);
  const [veterinarios, setVeterinarios] = useState(null);
  const [animalId, setAnimalId] = useState(null);
  const [veterinarioId, setVeterinarioId] = useState(null);
  const [data, setData] = useState(hojeISO());
  const [horarios, setHorarios] = useState(null);
  const [horario, setHorario] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => { api.get('/animais').then(setAnimais); api.get('/veterinarios').then(setVeterinarios); }, []);

  useEffect(() => {
    if (passo !== 2 || !veterinarioId) return;
    setHorarios(null); setHorario(null);
    api.get(`/consultas/horarios-disponiveis?veterinario_id=${veterinarioId}&data=${data}`).then(setHorarios);
  }, [passo, veterinarioId, data]);

  const animal = animais?.find((a) => a.id === animalId);
  const veterinario = veterinarios?.find((v) => v.id === veterinarioId);

  const avancar = () => setPasso((p) => Math.min(p + 1, PASSOS.length - 1));
  const voltar = () => setPasso((p) => Math.max(p - 1, 0));

  const confirmar = async () => {
    setErro(''); setEnviando(true);
    try {
      await api.post('/consultas', { animal_id: animalId, veterinario_id: veterinarioId, data, horario, motivo });
      toast.sucesso('Consulta agendada com sucesso!');
      navigate('/cliente/consultas');
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível agendar.');
    } finally { setEnviando(false); }
  };

  if (animais && animais.length === 0) {
    return (
      <Layout titulo="Agendar consulta">
        <EstadoVazio emoji="🐾" titulo="Você precisa cadastrar um animal antes de agendar" acao={<Link to="/cliente/animais" className="btn btn-primario">Cadastrar meu primeiro animal</Link>} />
      </Layout>
    );
  }

  return (
    <Layout titulo="Agendar consulta" subtitulo="Siga os passos abaixo para marcar o atendimento do seu pet">
      <div className="passos">
        {PASSOS.map((p, i) => (
          <div key={p} className={`passo ${i === passo ? 'ativo' : ''}`}><span className="bola">{i + 1}</span> {p}</div>
        ))}
      </div>

      <Cartao style={{ maxWidth: 560 }}>
        {!animais || !veterinarios ? <Carregando /> : (
          <>
            {passo === 0 && (
              <div className="pilha">
                <h3>Selecione o animal</h3>
                {animais.map((a) => (
                  <label key={a.id} className="linha" style={{ border: `1.5px solid ${animalId === a.id ? 'var(--cor-primaria)' : 'var(--cor-borda)'}`, borderRadius: 12, padding: '.7rem 1rem', cursor: 'pointer' }}>
                    <input type="radio" name="animal" checked={animalId === a.id} onChange={() => setAnimalId(a.id)} />
                    <div>{a.nome} <span className="texto-suave">— {a.especie}{a.raca ? `, ${a.raca}` : ''}</span></div>
                  </label>
                ))}
              </div>
            )}

            {passo === 1 && (
              <div className="pilha">
                <h3>Selecione o veterinário</h3>
                {veterinarios.map((v) => (
                  <label key={v.id} className="linha" style={{ border: `1.5px solid ${veterinarioId === v.id ? 'var(--cor-primaria)' : 'var(--cor-borda)'}`, borderRadius: 12, padding: '.7rem 1rem', cursor: 'pointer' }}>
                    <input type="radio" name="vet" checked={veterinarioId === v.id} onChange={() => setVeterinarioId(v.id)} />
                    <div>{v.nome} <span className="texto-suave">— {v.especialidade || 'Clínica Geral'}</span></div>
                  </label>
                ))}
              </div>
            )}

            {passo === 2 && (
              <div className="pilha">
                <h3>Escolha a data e o horário</h3>
                <input type="date" min={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} style={{ maxWidth: 200, padding: '.6em .8em', borderRadius: 10, border: '1.5px solid var(--cor-borda)' }} />
                {!horarios ? <Carregando texto="Buscando horários..." /> : horarios.length === 0 ? (
                  <p className="texto-suave">Nenhum horário disponível nessa data. A clínica não atende aos domingos.</p>
                ) : (
                  <div className="grade-horarios">
                    {horarios.map((h) => (
                      <button type="button" key={h} className={`horario-btn ${horario === h ? 'selecionado' : ''}`} onClick={() => setHorario(h)}>{h}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {passo === 3 && (
              <div className="pilha">
                <h3>Qual é o motivo da consulta?</h3>
                <textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva brevemente o motivo do atendimento" />
              </div>
            )}

            {passo === 4 && (
              <div className="pilha">
                <h3>Confirme os dados</h3>
                <p><strong>Animal:</strong> {animal?.nome}</p>
                <p><strong>Veterinário:</strong> {veterinario?.nome}</p>
                <p><strong>Data:</strong> {formatarData(data)} às {horario}</p>
                <p><strong>Motivo:</strong> {motivo}</p>
                {erro && <p className="erro">{erro}</p>}
              </div>
            )}

            <div className="linha" style={{ justifyContent: 'space-between', marginTop: '1.4rem' }}>
              <button className="btn btn-secundario" onClick={voltar} disabled={passo === 0}>Voltar</button>
              {passo < 4 ? (
                <button className="btn btn-primario" onClick={avancar}
                  disabled={(passo === 0 && !animalId) || (passo === 1 && !veterinarioId) || (passo === 2 && !horario) || (passo === 3 && !motivo.trim())}>
                  Continuar
                </button>
              ) : (
                <button className="btn btn-primario" onClick={confirmar} disabled={enviando}>{enviando ? 'Agendando...' : 'Confirmar agendamento'}</button>
              )}
            </div>
          </>
        )}
      </Cartao>
    </Layout>
  );
}
