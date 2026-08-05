# Configuracao do Banco de Dados

## PostgreSQL com SSL (Square Cloud)

O projeto esta configurado para usar PostgreSQL. Para conexao segura com o banco do Square Cloud, siga os passos abaixo.

## 1. Crie o banco no Square Cloud

- Acesse Dashboard → Bancos de dados → Criar banco de dados
- Escolha PostgreSQL e a RAM desejada
- Anote: Host, Porta, Usuario, Senha e Nome do banco

## 2. Baixe os certificados SSL

Na aba de configuracoes do banco, baixe:
- `certificate.pem` (contem chave + certificado)

## 3. Salve os certificados no projeto

Coloque o arquivo `certificate.pem` na pasta `certs/` do projeto:
```
certs/certificate.pem
```

## 4. Gere o arquivo .p12

O Prisma v6 precisa de um arquivo .p12 para conexao SSL. Execute:

### No Windows (com Git Bash, WSL ou OpenSSL instalado):
```bash
openssl pkcs12 -export -out certs/certificate.p12 -in certs/certificate.pem -password pass:squarecloud
```

### Ou com o script Node.js:
```bash
node certs/generate-p12.js
```

A senha padrao do .p12 e: `squarecloud`

## 5. Configure a DATABASE_URL

No painel do Square Cloud, configure a variavel `DATABASE_URL`:

```env
postgresql://squarecloud:ZpaXsUrPD0S8apEMoWnh8qqd@square-cloud-db-ec92e0642b914258b5fff2d991c218be.squareweb.app:7017/ecommerce?sslmode=verify-ca&sslidentity=./certs/certificate.p12&sslpassword=squarecloud
```

## 6. Faca upload dos certificados no Square Cloud

No painel da aplicacao, faca upload da pasta `certs/` para a raiz do projeto (deve ficar acessivel em `./certs/certificate.p12` no servidor).

## 7. Deploy

Faca o deploy novamente. O build vai sincronizar o banco automaticamente.

## ⚠️ Seguranca

Os certificados estao no `.gitignore`. NUNCA envie certificados `.pem`, `.p12`, `.crt` ou `.key` para repositorios publicos.

## Migrations

Para sincronizar o banco de dados localmente, execute:

```bash
npx prisma db push
```