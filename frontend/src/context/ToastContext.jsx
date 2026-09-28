import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let proximoId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remover = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notificar = useCallback((mensagem, tipo = 'padrao') => {
    const id = proximoId++;
    setToasts((t) => [...t, { id, mensagem, tipo }]);
    setTimeout(() => remover(id), 4200);
  }, [remover]);

  const valor = {
    sucesso: (m) => notificar(m, 'sucesso'),
    erro: (m) => notificar(m, 'erro'),
    info: (m) => notificar(m, 'padrao'),
  };

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo}`}>{t.mensagem}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
