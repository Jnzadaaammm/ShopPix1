# ShopPix - E-commerce com PIX

Loja online com login via **Google** e **Discord**, e pagamento exclusivo via **PIX**.

## Funcionalidades

- Catálogo de produtos com categorias
- Carrinho de compras
- Login exclusivo via Google e Discord
- Checkout com pagamento PIX (QR Code + Copia e Cola)
- Histórico de pedidos
- Design responsivo e moderno

## Tecnologias

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js v5** (Google + Discord)
- **Prisma** + SQLite
- **PIX** (modo demo ou Mercado Pago)

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

### 3. Configurar OAuth

**Google:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto e credenciais OAuth 2.0
3. Adicione `http://localhost:3000/api/auth/callback/google` como redirect URI
4. Copie Client ID e Client Secret para o `.env`

**Discord:**
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma aplicação > OAuth2
3. Adicione `http://localhost:3000/api/auth/callback/discord` como redirect URI
4. Copie Client ID e Client Secret para o `.env`

### 4. Configurar banco de dados

```bash
npx prisma db push
npm run db:seed
```

### 5. Iniciar o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Pagamento PIX

Por padrão, o sistema gera QR Codes PIX em **modo demo** (sem integração bancária real).

Para PIX real via Mercado Pago:
1. Crie uma conta em [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Obtenha o Access Token
3. Adicione `MERCADOPAGO_ACCESS_TOKEN` no `.env`

## Estrutura

```
src/
├── app/              # Páginas e rotas API
├── components/       # Componentes React
├── lib/              # Auth, DB, PIX, utils
└── types/            # Tipos TypeScript
```
