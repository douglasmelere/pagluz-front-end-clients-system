// ========================================
// Script Node.js para atualizar tabela geradores
// Data: 2026-01-19
// ========================================

import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = 'postgres://postgres:bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ@147.93.71.233:6543/postgres';
const SQL_FILE = 'update_geradores_table.sql';

console.log('\x1b[36m========================================\x1b[0m');
console.log('\x1b[36mATUALIZANDO TABELA GERADORES\x1b[0m');
console.log('\x1b[36m========================================\x1b[0m');
console.log('');

async function updateDatabase() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: false
  });

  try {
    // Conectar ao banco
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('\x1b[32m✓ Conectado com sucesso!\x1b[0m\n');

    // Ler arquivo SQL
    console.log(`Lendo arquivo: ${SQL_FILE}`);
    const sqlFilePath = path.join(__dirname, SQL_FILE);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('\x1b[32m✓ Arquivo SQL carregado\x1b[0m\n');

    // Executar SQL
    console.log('Executando comandos SQL...\n');
    console.log('\x1b[33m' + '='.repeat(60) + '\x1b[0m');
    
    const result = await client.query(sqlContent);
    
    console.log('\x1b[33m' + '='.repeat(60) + '\x1b[0m');
    console.log('');
    console.log('\x1b[32m========================================\x1b[0m');
    console.log('\x1b[32m✓ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!\x1b[0m');
    console.log('\x1b[32m========================================\x1b[0m');
    
  } catch (error) {
    console.error('\n\x1b[31m✗ Erro ao atualizar banco de dados:\x1b[0m');
    console.error('\x1b[31m' + error.message + '\x1b[0m');
    
    if (error.code) {
      console.error(`\nCódigo do erro: ${error.code}`);
    }
    if (error.position) {
      console.error(`Posição no SQL: ${error.position}`);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
updateDatabase();
