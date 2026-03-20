# 🚀 Guia Final: Novo Fluxo Unificado de Propostas (PagLuz)

> **Última Atualização:** 20/03/2026 - **Mantenha este guia atualizado.**

Este guia descreve o fluxo unificado onde os representantes realizam um **cadastro completo** desde o início, que entra em uma fila de "Solicitação de Proposta" antes de seguir para a aprovação final.

---

## 🔘 Visão Geral do Fluxo de Status

1.  **`PROPOSAL_REQUESTED`**: Representante cadastrou o cliente completo (com fatura) e aguarda o Admin gerar o cálculo/PDF da proposta.
2.  **`PROPOSAL_GENERATED`**: Admin anexou o PDF da proposta. O representante agora pode baixar e apresentar ao cliente.
3.  **`PROPOSAL_REJECTED`**: A proposta foi recusada (seja pelo Admin ou pelo próprio Cliente via Representante).
4.  **`PENDING`**: O cliente **ACEITOU** a proposta. O cadastro agora cai na fila de **"Pendentes"** (Aprovação Comercial Final).
5.  **`APPROVED` / `REJECTED`**: Decisão final do Admin. Se aprovado, o cliente vira oficialmente um Consumidor Ativo.

---

## 🛠 Endpoints da API (Backend)

### 🧩 Para o APP DO REPRESENTANTE

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| **POST** | `/consumers/representative/proposal` | **Cadastro Inicial:** Enviar dados completos + arquivo da fatura (via FormData). O status inicial será `PROPOSAL_REQUESTED`. |
| **GET** | `/consumers/representative/my` | Listar meus clientes. Filtre no front pelos status de proposta para montar a aba de "Minhas Propostas". |
| **PATCH** | `/consumers/:id/proposal-accept` | Botão **"Cliente Aceitou"**: Move o status de `PROPOSAL_GENERATED` para `PENDING`. |
| **PATCH** | `/consumers/:id/proposal-reject` | Botão **"Cliente Recusou"**: Move o status para `PROPOSAL_REJECTED`. |
| **GET** | `/consumers/representative/:id/proposal-document` | Download do PDF da proposta gerada pelo Admin. |

### 🛠 Para o PAINEL ADMIN / OPERADOR

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| **GET** | `/consumers/proposals` | **Aba Solicitações:** Lista todos em `PROPOSAL_REQUESTED`, `PROPOSAL_GENERATED` ou `PROPOSAL_REJECTED`. |
| **PATCH** | `/consumers/:id/proposal-generate` | **Enviar Proposta:** Upload do arquivo PDF. Muda status para `PROPOSAL_GENERATED`. |
| **PATCH** | `/consumers/:id/proposal-confirm` | **Aprovar Proposta:** Botão manual para o Admin mover o cliente da aba Solicitações para a aba Pendentes (`PENDING`). |
| **PATCH** | `/consumers/:id/proposal-refuse` | **Recusar Solicitação:** Admin recusa o pedido antes mesmo de gerar proposta. Status: `PROPOSAL_REJECTED`. |
| **GET** | `/consumers/pending` | **Aba Pendentes:** Lista apenas quem está em status `PENDING`. (Fluxo de conferência final). |
| **PATCH** | `/consumers/:id/approve` | **Aprovação Final:** Cliente vira `APPROVED`. |

---

## 📝 Notas importantes para o Frontend

1.  **Cadastro Diretor (Sem Proposta):** Se o representante cadastrar um cliente diretamente pela aba de "Consumidores" (usando o endpoint padrão `POST /consumers/representative`), o sistema pulará a fase de proposta e ele cairá direto em `PENDING` (Aba de Pendentes do Admin). Isso é útil para quando o cálculo já foi feito por fora.
2.  **FormData vs JSON:** O endpoint de criação de proposta aceita `multipart/form-data` para que você envie os dados do cliente e o arquivo da fatura original no mesmo clique.
3.  **Blindagem:** O backend está configurado para ignorar campos de `status` enviados pelo front. O servidor decide o status inicial baseado no endpoint chamado.

---
*Este fluxo garante que nenhum dado seja perdido e elimina a redigitação de informações pelo Administrador.*
