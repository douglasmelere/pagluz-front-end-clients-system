# Sistema de Representantes Comerciais - PagLuz

## Visão Geral

O sistema de representantes comerciais foi implementado para permitir o gerenciamento completo de representantes que atuam na captação e gestão de clientes consumidores de energia. Este sistema integra-se ao sistema principal de gestão energética da PagLuz.

## Funcionalidades Implementadas

### 1. Gestão de Representantes Comerciais

#### CRUD Completo
- **Criar**: Cadastro de novos representantes com informações completas
- **Visualizar**: Lista todos os representantes com filtros e busca
- **Editar**: Atualização de dados dos representantes
- **Deletar**: Remoção de representantes do sistema

#### Campos do Representante
- **Informações Básicas**: Nome, email, CPF/CNPJ, telefone
- **Localização**: Cidade e estado
- **Comercial**: Taxa de comissão, especializações
- **Status**: Ativo, Inativo, Pendente de Aprovação
- **Observações**: Campo para notas adicionais

### 2. Integração com Consumidores

#### Vinculação Opcional
- Consumidores podem ou não ter representantes vinculados
- Campo opcional no cadastro/edição de consumidores
- Visualização clara na tabela de consumidores

#### Filtros e Busca
- Filtro por representante ativo
- Busca por nome, email ou CPF/CNPJ
- Filtros por status, cidade e estado

### 3. Dashboard e Estatísticas

#### Métricas Principais
- Total de representantes
- Representantes ativos vs. inativos
- Taxa média de comissão
- Distribuição por estado

#### Visualizações
- Cards de estatísticas
- Gráficos de distribuição geográfica
- Status em tempo real

## Estrutura Técnica

### Arquivos Criados/Modificados

#### Novos Arquivos
- `src/components/RepresentantesComerciais.tsx` - Componente principal
- `src/hooks/useRepresentantesComerciais.ts` - Hook de gerenciamento
- `src/types/services/representanteComercialService.ts` - Serviço de API

#### Arquivos Modificados
- `src/types/index.ts` - Adicionada interface RepresentanteComercial
- `src/components/Sidebar.tsx` - Nova aba "Representantes"
- `src/components/ClientesConsumidores.tsx` - Campo de representante
- `src/components/Dashboard.tsx` - Estatísticas de representantes
- `src/App.tsx` - Nova rota para representantes
- `src/context/AppContext.tsx` - Nova view "representantes"

### APIs Implementadas

#### Endpoints de Representantes
```
GET    /representatives              - Listar todos
GET    /representatives/:id          - Buscar por ID
POST   /representatives              - Criar novo
PATCH  /representatives/:id          - Atualizar
DELETE /representatives/:id          - Remover
PATCH  /representatives/:id/status   - Atualizar status
GET    /representatives/statistics   - Estatísticas
GET    /representatives/active       - Apenas ativos
GET    /representatives/by-state     - Agrupados por estado
GET    /representatives/by-specialization - Agrupados por especialização
```

#### Endpoints de Consumidores (Modificados)
```
PATCH  /consumers/:id                - Agora inclui representanteId
```

## Interface do Usuário

### Sidebar
- Nova aba "Representantes" com ícone UserCheck
- Posicionada após "Clientes Consumidores"
- Descrição: "Gestão de representantes"

### Página de Representantes
- **Header**: Título e botão "Novo Representante"
- **Estatísticas**: Cards com métricas principais
- **Filtros**: Busca, status, cidade, estado
- **Tabela**: Lista completa com ações
- **Modal**: Formulário de criação/edição

### Modal de Representante
- **Layout**: Grid responsivo 2 colunas
- **Validação**: Campos obrigatórios marcados
- **Especializações**: Checkboxes múltiplos
- **Status**: Dropdown com opções
- **Observações**: Campo de texto livre

### Integração com Consumidores
- **Campo Representante**: Dropdown opcional
- **Filtro**: Mostra apenas representantes ativos
- **Tabela**: Nova coluna "Representante"
- **Visualização**: Nome, cidade/estado do representante

## Fluxo de Trabalho

### 1. Cadastro de Representante
1. Acessar aba "Representantes"
2. Clicar em "Novo Representante"
3. Preencher formulário completo
4. Salvar e verificar na lista

### 2. Vinculação a Consumidor
1. Editar consumidor existente
2. Selecionar representante no dropdown
3. Salvar alterações
4. Verificar na tabela de consumidores

### 3. Gestão de Status
1. Alterar status diretamente na tabela
2. Apenas representantes ativos aparecem para vinculação
3. Histórico de mudanças mantido

## Configurações e Personalização

### Estados Disponíveis
- AC, AL, AP, AM, BA, CE, DF, ES, GO, MA
- MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN
- RS, RO, RR, SC, SP, SE, TO

### Especializações
- **Tipos de Energia**: SOLAR, HYDRO, WIND, BIOMASS
- **Tipos de Cliente**: RESIDENTIAL, COMMERCIAL, RURAL, INDUSTRIAL

### Status de Representante
- **ACTIVE**: Pode ser vinculado a consumidores
- **INACTIVE**: Não pode ser vinculado
- **PENDING_APPROVAL**: Aguardando aprovação

## Segurança e Validações

### Validações de Formulário
- Campos obrigatórios marcados com *
- Validação de email
- CPF/CNPJ obrigatório
- Taxa de comissão entre 0-100%

### Controle de Acesso
- Apenas usuários autenticados
- Token de autorização nas requisições
- Validação de permissões no backend

## Próximos Passos e Melhorias

### Funcionalidades Futuras
1. **Sistema de Comissões**: Cálculo automático baseado em vendas
2. **Relatórios**: Exportação de dados e métricas
3. **Notificações**: Alertas para mudanças de status
4. **Dashboard do Representante**: Visão específica para cada representante
5. **Histórico de Vendas**: Rastreamento de performance

### Integrações
1. **Sistema de Pagamentos**: Para comissões
2. **CRM**: Integração com sistema de relacionamento
3. **WhatsApp Business**: Comunicação direta
4. **Geolocalização**: Mapeamento de atuação

## Suporte e Manutenção

### Logs e Monitoramento
- Todas as operações são logadas
- Erros são capturados e exibidos
- Performance monitorada

### Backup e Recuperação
- Dados sincronizados com backend
- Validações de integridade
- Rollback em caso de falhas

---

**Desenvolvido para PagLuz** - Sistema de Gestão Energética
**Versão**: 1.0.0
**Data**: Dezembro 2024
