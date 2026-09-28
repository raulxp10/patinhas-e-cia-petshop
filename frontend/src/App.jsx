import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RotaProtegida from './components/RotaProtegida.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';

import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import Clientes from './pages/admin/Clientes.jsx';
import ProdutosAdmin from './pages/admin/ProdutosAdmin.jsx';
import Funcionarios from './pages/admin/Funcionarios.jsx';
import FolhaPagamento from './pages/admin/FolhaPagamento.jsx';
import ConsultasAdmin from './pages/admin/ConsultasAdmin.jsx';

import DashboardVet from './pages/veterinario/DashboardVet.jsx';
import AgendaVet from './pages/veterinario/AgendaVet.jsx';
import AnimaisVet from './pages/veterinario/AnimaisVet.jsx';
import MedicamentosVet from './pages/veterinario/MedicamentosVet.jsx';

import DashboardCliente from './pages/cliente/DashboardCliente.jsx';
import MeusAnimais from './pages/cliente/MeusAnimais.jsx';
import FichaAnimalCliente from './pages/cliente/FichaAnimalCliente.jsx';
import Agendar from './pages/cliente/Agendar.jsx';
import MinhasConsultas from './pages/cliente/MinhasConsultas.jsx';
import MeuPerfil from './pages/cliente/MeuPerfil.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/registrar" element={<Registro />} />

      <Route path="/admin" element={<RotaProtegida perfis={['ADMINISTRADOR']}><DashboardAdmin /></RotaProtegida>} />
      <Route path="/admin/clientes" element={<RotaProtegida perfis={['ADMINISTRADOR']}><Clientes /></RotaProtegida>} />
      <Route path="/admin/consultas" element={<RotaProtegida perfis={['ADMINISTRADOR']}><ConsultasAdmin /></RotaProtegida>} />
      <Route path="/admin/produtos" element={<RotaProtegida perfis={['ADMINISTRADOR']}><ProdutosAdmin /></RotaProtegida>} />
      <Route path="/admin/funcionarios" element={<RotaProtegida perfis={['ADMINISTRADOR']}><Funcionarios /></RotaProtegida>} />
      <Route path="/admin/folha-pagamento" element={<RotaProtegida perfis={['ADMINISTRADOR']}><FolhaPagamento /></RotaProtegida>} />

      <Route path="/veterinario" element={<RotaProtegida perfis={['VETERINARIO']}><DashboardVet /></RotaProtegida>} />
      <Route path="/veterinario/agenda" element={<RotaProtegida perfis={['VETERINARIO']}><AgendaVet /></RotaProtegida>} />
      <Route path="/veterinario/animais" element={<RotaProtegida perfis={['VETERINARIO']}><AnimaisVet /></RotaProtegida>} />
      <Route path="/veterinario/medicamentos" element={<RotaProtegida perfis={['VETERINARIO']}><MedicamentosVet /></RotaProtegida>} />

      <Route path="/cliente" element={<RotaProtegida perfis={['CLIENTE']}><DashboardCliente /></RotaProtegida>} />
      <Route path="/cliente/animais" element={<RotaProtegida perfis={['CLIENTE']}><MeusAnimais /></RotaProtegida>} />
      <Route path="/cliente/animais/:id" element={<RotaProtegida perfis={['CLIENTE']}><FichaAnimalCliente /></RotaProtegida>} />
      <Route path="/cliente/agendar" element={<RotaProtegida perfis={['CLIENTE']}><Agendar /></RotaProtegida>} />
      <Route path="/cliente/consultas" element={<RotaProtegida perfis={['CLIENTE']}><MinhasConsultas /></RotaProtegida>} />
      <Route path="/cliente/perfil" element={<RotaProtegida perfis={['CLIENTE']}><MeuPerfil /></RotaProtegida>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
