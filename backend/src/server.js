require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ErroHttp } = require('./utils');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/saude', (req, res) => res.json({ ok: true, mensagem: 'API da Patinhas & Cia no ar.' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/animais', require('./routes/animais'));
app.use('/api/veterinarios', require('./routes/veterinarios'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/consultas', require('./routes/consultas'));
app.use('/api/funcionarios', require('./routes/funcionarios'));
app.use('/api/folha-pagamento', require('./routes/folha'));
app.use('/api/notificacoes', require('./routes/notificacoes'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));

// Tratador de erros central: converte ErroHttp em respostas padronizadas e evita vazar erros técnicos
app.use((err, req, res, next) => {
  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ mensagem: err.message, codigo: err.codigo });
  }
  console.error(err);
  res.status(500).json({ mensagem: 'Ocorreu um erro inesperado no servidor.', codigo: 'ERRO_INTERNO' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
