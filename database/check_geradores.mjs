// Verificar estrutura da tabela geradores
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres:bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ@147.93.71.233:6543/postgres',
  ssl: false
});

await client.connect();

console.log('📋 ESTRUTURA DA TABELA GERADORES:\n');
const cols = await client.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'geradores'
  ORDER BY ordinal_position
`);

cols.rows.forEach(row => {
  console.log(`  - ${row.column_name} (${row.data_type})`);
});

console.log('\n❌ VERIFICANDO CAMPOS DE CONSUMIDOR (NÃO DEVERIA EXISTIR):\n');
const consumer = await client.query(`
  SELECT column_name 
  FROM information_schema.columns
  WHERE table_name = 'geradores'
  AND column_name LIKE '%consumidor%'
`);

if (consumer.rows.length > 0) {
  console.log('⚠️  PROBLEMA ENCONTRADO:');
  consumer.rows.forEach(row => console.log(`  - ${row.column_name}`));
} else {
  console.log('✅ Nenhum campo de consumidor encontrado. Tudo certo!');
}

await client.end();
