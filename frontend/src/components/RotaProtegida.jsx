import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Carregando } from './ui.jsx';

const INICIO_POR_PERFIL = { ADMINISTRADOR: '/admin', VETERINARIO: '/veterinario', CLIENTE: '/cliente' };

export default function RotaProtegida({ perfis, children }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Carregando texto="Verificando sua sessão..." /></div>;
  if (!usuario) return <Navigate to="/entrar" state={{ de: local.pathname }} replace />;
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to={INICIO_POR_PERFIL[usuario.perfil]} replace />;
  return children;
}

export { INICIO_POR_PERFIL };
