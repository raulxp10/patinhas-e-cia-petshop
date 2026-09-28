import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Cartao, Carregando, EstadoVazio, Selo, STATUS_CONSULTA, formatarData, Modal, Campo } from '../../components/ui.jsx';

const hojeISO = () => new Date().toISOString().slice(0, 10);
const somarDias = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function AgendaVet() {
  const [data, setData] = useState(hojeISO());
  const [lista, setLista] = useState(null);
  const [registrando, setRegistrando] = useState(null);
  const toast = useToast();

  const carregar = useCallback(() => { api.get(`/consultas?data=${data}`).then(setLista); }, [data]);
  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (consulta, status) => {
    try { await api.put(`/consultas/${consulta.id}/status`, { status }); toast.sucesso('Consulta atualizada.'); carregar(); }
    catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível atualizar a consulta.'); }
  };

  return (
    <Layout titulo="Agenda" subtitulo="Consultas do dia selecionado">
      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <button className="btn btn-secundario btn-pequeno" onClick={() => setData((d) => somarDias(d, -1))}>← Dia anterior</button>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <button className="btn btn-secundario btn-pequeno" onClick={() => setData((d) => somarDias(d, 1))}>Próximo dia →</button>
        <button className="btn btn-texto btn-pequeno" onClick={() => setData(hojeISO())}>Hoje</button>
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="🗓️" titulo="Nenhuma consulta neste dia" descricao={`Sem atendimentos marcados para ${formatarData(data)}.`} />
      ) : (
        <div className="pilha" style={{ gap: '.8rem' }}>
          {lista.map((c) => (
            <Cartao key={c.id}>
              <div className="espaco-entre">
                <div>
                  <strong>{c.horario} — {c.animal_nome}</strong> <span className="texto-suave">({c.animal_especie})</span>
                  <div className="texto-suave" style={{ fontSize: '.88rem' }}>Tutor: {c.tutor_nome} • {c.tutor_telefone}</div>
                  <div className="texto-suave" style={{ fontSize: '.88rem' }}>Motivo: {c.motivo}</div>
                  {c.animal_alergias && <div style={{ fontSize: '.85rem', color: 'var(--cor-erro)' }}>⚠️ Alergias: {c.animal_alergias}</div>}
                </div>
                <Selo tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].texto}</Selo>
              </div>
              {c.status !== 'REALIZADA' && c.status !== 'CANCELADA' && (
                <div className="linha" style={{ marginTop: '.9rem' }}>
                  {c.status === 'AGENDADA' && <button className="btn btn-secundario btn-pequeno" onClick={() => mudarStatus(c, 'CONFIRMADA')}>Confirmar</button>}
                  <button className="btn btn-primario btn-pequeno" onClick={() => setRegistrando(c)}>Registrar atendimento</button>
                  <button className="btn btn-texto btn-pequeno" style={{ color: 'var(--cor-erro)' }} onClick={() => mudarStatus(c, 'CANCELADA')}>Cancelar</button>
                </div>
              )}
            </Cartao>
          ))}
        </div>
      )}

      {registrando && <FormAtendimento consulta={registrando} onFechar={() => setRegistrando(null)} onSalvo={() => { setRegistrando(null); carregar(); }} />}
    </Layout>
  );
}

function FormAtendimento({ consulta, onFechar, onSalvo }) {
  const [form, setForm] = useState({ queixa_principal: consulta.motivo || '', observacoes: '', diagnostico: '', peso: '', temperatura: '', recomendacoes: '', retorno: '', observacoes_adicionais: '' });
  const [medicamentos, setMedicamentos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  useEffect(() => { api.get('/produtos?categoria=Medicamentos').then(setProdutos); }, []);
  const mudar = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  const adicionarMedicamento = () => setMedicamentos((m) => [...m, { produto_id: '', nome: '', dosagem: '', quantidade: 1 }]);
  const mudarMedicamento = (i, campo, valor) => setMedicamentos((m) => m.map((x, idx) => {
    if (idx !== i) return x;
    if (campo === 'produto_id') {
      const p = produtos.find((pr) => String(pr.id) === valor);
      return { ...x, produto_id: valor, nome: p ? p.nome : x.nome, dosagem: p ? (p.dosagem || x.dosagem) : x.dosagem };
    }
    return { ...x, [campo]: valor };
  }));
  const removerMedicamento = (i) => setMedicamentos((m) => m.filter((_, idx) => idx !== i));

  const aoSalvar = async (e) => {
    e.preventDefault();
    if (!form.queixa_principal.trim()) { setErro('Informe a queixa principal.'); return; }
    setSalvando(true);
    try {
      await api.post(`/consultas/${consulta.id}/prontuario`, { ...form, medicamentos });
      toast.sucesso('Atendimento registrado no histórico do animal.');
      onSalvo();
    } catch (e) { setErro(e instanceof ErroApi ? e.message : 'Não foi possível registrar o atendimento.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo={`Registrar atendimento — ${consulta.animal_nome}`} onFechar={onFechar} largura={640}>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Queixa principal"><input value={form.queixa_principal} onChange={mudar('queixa_principal')} /></Campo>
        <Campo label="Observações"><textarea rows={2} value={form.observacoes} onChange={mudar('observacoes')} /></Campo>
        <Campo label="Diagnóstico"><textarea rows={2} value={form.diagnostico} onChange={mudar('diagnostico')} /></Campo>
        <div className="linha-campos">
          <Campo label="Peso (kg)"><input type="number" step="0.1" value={form.peso} onChange={mudar('peso')} /></Campo>
          <Campo label="Temperatura (°C)"><input type="number" step="0.1" value={form.temperatura} onChange={mudar('temperatura')} /></Campo>
          <Campo label="Retorno"><input value={form.retorno} onChange={mudar('retorno')} placeholder="Ex: 30 dias" /></Campo>
        </div>
        <Campo label="Recomendações"><textarea rows={2} value={form.recomendacoes} onChange={mudar('recomendacoes')} /></Campo>
        <Campo label="Observações adicionais"><textarea rows={2} value={form.observacoes_adicionais} onChange={mudar('observacoes_adicionais')} /></Campo>

        <div className="campo">
          <label>Medicamentos prescritos</label>
          <div className="pilha" style={{ gap: '.5rem' }}>
            {medicamentos.map((m, i) => (
              <div key={i} className="linha" style={{ gap: '.5rem' }}>
                <select value={m.produto_id} onChange={(e) => mudarMedicamento(i, 'produto_id', e.target.value)} style={{ flex: 2 }}>
                  <option value="">Digitar manualmente...</option>
                  {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {!m.produto_id && <input placeholder="Nome do medicamento" value={m.nome} onChange={(e) => mudarMedicamento(i, 'nome', e.target.value)} style={{ flex: 2 }} />}
                <input placeholder="Dosagem" value={m.dosagem} onChange={(e) => mudarMedicamento(i, 'dosagem', e.target.value)} style={{ flex: 2, minWidth: 90 }} />
                <input type="number" min="1" placeholder="Qtd" value={m.quantidade} onChange={(e) => mudarMedicamento(i, 'quantidade', e.target.value)} style={{ width: 64 }} />
                <button type="button" className="btn btn-texto btn-pequeno" onClick={() => removerMedicamento(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-secundario btn-pequeno" onClick={adicionarMedicamento} style={{ alignSelf: 'flex-start' }}>+ Adicionar medicamento</button>
          </div>
        </div>

        {erro && <p className="erro">{erro}</p>}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Concluir atendimento'}</button>
        </div>
      </form>
    </Modal>
  );
}
