import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { api, ErroApi } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Carregando, EstadoVazio, Modal, Campo, Selo, formatarMoeda } from '../../components/ui.jsx';

const mesAtual = () => new Date().toISOString().slice(0, 7);

export default function FolhaPagamento() {
  const [mes, setMes] = useState(mesAtual());
  const [lista, setLista] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const toast = useToast();

  const carregar = useCallback(() => { api.get(`/folha-pagamento?mes=${mes}`).then(setLista); }, [mes]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { api.get('/funcionarios').then((l) => setFuncionarios(l.filter((f) => f.ativo))); }, []);

  const pagar = async (id) => {
    try { await api.put(`/folha-pagamento/${id}/pagar`); toast.sucesso('Pagamento registrado.'); carregar(); }
    catch (e) { toast.erro(e instanceof ErroApi ? e.message : 'Não foi possível registrar o pagamento.'); }
  };

  const totalLiquido = (lista || []).reduce((s, f) => s + f.salario_liquido, 0);

  return (
    <Layout titulo="Folha de pagamento" subtitulo="Gerencie os pagamentos mensais da equipe"
      acoes={<button className="btn btn-primario" onClick={() => setModalNovo(true)}>+ Lançar pagamento</button>}>

      <div className="linha" style={{ marginBottom: '1.2rem' }}>
        <Campo label="Mês de referência"><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></Campo>
      </div>

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <EstadoVazio emoji="💰" titulo="Nenhum lançamento neste mês" descricao="Lance o pagamento de um funcionário para este período."
          acao={<button className="btn btn-primario" onClick={() => setModalNovo(true)}>Lançar pagamento</button>} />
      ) : (
        <>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Funcionário</th><th>Cargo</th><th>Salário base</th><th>Bonificações</th><th>Descontos</th><th>Líquido</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {lista.map((f) => (
                  <tr key={f.id}>
                    <td>{f.funcionario_nome}</td><td>{f.cargo}</td>
                    <td>{formatarMoeda(f.salario_base)}</td><td>{formatarMoeda(f.bonificacoes)}</td><td>{formatarMoeda(f.descontos)}</td>
                    <td><strong>{formatarMoeda(f.salario_liquido)}</strong></td>
                    <td><Selo tom={f.status === 'PAGO' ? 'verde' : 'laranja'}>{f.status === 'PAGO' ? 'Pago' : 'Pendente'}</Selo></td>
                    <td>{f.status === 'PENDENTE' && <button className="btn btn-texto btn-pequeno" onClick={() => pagar(f.id)}>Registrar pagamento</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="texto-suave" style={{ marginTop: '.8rem' }}>Total líquido do período: <strong>{formatarMoeda(totalLiquido)}</strong></p>
        </>
      )}

      {modalNovo && <FormLancamento mes={mes} funcionarios={funcionarios} onFechar={() => setModalNovo(false)} onSalvo={() => { setModalNovo(false); carregar(); }} />}
    </Layout>
  );
}

function FormLancamento({ mes, funcionarios, onFechar, onSalvo }) {
  const [funcionarioId, setFuncionarioId] = useState('');
  const [bonificacoes, setBonificacoes] = useState('0');
  const [descontos, setDescontos] = useState('0');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  const aoSalvar = async (e) => {
    e.preventDefault();
    if (!funcionarioId) { setErro('Selecione o funcionário.'); return; }
    setSalvando(true);
    try {
      await api.post('/folha-pagamento', { funcionario_id: funcionarioId, mes_referencia: mes, bonificacoes, descontos });
      toast.sucesso('Lançamento salvo.');
      onSalvo();
    } catch (e) { setErro(e instanceof ErroApi ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  };

  return (
    <Modal titulo="Lançar pagamento" onFechar={onFechar} largura={440}>
      <form onSubmit={aoSalvar} noValidate>
        <Campo label="Funcionário">
          <select value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
            <option value="">Selecione...</option>
            {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome} — {f.cargo}</option>)}
          </select>
        </Campo>
        <p className="texto-suave">Referente a {mes}</p>
        <div className="linha-campos">
          <Campo label="Bonificações (R$)"><input type="number" step="0.01" min="0" value={bonificacoes} onChange={(e) => setBonificacoes(e.target.value)} /></Campo>
          <Campo label="Descontos (R$)"><input type="number" step="0.01" min="0" value={descontos} onChange={(e) => setDescontos(e.target.value)} /></Campo>
        </div>
        {erro && <p className="erro">{erro}</p>}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '.6rem' }}>
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
