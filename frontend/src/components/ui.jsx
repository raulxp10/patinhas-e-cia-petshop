import React, { useEffect, useRef } from 'react';

export function Cartao({ children, className = '', ...props }) {
  return <div className={`cartao ${className}`} {...props}>{children}</div>;
}

export function CartaoEstat({ rotulo, valor, icone, tom = '' }) {
  return (
    <div className="cartao cartao-estat">
      <span className="icone">{icone}</span>
      <span className="rotulo">{rotulo}</span>
      <span className="valor" style={tom ? { color: tom } : undefined}>{valor}</span>
    </div>
  );
}

export function Selo({ tom = 'cinza', children }) {
  return <span className={`selo selo-${tom}`}>{children}</span>;
}

export function Carregando({ texto = 'Carregando...' }) {
  return <div className="carregando"><span className="spinner" /> {texto}</div>;
}

export function EstadoVazio({ emoji = '🐾', titulo, descricao, acao }) {
  return (
    <div className="estado-vazio">
      <span className="emoji">{emoji}</span>
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}

export function Campo({ label, erro, dica, children }) {
  return (
    <div className={`campo ${erro ? 'tem-erro' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {dica && !erro && <span className="dica">{dica}</span>}
      {erro && <span className="erro">{erro}</span>}
    </div>
  );
}

export function Modal({ titulo, onFechar, children, largura }) {
  const ref = useRef(null);
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', aoTeclar);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="modal-caixa" style={largura ? { maxWidth: largura } : undefined} tabIndex={-1} ref={ref} role="dialog" aria-modal="true">
        <div className="modal-cabecalho">
          <h3>{titulo}</h3>
          <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmarExclusao({ titulo, mensagem, onCancelar, onConfirmar, confirmando }) {
  return (
    <Modal titulo={titulo} onFechar={onCancelar} largura={420}>
      <p className="texto-suave">{mensagem}</p>
      <div className="linha" style={{ justifyContent: 'flex-end', marginTop: '1.2rem' }}>
        <button className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-perigo" onClick={onConfirmar} disabled={confirmando}>
          {confirmando ? 'Excluindo...' : 'Sim, excluir'}
        </button>
      </div>
    </Modal>
  );
}

export function Busca({ valor, onChange, placeholder = 'Pesquisar...' }) {
  return (
    <div className="busca-wrap">
      <span className="icone-busca">🔍</span>
      <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function formatarData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function formatarMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const STATUS_CONSULTA = {
  AGENDADA: { texto: 'Agendada', tom: 'azul' },
  CONFIRMADA: { texto: 'Confirmada', tom: 'verde' },
  REALIZADA: { texto: 'Realizada', tom: 'cinza' },
  CANCELADA: { texto: 'Cancelada', tom: 'vermelho' },
};
