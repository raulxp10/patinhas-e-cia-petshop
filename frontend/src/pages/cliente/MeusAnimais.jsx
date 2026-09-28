import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { lerImagemComoDataUrlReduzida } from '../../lib/imagem.js';
import { Carregando, EstadoVazio, Modal, Campo } from '../../components/ui.jsx';

const ANIMAL_VAZIO = { nome: '', especie: '', raca: '', sexo: 'Macho', data_nascimento: '', peso: '', cor: '', foto: '', observacoes: '', alergias: '' };

export default function MeusAnimais() {
  const [lista, setLista] = useState(null);
  const [modalForm, setModalForm] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => { api.get('/animais').then(setLista).catch(() => toast.erro('Não foi possível carregar seus animais.')); }, []);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Layout titulo="Meus animais" subtitulo="Gerencie os dados dos seus pets"
      acoes={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>+ Adicionar animal</button>}>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🐾" titulo="Você ainda não cadastrou nenhum animal." descricao="Cadastre seu primeiro pet para começar a agendar consultas."
          acao={<button className="btn btn-primario" onClick={() => setModalForm('novo')}>Adicionar meu primeiro animal</button>} />
      ) : (
        <div className="grade-estat">
          {lista.map((a) => (
            <div key={a.id} className="cartao" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {a.foto ? <img src={a.foto} alt={a.nome} className="avatar-foto" style={{ width: 56, height: 56 }} /> : <div className="avatar-inicial" style={{ width: 56, height: 56 }}>{a.nome.charAt(0)}</div>}
              <div style={{ flex: 1 }}>
                <strong>{a.nome}</strong>
                <div className="texto-suave" style={{ fontSize: '.85rem' }}>{a.especie}{a.raca ? ` — ${a.raca}` : ''}</div>
                <div className="linha" style={{ marginTop: '.6rem', gap: '.4rem' }}>
                  <Link to={`/cliente/animais/${a.id}`} className="btn btn-texto btn-pequeno">Ver ficha</Link>
                  <button className="btn btn-texto btn-pequeno" onClick={() => setModalForm(a)}>Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalForm && <FormAnimal animal={modalForm === 'novo' ? null : modalForm} onFechar={() => setModalForm(null)} onSalvo={() => { setModalForm(null); carregar(); }} />}
    </Layout>
  );
}

export function FormAnimal({ animal, onFechar, onSalvo }) {
  const [form, setForm] = useState(animal ? { ...ANIMAL_VAZIO, ...animal } : ANIMAL_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroFoto, setErroFoto] = useState('');
  const toast = useToast();
  const mudar = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  const aoEscolherFoto = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErroFoto('');
    try { setForm((f) => ({ ...f, foto: await lerImagemComoDataUrlReduzida(arquivo) })); }
    catch (err) { setErroFoto(err.message); }
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome do animal.';
    if (!form.especie.trim()) e.especie = 'Informe a espécie.';
    if (!['Macho', 'Fêmea'].includes(form.sexo)) e.sexo = 'Selecione o sexo.';
    setErros(e); return Object.keys(e).length === 0;
  };

  const aoSalvar = async (evt) => {
    evt.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    try {
      if (animal) await api.put(`/animais/${animal.id}`, form);
      else await api.post('/animais', form);
      toast.sucesso(animal ? 'Animal atualizado.' : 'Animal cadastrado.');
      onSalvo();
    } catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo={animal ? `Editar ${animal.nome}` : 'Adicionar animal'} onFechar={onFechar}>
      <form onSubmit={aoSalvar} noValidate>
        <div className="campo">
          <label>Foto</label>
          <div className="foto-upload">
            {form.foto ? <img src={form.foto} alt="Prévia" className="foto-preview" /> : <div className="avatar-inicial" style={{ width: 76, height: 76 }}>🐾</div>}
            <input type="file" accept="image/*" onChange={aoEscolherFoto} />
          </div>
          {erroFoto && <span className="erro">{erroFoto}</span>}
        </div>
        <Campo label="Nome" erro={erros.nome}><input value={form.nome} onChange={mudar('nome')} /></Campo>
        <div className="linha-campos">
          <Campo label="Espécie" erro={erros.especie}><input value={form.especie} onChange={mudar('especie')} placeholder="Cachorro, gato..." /></Campo>
          <Campo label="Raça"><input value={form.raca} onChange={mudar('raca')} /></Campo>
        </div>
        <div className="linha-campos">
          <Campo label="Sexo" erro={erros.sexo}>
            <select value={form.sexo} onChange={mudar('sexo')}><option>Macho</option><option>Fêmea</option></select>
          </Campo>
          <Campo label="Data de nascimento"><input type="date" value={form.data_nascimento || ''} onChange={mudar('data_nascimento')} /></Campo>
        </div>
        <div className="linha-campos">
          <Campo label="Peso (kg)"><input type="number" step="0.1" min="0" value={form.peso} onChange={mudar('peso')} /></Campo>
          <Campo label="Cor"><input value={form.cor} onChange={mudar('cor')} /></Campo>
        </div>
        <Campo label="Alergias" dica="Deixe em branco se não houver"><input value={form.alergias} onChange={mudar('alergias')} /></Campo>
        <Campo label="Observações"><textarea rows={2} value={form.observacoes} onChange={mudar('observacoes')} /></Campo>
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
