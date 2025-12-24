# Sistema de Gestão Energética - Frontend

Sistema de cadastro e gerenciamento de clientes geradores e consumidores de energia solar, integrado com a Energy Management API.

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Vite** como bundler

## 🔧 Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com a URL da sua API:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Executar o Projeto
```bash
npm run dev
```

## 🌐 Integração com a API

O frontend está configurado para funcionar com a Energy Management API desenvolvida em Nest.js.

### Endpoints Utilizados

#### Autenticação
- `POST /auth/login` - Login do usuário
- `POST /auth/logout` - Logout do usuário  
- `GET /auth/profile` - Validar token e obter dados do usuário

#### Dashboard
- `GET /dashboard` - Dados completos do dashboard
- `GET /dashboard/generators-by-source` - Geradores por tipo de fonte
- `GET /dashboard/consumers-by-type` - Consumidores por tipo

#### Geradores
- `GET /generators` - Listar geradores (com filtros via query params)
- `POST /generators` - Criar gerador
- `PATCH /generators/:id` - Atualizar gerador
- `DELETE /generators/:id` - Excluir gerador

#### Consumidores
- `GET /consumers` - Listar consumidores (com filtros via query params)
- `POST /consumers` - Criar consumidor
- `PATCH /consumers/:id` - Atualizar consumidor
- `DELETE /consumers/:id` - Excluir consumidor
- `POST /consumers/:id/allocate` - Alocar consumidor a gerador

### Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

1. **Login**: Envie `email` e `password` para `/auth/login`
2. **Token**: O `access_token` é armazenado no `localStorage`
3. **Requisições**: Todas as requisições incluem o token no header `Authorization: Bearer <token>`

### Tratamento de Erros

- Códigos HTTP padrão (200, 201, 400, 401, 404, etc.)
- Mensagens de erro em formato JSON
- Remoção automática de tokens inválidos (401)
- Feedback visual para o usuário

## 📱 Funcionalidades

### ✅ Implementadas
- **Autenticação JWT** com validação automática
- **Dashboard** com estatísticas em tempo real
- **CRUD Geradores** com filtros avançados
- **CRUD Consumidores** com sistema de alocação
- **Notificações** de sucesso/erro
- **Loading States** em todas as operações
- **Tratamento de Erros** com retry
- **Design Responsivo** para todos os dispositivos

### 🎯 Estrutura de Dados

#### Cliente Gerador
```typescript
{
  id: string;
  ownerName: string;
  cpfCnpj: string;
  sourceType: 'SOLAR' | 'HYDRO' | 'WIND' | 'BIOMASS';
  installedPower: number;
  utility: string;
  ucNumber: string;
  city: string;
  state: string;
  status: 'UNDER_ANALYSIS' | 'AWAITING_ALLOCATION';
  observations?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Cliente Consumidor
```typescript
{
  id: string;
  clientName: string;
  cpfCnpj: string;
  ucNumber: string;
  utility: string;
  city: string;
  state: string;
  consumerType: 'RESIDENTIAL' | 'COMMERCIAL' | 'RURAL' | 'INDUSTRIAL' | 'PUBLIC_POWER';
  averageMonthlyConsumption: number;
  offeredDiscount: number;
  availabilityStatus: 'AVAILABLE' | 'ALLOCATED';
  situation: 'AWAITING_ALLOCATION' | 'ALLOCATED_TO_PLANT';
  linkedPlantNumber?: string;
  allocatedEnergyPercentage?: number;
  createdAt: string;
  updatedAt: string;
}
```

## 🔐 Credenciais de Teste

Para acessar o sistema, use as credenciais configuradas no seu backend:
- **Email**: douglasmelere@gmail.com
- **Senha**: Juninhoplay13!

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Executar em modo desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Executar linter
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── common/         # Componentes reutilizáveis
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Login.tsx       # Tela de login
│   └── ...
├── hooks/              # Custom hooks
├── services/           # Serviços de API
├── types/              # Definições TypeScript
└── context/            # Context API
```

## 🚀 Deploy

O projeto está pronto para deploy em qualquer plataforma que suporte aplicações React:

- **Netlify**
- **Vercel** 
- **GitHub Pages**
- **AWS S3 + CloudFront**

Certifique-se de configurar a variável `VITE_API_BASE_URL` com a URL da sua API em produção.
