// ========================================
// Script para verificar estrutura da tabela geradores
// Data: 2026-01-19
// ========================================

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgres://postgres:bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ@147.93.71.233:6543/postgres';

console.log('\x1b[36m========================================\x1b[0m');
console.log('\x1b[36mVERIFICAÇÃO DA TABELA GERADORES\x1b[0m');
console.log('\x1b[36m========================================\x1b[0m');
console.log('');

async function verifyTable() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('\x1b[32m✓ Conectado ao banco de dados\x1b[0m\n');

    // 1. Verificar estrutura da tabela
    console.log('\x1b[33m📋 ESTRUTURA DA TABELA:\x1b[0m');
    console.log('─'.repeat(80));
    
    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'geradores'
      ORDER BY ordinal_position
    `);
    
    console.table(columnsResult.rows);

    // 2. Verificar índices
    console.log('\n\x1b[33m📊 ÍNDICES CRIADOS:\x1b[0m');
    console.log('─'.repeat(80));
    
    const indexesResult = await client.query(`
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'geradores'
      ORDER BY indexname
    `);
    
    console.table(indexesResult.rows);

    // 3. Verificar constraints
    console.log('\n\x1b[33m🔒 CONSTRAINTS:\x1b[0m');
    console.log('─'.repeat(80));
    
    const constraintsResult = await client.query(`
      SELECT 
        conname AS constraint_name,
        CASE contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
          WHEN 'f' THEN 'FOREIGN KEY'
          ELSE contype::text
        END AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'geradores'::regclass
      ORDER BY conname
    `);
    
    console.table(constraintsResult.rows);

    // 4. Contar registros
    console.log('\n\x1b[33m📈 ESTATÍSTICAS:\x1b[0m');
    console.log('─'.repeat(80));
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_geradores,
        COUNT(DISTINCT tipo_usina) as tipos_usina,
        COUNT(DISTINCT uf) as estados
      FROM geradores
    `);
    
    console.table(statsResult.rows);

    // 5. Mostrar alguns registros de exemplo (se existirem)
    const countResult = await client.query('SELECT COUNT(*) as count FROM geradores');
    const count = parseInt(countResult.rows[0].count);
    
    if (count > 0) {
      console.log('\n\x1b[33m📝 EXEMPLOS DE REGISTROS:\x1b[0m');
      console.log('─'.repeat(80));
      
      const samplesResult = await client.query(`
        SELECT 
          id,
          nome,
          cpf_cnpj,
          cidade,
          uf,
          tipo_usina,
          numero_uc,
          criado_em,
          atualizado_em
        FROM geradores
        ORDER BY criado_em DESC
        LIMIT 5
      `);
      
      console.table(samplesResult.rows);
    } else {
      console.log('\n\x1b[33m⚠️  Nenhum registro encontrado na tabela\x1b[0m\n');
    }

    console.log('\n\x1b[32m========================================\x1b[0m');
    console.log('\x1b[32m✓ VERIFICAÇÃO CONCLUÍDA!\x1b[0m');
    console.log('\x1b[32m========================================\x1b[0m');
    
  } catch (error) {
    console.error('\n\x1b[31m✗ Erro:\x1b[0m', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyTable();
