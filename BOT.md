# Bot do Discord — ShopPix

O bot do Discord roda como um processo separado do site. Ele se comunica com a loja via **API REST HTTP** (`/api/bot/*`), autenticando com uma **chave de API** gerada no painel admin.

## Fluxo de integração

```
[Bot do Discord] --HTTP + Bearer token--> [Site ShopPix /api/bot/*] --> [Banco de dados]
```

1. Você gera uma chave de API em **Admin → Gerador de API** (`/admin/apigenerator`)
2. Coloca a chave no `.env` do bot (`SHOPPIX_API_KEY`)
3. O bot chama os endpoints `/api/bot/*` do site com essa chave
4. O site valida a chave, verifica permissões e executa a ação no banco

Isso permite que o bot rode em servidor separado do site, sem precisar acessar o banco diretamente.

## Funcionalidades

### 🛍️ Gestão de loja
- `/produtos [busca] [categoria] [destaque]` — lista produtos
- `/produto <id>` — detalhes de um produto
- `/produto-add` — cadastra um novo produto (admin)
- `/categorias` — lista categorias (admin, útil para `/produto-add`)
- `/estoque <id> <quantidade>` — atualiza estoque de credenciais (admin)
- `/pedidos [status]` — lista pedidos (admin)
- `/pedido <id>` — detalhes de um pedido (admin)
- `/aprovar <id>` — aprova e entrega um pedido (dono)
- `/rejeitar <id> [motivo]` — rejeita/cancela um pedido (dono)
- `/painel` — resumo da loja: faturamento, pedidos, produtos (admin)

### 🎧 Suporte ao cliente
- `/ajuda` — lista todos os comandos
- `/ticket <assunto>` — abre um canal de suporte privado
- `/fechar` — fecha o ticket atual
- `/contato` — informações de contato da loja

### 🛡️ Moderação do servidor
- `/banir <user> [motivo]` — bane um membro (BanMembers)
- `/expulsar <user> [motivo]` — expulsa um membro (KickMembers)
- `/mutar <user> <minutos> [motivo]` — muta temporariamente (ModerateMembers)
- `/desmutar <user>` — remove o timeout (ModerateMembers)
- `/limpar <quantidade>` — apaga mensagens (ManageMessages)

## Como configurar

### 1. Criar o bot no Discord

1. Acesse https://discord.com/developers/applications
2. Clique em **New Application** e dê um nome (ex: `ShopPix Bot`)
3. Vá em **Bot** → **Reset Token** e copie o token
4. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Ban Members`, `Kick Members`, `Manage Messages`, `Moderate Members`, `Manage Channels`, `Manage Roles`
5. Copie o link gerado e adicione o bot no seu servidor
6. Ative as **Privileged Gateway Intents** (Server Members Intent) na página do bot

### 2. Gerar a chave de API no site

1. Acesse **Admin → Gerador de API** (`/admin/apigenerator`)
2. Clique em **Gerar nova chave**
3. Dê um nome (ex: "Bot Discord")
4. Permissões: `*` (acesso total) ou permissões específicas
5. **Copie a chave** (ela só aparece uma vez!)

### 3. Configurar o `.env` do bot

```
# Token e IDs do Discord
DISCORD_BOT_TOKEN=seu-token-aqui
DISCORD_GUILD_ID=id-do-seu-servidor
DISCORD_CLIENT_ID=id-do-bot (Application ID)

# API do ShopPix (gere em /admin/apigenerator)
SHOPPIX_API_URL=https://shop-pix.com
SHOPPIX_API_KEY=sk_sua_chave_aqui

# Cargos (opcional)
DISCORD_ADMIN_ROLE_ID=id-do-cargo-admin
DISCORD_SUPPORT_ROLE_ID=id-do-cargo-suporte
DISCORD_OWNER_ROLE_ID=id-do-cargo-dono
DISCORD_TICKET_CATEGORY_ID=id-da-categoria-de-tickets
```

### 4. Registrar comandos e rodar

```bash
# Registrar os comandos slash (faça uma vez, ou quando adicionar comandos novos)
npm run bot:deploy

# Rodar o bot
npm run bot

# Ou com auto-reload em desenvolvimento
npm run bot:dev
```

## Permissões

- **Comandos públicos** (`/produtos`, `/produto`, `/ajuda`, `/ticket`, `/fechar`, `/contato`): qualquer membro
- **Comandos admin** (`/produto-add`, `/estoque`, `/pedidos`, `/pedido`, `/categorias`, `/painel`): dono do servidor, Administrator, ou cargo em `DISCORD_ADMIN_ROLE_ID`
- **Comandos do dono** (`/aprovar`, `/rejeitar`): dono do servidor ou cargo em `DISCORD_OWNER_ROLE_ID`
- **Comandos de moderação** (`/banir`, `/expulsar`, `/mutar`, `/desmutar`, `/limpar`): permissões correspondentes do Discord

## Endpoints da API do bot

O site expõe estes endpoints para o bot (todos exigem `Authorization: Bearer sk_...`):

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/bot/dashboard` | orders.view | Resumo da loja |
| GET | `/api/bot/products` | products.manage | Lista produtos |
| POST | `/api/bot/products` | products.manage | Cria produto |
| GET | `/api/bot/products/[id]` | products.manage | Detalhe de produto |
| PATCH | `/api/bot/products/[id]` | products.manage | Atualiza produto |
| GET | `/api/bot/categories` | products.manage | Lista categorias |
| GET | `/api/bot/orders` | orders.view | Lista pedidos |
| GET | `/api/bot/orders/[id]` | orders.view | Detalhe de pedido |
| POST | `/api/bot/orders/[id]/approve` | orders.manage | Aprova e entrega |
| POST | `/api/bot/orders/[id]/reject` | orders.manage | Rejeita/cancela |
| GET | `/api/bot/settings` | orders.view | Config da loja |

## Como rodar na Square Cloud (em produção)

Na Square Cloud cada instância roda um único comando. Para manter o bot online 24h, crie um **segundo serviço** na plataforma apontando para:

```json
{
  "main": "bot/index.ts",
  "memory": "1024MB"
}
```

> **Importante**: O bot precisa das variáveis `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CLIENT_ID`, `SHOPPIX_API_URL` e `SHOPPIX_API_KEY`. Como ele agora usa HTTP API, **não precisa** do `DATABASE_URL` — ele acessa o site via internet.

## Arquitetura

```
bot/
├── index.ts              # Entrada do bot (login, eventos, dispatch de comandos)
├── deploy-commands.ts    # Registra comandos slash no Discord
├── api-client.ts         # Cliente HTTP que chama /api/bot/* do site
├── package.json          # Scripts do bot
├── lib/
│   └── helpers.ts        # Permissões, formatação, helpers compartilhados
└── commands/
    ├── index.ts          # Carregador dinâmico de comandos
    ├── store/            # Gestão de loja (via API HTTP)
    ├── support/          # Suporte ao cliente (tickets Discord)
    └── moderation/       # Moderação do servidor
```

O bot faz chamadas HTTP para o site, autenticando com a chave de API. Aprovar um pedido pelo bot tem o mesmo efeito de aprovar pelo painel web — entrega de produtos digitais, notificações via webhook, promoção de cargo, tudo acontece igual.

## Obter o ID do servidor

No Discord, ative o modo desenvolvedor em **Configurações → Avançado → Modo desenvolvedor**. Clique com o botão direito no nome do servidor e **Copiar ID do servidor**.
