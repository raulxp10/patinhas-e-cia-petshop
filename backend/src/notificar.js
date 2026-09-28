// Criação de notificações
const db = require('./db');

// "ref" evita duplicar a mesma notificação (ex.: lembrete da mesma consulta)
function notificar(usuarioId, tipo, mensagem, ref = null) {
  if (ref) {
    const existe = db.prepare('SELECT 1 FROM notificacoes WHERE usuario_id = ? AND ref = ?').get(usuarioId, ref);
    if (existe) return;
  }
  db.prepare('INSERT INTO notificacoes (usuario_id, tipo, mensagem, ref) VALUES (?, ?, ?, ?)').run(usuarioId, tipo, mensagem, ref);
}

function notificarAdmins(tipo, mensagem, ref = null) {
  const admins = db.prepare("SELECT id FROM usuarios WHERE perfil = 'ADMINISTRADOR' AND ativo = 1").all();
  admins.forEach((a) => notificar(a.id, tipo, mensagem, ref));
}

function verificarEstoqueBaixo(produtoId) {
  const p = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(produtoId);
  if (p && p.estoque <= p.estoque_minimo) {
    notificarAdmins('ESTOQUE_BAIXO', `Estoque baixo: ${p.nome} (${p.estoque} un., mínimo ${p.estoque_minimo}).`, `estoque:${p.id}:${p.estoque}`);
  }
}

// Lembretes de consultas nas próximas 24 horas (gerados quando o usuário abre o sistema)
function gerarLembretes(usuario, clienteId, veterinarioId) {
  let filtro = '';
  let param = [];
  if (usuario.perfil === 'CLIENTE') { filtro = 'AND a.cliente_id = ?'; param = [clienteId]; }
  else if (usuario.perfil === 'VETERINARIO') { filtro = 'AND c.veterinario_id = ?'; param = [veterinarioId]; }
  else {
    // administrador: alertas de estoque baixo
    db.prepare('SELECT id FROM produtos WHERE ativo = 1 AND estoque <= estoque_minimo').all()
      .forEach((p) => verificarEstoqueBaixo(p.id));
    return;
  }
  const proximas = db.prepare(`
    SELECT c.id, c.data, c.horario, a.nome AS animal
      FROM consultas c JOIN animais a ON a.id = c.animal_id
     WHERE c.status IN ('AGENDADA','CONFIRMADA')
       AND datetime(c.data || ' ' || c.horario) BETWEEN datetime('now','localtime') AND datetime('now','localtime','+1 day')
       ${filtro}`).all(...param);
  proximas.forEach((c) =>
    notificar(usuario.id, 'CONSULTA_PROXIMA', `Consulta próxima: ${c.animal} em ${c.data.split('-').reverse().join('/')} às ${c.horario}.`, `lembrete:${c.id}`));
}

module.exports = { notificar, notificarAdmins, verificarEstoqueBaixo, gerarLembretes };
