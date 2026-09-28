import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, definirCallbackSessaoExpirada } from '../lib/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const sair = useCallback((mensagem) => {
    localStorage.removeItem('patinhas_token');
    setUsuario(null);
    navigate('/entrar');
    if (mensagem) toast.info(mensagem);
  }, [navigate, toast]);

  useEffect(() => {
    definirCallbackSessaoExpirada((codigo) => {
      sair(codigo === 'SESSAO_EXPIRADA' ? 'Sua sessão expirou. Entre novamente.' : 'Sessão inválida. Entre novamente.');
    });
  }, [sair]);

  useEffect(() => {
    const token = localStorage.getItem('patinhas_token');
    if (!token) { setCarregando(false); return; }
    api.get('/auth/me').then((r) => setUsuario(r.usuario)).catch(() => {
      localStorage.removeItem('patinhas_token');
    }).finally(() => setCarregando(false));
  }, []);

  const entrar = async (email, senha) => {
    const r = await api.post('/auth/login', { email, senha });
    localStorage.setItem('patinhas_token', r.token);
    setUsuario(r.usuario);
    return r.usuario;
  };

  const registrar = async (dados) => {
    const r = await api.post('/auth/registro', dados);
    localStorage.setItem('patinhas_token', r.token);
    setUsuario(r.usuario);
    return r.usuario;
  };

  const valor = useMemo(() => ({ usuario, carregando, entrar, registrar, sair }), [usuario, carregando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
