# Bot do Discord

O bot do Discord roda como um processo separado do site. Ele mantém presença no servidor, sincroniza cargos e notifica sobre pedidos via webhook.

## Como criar o bot

1. Acesse https://discord.com/developers/applications
2. Clique em **New Application** e dê um nome (ex: `ShopPix Bot`)
3. Vá em **Bot** → **Reset Token** e copie o token
4. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Roles`, `Read Messages/View Channels`, `Send Messages`, `Manage Messages` (opcional)
5. Copie o link gerado e adicione o bot no seu servidor

## Variáveis de ambiente

Adicione no `.env` e no painel da Square Cloud:

```
DISCORD_BOT_TOKEN=seu-token-aqui
DISCORD_GUILD_ID=id-do-seu-servidor
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../...
DISCORD_ORDERS_WEBHOOK_URL=https://discord.com/api/webhooks/.../...
```

## Como rodar local

```bash
npm run bot
```

## Como rodar na Square Cloud (em produção)

Na Square Cloud cada instância roda um único comando. Para manter o bot online 24h, crie um **segundo serviço** na plataforma apontando para:

```json
{
  "main": "src/bot/index.ts",
  "memory": "1024MB"
}
```

Ou rode manualmente via SSH com `npm run bot` (não é recomendado para 24h).

## Funcionalidades

- **Sincronia de cargos**: quando o bot inicia, cria/atualiza os cargos do site no Discord
- **Entrada de membros**: sincroniza o cargo do site quando alguém entra no servidor
- **Mudança de cargos**: se um cargo do Discord é adicionado/removido, reflete no site
- **Notificações de pedidos**: novos pedidos, pagamentos confirmados e entregas são enviados para o webhook

## Obter o ID do servidor

No Discord, ative o modo desenvolvedor em **Configurações → Avançado → Modo desenvolvedor**. Clique com o botão direito no nome do servidor e **Copiar ID do servidor**.
