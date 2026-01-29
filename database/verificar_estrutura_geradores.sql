-- ========================================
-- VERIFICAÇÃO DA TABELA GERADORES
-- Apenas dados do GERADOR devem ser salvos
-- ========================================

-- 1. Ver estrutura atual
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'geradores'
ORDER BY ordinal_position;

-- 2. Verificar se há campos de consumidor (NÃO DEVE TER)
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'geradores'
AND column_name LIKE '%consumidor%';

-- ========================================
-- ESTRUTURA CORRETA - APENAS GERADOR
-- ========================================

/*
CAMPOS CORRETOS DA TABELA GERADORES:

✅ Identificação do Gerador:
- id
- nome
- tipo_documento (cpf/cnpj)
- cpf_cnpj
- email

✅ Endereço do Gerador:
- rua
- numero_casa (ou numero)
- bairro
- cidade
- uf
- cep

✅ Dados Bancários do Gerador:
- banco
- agencia
- conta

✅ Dados da Usina do Gerador:
- tipo_usina
- numero_uc (número da UC do gerador)

✅ Timestamps:
- criado_em
- atualizado_em

❌ NÃO DEVE TER:
- Nada relacionado a consumidor
- Nada relacionado ao contrato (percentuais, prazos, etc)
*/

-- ========================================
-- VERIFICAR DADOS DUPLICADOS OU INCORRETOS
-- ========================================

-- Ver se há geradores com dados estranhos
SELECT 
    id,
    nome,
    cpf_cnpj,
    numero_uc,
    tipo_usina,
    criado_em
FROM geradores
ORDER BY criado_em DESC
LIMIT 10;
