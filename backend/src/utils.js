// Funções de apoio usadas em várias rotas

const pad = (n) => String(n).padStart(2, '0');
const isoData = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hojeISO = () => isoData(new Date());
const agoraHM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const somaDias = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  return isoData(new Date(a, m - 1, d + n));
};
const diaDaSemana = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).getDay(); // 0 = domingo
};

// A clínica atende de segunda a sábado, em blocos de 30 minutos, com pausa para almoço
const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const dataValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(new Date(s).getTime());
const soDigitos = (s) => String(s || '').replace(/\D/g, '');
const texto = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const numero = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

// Erro com status HTTP: lançado nas rotas e tratado no server.js
class ErroHttp extends Error {
  constructor(status, mensagem, codigo) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}
const falha = (status, mensagem, codigo) => {
  throw new ErroHttp(status, mensagem, codigo);
};

// Valida uma imagem enviada como data URL (o front já reduz o tamanho)
const imagemOuNula = (v) => {
  if (!v) return null;
  if (typeof v !== 'string' || !v.startsWith('data:image/')) falha(400, 'A imagem enviada é inválida.');
  if (v.length > 400_000) falha(400, 'A imagem é grande demais. Escolha uma foto menor.');
  return v;
};

module.exports = {
  isoData, hojeISO, agoraHM, somaDias, diaDaSemana, HORARIOS,
  emailValido, dataValida, soDigitos, texto, numero, ErroHttp, falha, imagemOuNula,
};
