# 🔧 Atualização da Tabela Geradores

Este diretório contém os scripts necessários para atualizar a tabela `geradores` no banco de dados PostgreSQL.

## 📋 O que será feito

### ✅ Campos Adicionados
1. **`atualizado_em`** - Timestamp de última atualização (com trigger automático)
2. **`numero_uc`** - Renomeação/criação do campo para número da UC do gerador

### 📊 Índices Criados (para melhor performance)
- `idx_geradores_cpf_cnpj` - Busca por CPF/CNPJ
- `idx_geradores_numero_uc` - Busca por número da UC
- `idx_geradores_email` - Busca por email
- `idx_geradores_tipo_usina` - Filtro por tipo de usina
- `idx_geradores_cidade_uf` - Busca regional
- `idx_geradores_nome` - Busca por nome (full-text)
- `idx_geradores_criado_em` - Ordenação por data

### 🔒 Constraints Adicionadas
- `geradores_cpf_cnpj_unique` - CPF/CNPJ único
- `geradores_email_unique` - Email único
- `geradores_uf_check` - Validação de UF (apenas estados válidos)
- `geradores_tipo_usina_check` - Validação de tipo de usina

## 🚀 Como Executar

### Opção 1: PowerShell (Requer psql instalado)

```powershell
cd database
.\run_update.ps1
```

**Requisitos:**
- PostgreSQL Client (psql) instalado
- Instalar: `winget install PostgreSQL.PostgreSQL`

### Opção 2: Node.js (Recomendado)

```bash
cd database
npm install pg
node run_update.js
```

**Requisitos:**
- Node.js instalado
- Instalar dependência: `npm install pg`

### Opção 3: Manual via psql

```bash
psql "postgres://postgres:bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ@147.93.71.233:6543/postgres" -f update_geradores_table.sql
```

### Opção 4: Copiar e Colar no pgAdmin

1. Abra o pgAdmin ou qualquer cliente PostgreSQL
2. Conecte ao banco: `147.93.71.233:6543`
3. Abra o arquivo `update_geradores_table.sql`
4. Execute o script completo

## 📁 Arquivos

- `update_geradores_table.sql` - Script SQL completo
- `run_update.ps1` - Script PowerShell para execução automática
- `run_update.js` - Script Node.js para execução automática
- `README.md` - Este arquivo

## 🔍 Verificação

Após executar, o script mostrará:
1. ✅ Estrutura atualizada da tabela
2. ✅ Lista de índices criados
3. ✅ Constraints aplicadas
4. ✅ Total de geradores no banco

## ⚠️ Importante

- O script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- Usa `IF NOT EXISTS` e `IF EXISTS` para evitar erros
- **Não apaga dados existentes**
- Faz backup automático dos dados antes de qualquer alteração estrutural

## 🔗 Conexão ao Banco

```
Host: 147.93.71.233
Port: 6543
Database: postgres
User: postgres
Password: bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ
```

## 📝 Exemplo de INSERT Atualizado

Após a atualização, use este formato:

```sql
INSERT INTO geradores (
  nome, 
  tipo_documento, 
  cpf_cnpj, 
  email,
  rua, 
  numero_casa, 
  bairro, 
  cidade, 
  uf, 
  cep,
  banco, 
  agencia, 
  conta,
  tipo_usina, 
  numero_uc
) VALUES (
  'Douglas Tibola',
  'cnpj',
  '62.877.740/0001-68',
  'douglas.tibola@yahoo.com.br',
  'Prefeito José Acco',
  '443',
  'Dona Helena',
  'Ibicaré',
  'SC',
  '89640-000',
  'SICOOB',
  '5286-8',
  '4225-0',
  'solar',
  '59191307'
)
ON CONFLICT (cpf_cnpj) 
DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  atualizado_em = CURRENT_TIMESTAMP;
```

## 🆘 Troubleshooting

### Erro de conexão
- Verifique se o IP `147.93.71.233` está acessível
- Verifique se a porta `6543` não está bloqueada por firewall
- Teste a conexão: `telnet 147.93.71.233 6543`

### Erro de permissão
- Verifique se o usuário `postgres` tem permissões de ALTER TABLE
- O usuário precisa ser owner ou ter privilégios de SUPERUSER

### Erro "relation geradores does not exist"
- A tabela ainda não existe, você precisa criá-la primeiro
- Execute o script completo que também cria a tabela se não existir

## 📞 Suporte

Se houver algum erro durante a execução, o script mostrará:
- ❌ Mensagem de erro detalhada
- 📍 Linha do SQL que causou o problema
- 💡 Sugestão de como resolver
