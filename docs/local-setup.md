# Setup local do projeto Ignite Starter

Este guia descreve o passo a passo completo para rodar o projeto **localmente** usando Docker, Prisma e Bun/Node.

> Siga as etapas na ordem. Ao final, você deve conseguir rodar `bun dev` e testar o app em `http://localhost:3000`.

---

## 1. Pré‑requisitos

Antes de começar, tenha instalado na sua máquina:

- **Git**
- **Node.js 22+** (recomendado se for usar `npm`/`npx`)
- **[Bun](https://bun.sh/)** (recomendado para este projeto)
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (com Docker Compose)
- **[Stripe CLI](https://stripe.com/docs/stripe-cli)** (para webhooks, se quiser rodar fora do container)

Verifique rapidamente:

```bash
node -v
bun -v
docker --version
stripe --version
```

---

## 2. Clonar o repositório e instalar dependências

```bash
# 1) Clonar o projeto
git clone git@github.com:WilliamElesbao/origin-starter.git
cd origin-starter

# 2) Instalar dependências (recomendado)
bun install

# (Opcional) Se preferir npm
# npm install
```

---

## 3. Configurar variáveis de ambiente

O projeto já possui um arquivo de exemplo: `.env.example`.

1. Crie o arquivo `.env` na raiz a partir do exemplo:

```bash
cp .env.example .env
```

2. Abra o `.env` e preencha os valores marcados como `<your secret>`:

```dotenv
# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/starter

# BetterAuth
BETTER_AUTH_SECRET=<gerar um segredo forte>
BETTER_AUTH_URL=http://localhost:3000

# Google
GOOGLE_CLIENT_ID=<copiar do Google Cloud Console>
GOOGLE_CLIENT_SECRET=<copiar do Google Cloud Console>

# Email (opcional para ambiente local)
RESEND_API_KEY=<se tiver>
EMAIL_FROM=delivered@resend.dev
EMAIL_TO=example@mail.com
AUDIENCE_ID=<se tiver>

# Stripe
STRIPE_SECRET_KEY=<copiar da conta Stripe (chave de teste)>
STRIPE_WEBHOOK_SECRET=<copiar do Stripe CLI após configurar webhook>
```

> Como obter as variáveis de **Google** e **Stripe** está detalhado em:
> - `docs/google-oauth-setup.md`
> - `docs/stripe-setup.md`

---

## 4. Subir os containers Docker

O projeto já contém um `docker-compose.yml` com:

- `postgres` – banco de dados PostgreSQL
- `starter-studio` – Prisma Studio em container
- `stripe` – Stripe CLI em modo "listen" para webhooks (pode ser ajustado para usar sua própria conta)

Para subir os serviços de infraestrutura:

```bash
# Na raiz do projeto
docker compose up -d

# (Caso seu Docker use o comando antigo)
# docker-compose up -d
```

Isso irá expor:

- PostgreSQL em `localhost:5432`
- Prisma Studio (container) em `http://localhost:5555` (ver sessão de Prisma abaixo)

Verifique se os containers estão rodando:

```bash
docker ps
```

Você deve ver algo como:

- `starter-postgres`
- `starter-studio`
- `stripe-cli` (opcional, dependendo da configuração do `docker-compose.yml`)

---

## 5. Configurar e rodar Prisma (migrations + ver tabelas)

O projeto usa Prisma com PostgreSQL. A URL do banco é lida de `DATABASE_URL` no `.env`.

### 5.1. Garantir que o banco está ativo

Confirme que o container `starter-postgres` está rodando:

```bash
docker ps | grep starter-postgres
```

Se não estiver, rode novamente:

```bash
docker compose up -d postgres
```

### 5.2. Rodar migrations

Com o Docker e `.env` configurados, aplique as migrations no banco local:

```bash
# Usando Bunnunx prisma migrate dev --name init

# (Alternativa com npx)
# npx prisma migrate dev --name init
```

Isso irá:

- Criar as tabelas definidas em `prisma/schema.prisma` no banco `starter`
- Atualizar a pasta `prisma/migrations`

### 5.3. Ver tabelas com Prisma Studio

Existem **duas formas** de abrir o Prisma Studio:

#### Opção A – Usando o container `starter-studio`

1. Com o Docker rodando (`docker compose up -d`), acesse:

   - `http://localhost:5555`

2. Você verá o Prisma Studio conectado ao banco Postgres do Docker.

#### Opção B – Usando Prisma Studio via CLI local

```bash
# Usando Bun
bunx prisma studio

# (ou com npx)
# npx prisma studio
```

Por padrão, ele utilizará a URL de `DATABASE_URL` do seu `.env`.

---

## 6. Configurar Google OAuth

Para login com Google, você precisa das variáveis:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

O passo a passo completo está em `docs/google-oauth-setup.md`, incluindo:

- Criação do projeto no **Google Cloud Console**
- Configuração da tela de consentimento OAuth
- Criação das credenciais OAuth 2.0 (Client ID / Secret)
- Configuração de **URIs de redirecionamento** para ambiente local

Depois de obter os valores, atualize o seu `.env`.

---

## 7. Configurar Stripe (test mode + webhook)

Para integração com Stripe, você precisa no `.env`:

- `STRIPE_SECRET_KEY` (chave secreta de **teste**)
- `STRIPE_WEBHOOK_SECRET` (segredo do webhook gerado pelo Stripe CLI)

O passo a passo detalhado está em `docs/stripe-setup.md`, incluindo:

- Criar/usar uma conta Stripe em modo **Test**
- Encontrar e copiar a `STRIPE_SECRET_KEY`
- Rodar o Stripe CLI (local ou via Docker) com:

  ```bash
  stripe listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
  ```

- Copiar o valor de `whsec_...` para `STRIPE_WEBHOOK_SECRET`
- Gerar eventos de teste para verificar o webhook

---

## 8. Rodar o projeto localmente

Com tudo configurado:

1. Containers Docker rodando (`postgres`, `starter-studio`, opcionalmente `stripe-cli`)
2. `.env` preenchido com Google/Stripe/DB/BetterAuth
3. Migrations executadas com Prisma

Rode o servidor de desenvolvimento:

```bash
# Recomendado
bun dev

# Alternativas
# npm run dev
# pnpm dev
# yarn dev
```

Abra em seguida:

- `http://localhost:3000`

Você deve conseguir:

- Acessar o dashboard/login
- Iniciar o fluxo de login com Google (se configurado)
- Realizar ações que disparem chamadas para Stripe (se configurado)

---

## 9. Referências

- **Next.js**: https://nextjs.org/docs
- **Docker Desktop**: https://docs.docker.com/desktop/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Prisma ORM**: https://www.prisma.io/docs
- **Prisma Studio (Docker image)**: https://hub.docker.com/r/timothyjmiller/prisma-studio
- **Stripe Docs**: https://stripe.com/docs
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Google Cloud Console**: https://console.cloud.google.com/
