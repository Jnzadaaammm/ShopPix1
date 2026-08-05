# Configuracao do Banco de Dados

## PostgreSQL com SSL (Square Cloud)

O projeto esta configurado para usar PostgreSQL. Para conexao segura com o banco do Square Cloud, siga os passos abaixo.

## 1. Crie o banco no Square Cloud

- Acesse Dashboard → Bancos de dados → Criar banco de dados
- Escolha PostgreSQL e a RAM desejada
- Anote: Host, Porta, Usuario, Senha e Nome do banco

## 2. Baixe os certificados SSL

Na aba de configuracoes do banco, baixe:
- `private-key.key` (chave privada)
- `ca-certificate.crt` (certificado CA)

## 3. Salve os certificados no projeto

Coloque os arquivos na pasta `certs/` do projeto:
```
certs/private-key.key
certs/ca-certificate.crt
```

## 4. Configure a DATABASE_URL

No painel do Square Cloud, configure a variavel `DATABASE_URL`:

```env
postgresql://squarecloud:ZpaXsUrPD0S8apEMoWnh8qqd@square-cloud-db-ec92e0642b914258b5fff2d991c218be.squareweb.app:7017/ecommerce?sslmode=verify-ca&sslkey=./certs/private-key.key&sslcert=./certs/ca-certificate.crt&sslrootcert=./certs/ca-certificate.crt
```

## 5. Faca upload dos certificados no Square Cloud

No painel da aplicacao, envie os arquivos da pasta `certs/` para a raiz do projeto (devem ficar acessiveis em `./certs/private-key.key` e `./certs/ca-certificate.crt` no servidor).

## 6. Deploy

Faca o deploy novamente. O build vai sincronizar o banco automaticamente.

## ⚠️ Seguranca

Os certificados estao no `.gitignore`. NUNCA envie certificados `.pem`, `.p12`, `.crt` ou `.key` para repositorios publicos.

## Migrations

Para sincronizar o banco de dados localmente, execute:

```bash
npx prisma db push
```