import React from 'react';
import { Link } from 'react-router-dom';

const IMG_HERO = 'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=900&q=80&auto=format&fit=crop';
const SERVICOS = [
  { emoji: '🩺', titulo: 'Consulta veterinária', texto: 'Atendimento clínico completo, com histórico e prontuário digital de cada animal.' },
  { emoji: '💉', titulo: 'Vacinação', texto: 'Calendário de vacinas em dia, com lembretes automáticos para o tutor.' },
  { emoji: '🛁', titulo: 'Banho e tosa', texto: 'Cuidado e conforto para deixar seu pet cheiroso e feliz.' },
  { emoji: '🛍️', titulo: 'Pet shop', texto: 'Ração, brinquedos, acessórios e itens de higiene selecionados com carinho.' },
  { emoji: '🐾', titulo: 'Cuidados preventivos', texto: 'Exames de rotina e orientação para uma vida longa e saudável.' },
];

export default function Home() {
  return (
    <div>
      <header className="pub-header">
        <div className="pub-marca">🐾 Patinhas & Cia</div>
        <nav className="pub-nav">
          <a href="#servicos">Serviços</a>
          <a href="#clinica">A clínica</a>
          <a href="#contato">Contato</a>
          <Link to="/entrar" className="btn btn-primario btn-pequeno">Entrar no sistema</Link>
        </nav>
        <Link to="/entrar" className="btn btn-primario btn-pequeno" style={{ display: 'none' }}>Entrar</Link>
      </header>

      <section className="hero">
        <div>
          <h1>Cuidado de verdade para quem faz parte da família.</h1>
          <p className="sub">A Patinhas & Cia reúne pet shop e clínica veterinária num só lugar: consultas, vacinas, banho e tosa e tudo que seu pet precisa, com atendimento acolhedor e histórico sempre à mão.</p>
          <div className="linha">
            <Link to="/entrar" className="btn btn-primario">Entrar no sistema</Link>
            <Link to="/registrar" className="btn btn-secundario">Criar minha conta</Link>
          </div>
        </div>
        <div className="hero-arte"><img src={IMG_HERO} alt="Cão feliz recebendo carinho de um tutor" /></div>
      </section>

      <section className="secao secao-alt" id="servicos">
        <h2>Nossos serviços</h2>
        <p className="intro">Do check-up de rotina aos cuidados diários — cada serviço pensado para o bem-estar do seu animal.</p>
        <div className="grade-servicos">
          {SERVICOS.map((s) => (
            <div className="servico-cartao" key={s.titulo}>
              <span className="emoji">{s.emoji}</span>
              <h3>{s.titulo}</h3>
              <p className="texto-suave">{s.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="secao" id="clinica">
        <h2>Uma clínica pensada para o seu pet</h2>
        <p className="intro" style={{ maxWidth: '70ch' }}>
          Nossa equipe de veterinários acompanha cada animal com prontuário próprio: consultas, vacinas, exames e
          medicamentos ficam registrados e disponíveis para consulta a qualquer momento, tanto para a equipe quanto para o tutor.
        </p>
      </section>

      <section className="secao secao-alt" id="contato">
        <h2>Visite ou fale com a gente</h2>
        <div className="contato-grade">
          <div><strong>Endereço</strong><p className="texto-suave">Rua dos Pets, 250 — Jardim Primavera</p></div>
          <div><strong>Telefone</strong><p className="texto-suave">(11) 4000-1234</p></div>
          <div><strong>Horário</strong><p className="texto-suave">Segunda a sábado, 8h às 18h</p></div>
          <div><strong>E-mail</strong><p className="texto-suave">contato@patinhasecia.com.br</p></div>
        </div>
      </section>

      <footer className="pub-footer">
        <span>© {new Date().getFullYear()} Patinhas & Cia — Projeto acadêmico</span>
        <Link to="/entrar">Acessar o sistema →</Link>
      </footer>
    </div>
  );
}
