# Configuracao do Banco de Dados

## PostgreSQL com SSL (Square Cloud)

O projeto esta configurado para usar PostgreSQL. Para conexao segura com o banco do Square Cloud, use a seguinte `DATABASE_URL`:

```env
DATABASE_URL="postgresql://squarecloud:ZpaXsUrPD0S8apEMoWnh8qqd@square-cloud-db-ec92e0642b914258b5fff2d991c218be.squareweb.app:7017"
```

## Certificado SSL

O certificado CA foi salvo em:
- `certs/ca.crt`

## Configuracao no Square Cloud

No painel do Square Cloud, configure a variavel de ambiente `DATABASE_URL` com a connection string acima.

Se houver erro de SSL, adicione o certificado manualmente no painel do Square Cloud ou desative a verificacao com:

```env
DATABASE_URL="postgresql://squarecloud:ZpaXsUrPD0S8apEMoWnh8qqd@square-cloud-db-ec92e0642b914258b5fff2d991c218be.squareweb.app:7017?sslmode=require"
```

## Migrations

Para sincronizar o banco de dados, execute:

```bash
npx prisma db push
```

Ou, se estiver no deploy automatico, o build ja faz isso.