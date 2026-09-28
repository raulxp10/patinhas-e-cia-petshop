// Conexão com o SQLite e criação das tabelas
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const arquivo = path.resolve(__dirname, '..', process.env.DB_FILE || './data/petshop.db');
fs.mkdirSync(path.dirname(arquivo), { recursive: true });

const db = new Database(arquivo);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON'); // necessário para o ON DELETE CASCADE funcionar

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;
