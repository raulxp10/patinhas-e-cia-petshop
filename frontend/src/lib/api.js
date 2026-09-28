// Cliente HTTP simples para conversar com a API. Centraliza o token e o tratamento de erros.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ErroApi extends Error {
  constructor(mensagem, codigo, status) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

let aoExpirarSessao = null;
export const definirCallbackSessaoExpirada = (fn) => { aoExpirarSessao = fn; };

async function requisitar(caminho, { method = 'GET', body, semAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('patinhas_token');
  if (token && !semAuth) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique se o backend está em execução.', 'ERRO_REDE', 0);
  }

  let dados = null;
  const texto = await resposta.text();
  if (texto) {
    try { dados = JSON.parse(texto); } catch { dados = null; }
  }

  if (!resposta.ok) {
    const mensagem = dados?.mensagem || 'Ocorreu um erro inesperado.';
    const codigo = dados?.codigo;
    if (resposta.status === 401 && (codigo === 'SESSAO_EXPIRADA' || codigo === 'SESSAO_INVALIDA') && aoExpirarSessao) {
      aoExpirarSessao(codigo);
    }
    throw new ErroApi(mensagem, codigo, resposta.status);
  }
  return dados;
}

export const api = {
  get: (caminho) => requisitar(caminho),
  post: (caminho, body, opts) => requisitar(caminho, { method: 'POST', body, ...opts }),
  put: (caminho, body) => requisitar(caminho, { method: 'PUT', body }),
  delete: (caminho) => requisitar(caminho, { method: 'DELETE' }),
};

export { ErroApi };
