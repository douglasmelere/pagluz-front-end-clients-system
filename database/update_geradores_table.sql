-- ========================================
-- SCRIPT DE ATUALIZAÇÃO DA TABELA GERADORES
-- Data: 2026-01-19
-- ========================================

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'geradores'
ORDER BY ordinal_position;

-- ========================================
-- 2. ADICIONAR COLUNA DE ATUALIZAÇÃO (se não existir)
-- ========================================
ALTER TABLE geradores 
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criar trigger para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela geradores
DROP TRIGGER IF EXISTS update_geradores_updated_at ON geradores;
CREATE TRIGGER update_geradores_updated_at
    BEFORE UPDATE ON geradores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. RENOMEAR COLUNA (se existir 'unidade_consumidora')
-- ========================================
-- Verificar se a coluna 'unidade_consumidora' existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'geradores' 
        AND column_name = 'unidade_consumidora'
    ) THEN
        ALTER TABLE geradores 
        RENAME COLUMN unidade_consumidora TO numero_uc;
        RAISE NOTICE 'Coluna unidade_consumidora renomeada para numero_uc';
    ELSE
        RAISE NOTICE 'Coluna unidade_consumidora não encontrada, verificando numero_uc...';
    END IF;
END $$;

-- Se numero_uc não existir, criar
ALTER TABLE geradores 
ADD COLUMN IF NOT EXISTS numero_uc VARCHAR(50);

-- ========================================
-- 4. GARANTIR QUE TODOS OS CAMPOS NECESSÁRIOS EXISTAM
-- ========================================

-- Campos de identificação
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(10) CHECK (tipo_documento IN ('cpf', 'cnpj', 'CPF', 'CNPJ'));
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18) NOT NULL DEFAULT '';
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Campos de endereço
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS rua VARCHAR(255);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS numero_casa VARCHAR(10);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Campos bancários
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS banco VARCHAR(100);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS agencia VARCHAR(20);
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS conta VARCHAR(20);

-- Campos da usina
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS tipo_usina VARCHAR(50);

-- Timestamps
ALTER TABLE geradores ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ========================================
-- 5. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ========================================

-- Índice para busca por CPF/CNPJ
CREATE INDEX IF NOT EXISTS idx_geradores_cpf_cnpj 
ON geradores(cpf_cnpj);

-- Índice para busca por número da UC
CREATE INDEX IF NOT EXISTS idx_geradores_numero_uc 
ON geradores(numero_uc);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_geradores_email 
ON geradores(email);

-- Índice para busca por tipo de usina
CREATE INDEX IF NOT EXISTS idx_geradores_tipo_usina 
ON geradores(tipo_usina);

-- Índice para busca por cidade/UF (útil para filtros regionais)
CREATE INDEX IF NOT EXISTS idx_geradores_cidade_uf 
ON geradores(cidade, uf);

-- Índice para busca por nome (útil para autocomplete)
CREATE INDEX IF NOT EXISTS idx_geradores_nome 
ON geradores USING gin(to_tsvector('portuguese', nome));

-- Índice para ordenação por data de criação
CREATE INDEX IF NOT EXISTS idx_geradores_criado_em 
ON geradores(criado_em DESC);

-- ========================================
-- 6. ADICIONAR CONSTRAINTS ÚTEIS
-- ========================================

-- Garantir que CPF/CNPJ seja único (se ainda não for)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'geradores_cpf_cnpj_unique'
    ) THEN
        ALTER TABLE geradores 
        ADD CONSTRAINT geradores_cpf_cnpj_unique 
        UNIQUE (cpf_cnpj);
    END IF;
END $$;

-- Garantir que email seja único (se desejar)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'geradores_email_unique'
    ) THEN
        ALTER TABLE geradores 
        ADD CONSTRAINT geradores_email_unique 
        UNIQUE (email);
    END IF;
END $$;

-- Validação de UF
ALTER TABLE geradores 
DROP CONSTRAINT IF EXISTS geradores_uf_check;

ALTER TABLE geradores 
ADD CONSTRAINT geradores_uf_check 
CHECK (uf IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
              'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
              'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'));

-- Validação de tipo de usina
ALTER TABLE geradores 
DROP CONSTRAINT IF EXISTS geradores_tipo_usina_check;

ALTER TABLE geradores 
ADD CONSTRAINT geradores_tipo_usina_check 
CHECK (tipo_usina IN ('solar', 'eolica', 'hidrica', 'biomassa', 'biogas', 'hibrida'));

-- ========================================
-- 7. VERIFICAR RESULTADO FINAL
-- ========================================

SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'geradores'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'geradores'
ORDER BY indexname;

-- Verificar constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'geradores'::regclass;

-- Contar registros
SELECT COUNT(*) as total_geradores FROM geradores;

-- ========================================
-- 8. EXEMPLO DE INSERT ATUALIZADO
-- ========================================

/*
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
  numero_uc,
  criado_em
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
  '59191307',
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf_cnpj) 
DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  rua = EXCLUDED.rua,
  numero_casa = EXCLUDED.numero_casa,
  bairro = EXCLUDED.bairro,
  cidade = EXCLUDED.cidade,
  uf = EXCLUDED.uf,
  cep = EXCLUDED.cep,
  banco = EXCLUDED.banco,
  agencia = EXCLUDED.agencia,
  conta = EXCLUDED.conta,
  tipo_usina = EXCLUDED.tipo_usina,
  numero_uc = EXCLUDED.numero_uc,
  atualizado_em = CURRENT_TIMESTAMP;
*/

-- ========================================
-- FIM DO SCRIPT
-- ========================================
