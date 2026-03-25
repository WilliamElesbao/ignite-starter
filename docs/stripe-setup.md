# Stripe – chave de teste, webhook e Docker

Este documento explica como configurar **Stripe** para ambiente local usando:

- Conta Stripe em modo **Test**
- `STRIPE_SECRET_KEY` (chave de teste)
- `STRIPE_WEBHOOK_SECRET` (segredo do webhook)
- Docker com `stripe/stripe-cli` ou Stripe CLI instalada localmente

Ao final você será capaz de:

- Processar chamadas para a API Stripe com a chave de teste.
- Receber eventos de webhook em `http://localhost:3000/api/stripe/webhook`.

---

## 1. Criar (ou acessar) conta Stripe de teste

1. Acesse: https://dashboard.stripe.com/
2. Faça login ou crie uma nova conta.
3. Certifique-se de estar no modo **Test data** (modo de teste) – no topo do dashboard há um toggle para "Viewing test data".

---

## 2. Obter a STRIPE_SECRET_KEY (chave secreta de teste)

1. No dashboard Stripe, vá em **Developers → API keys**.
2. Em **Standard keys**, localize a **Secret key** (geralmente começa com `sk_test_...`).
3. Clique em **Reveal test key** para visualizar.
4. Copie o valor da chave secreta de teste.

No seu `.env`, preencha:

```dotenv
STRIPE_SECRET_KEY=sk_test_exemplo1234567890
```

> Use **sempre** chaves de **teste** em ambiente local.

---

## 3. Configurar o webhook para receber eventos

O projeto espera receber webhooks em:

- `http://localhost:3000/api/stripe/webhook`

Ao usar Docker, o container Stripe CLI se comunica com a máquina host via `host.docker.internal`.

### 3.1. Usando Docker (imagem stripe/stripe-cli)

O `docker-compose.yml` já traz um serviço `stripe` aproximado:

```yaml
stripe:
  image: stripe/stripe-cli:latest
  container_name: stripe-cli
  command: listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
  environment:
    STRIPE_WEBHOOK_SECRET: whsec_...
  depends_on:
    - postgres
```

Para usar **sua própria conta Stripe** e obter um `whsec_...` válido, a forma mais transparente é rodar o Stripe CLI autenticado **fora** do container primeiro, ou logar no container.

#### Opção A – Stripe CLI instalado localmente (recomendado)

1. Certifique-se de ter o Stripe CLI instalado na sua máquina:

   ```bash
   stripe --version
   ```

2. Faça login no Stripe CLI com sua conta:

   ```bash
   stripe login
   ```

   Isso abrirá o navegador para autorizar o CLI na sua conta.

3. Inicie o listener de webhook apontando para o endpoint da aplicação (via `host.docker.internal` para funcionar bem com containers):

   ```bash
   stripe listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

4. O comando irá exibir algo como:

   ```text
   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxx
   ```

5. Copie o valor de `whsec_...` e coloque no `.env`:

   ```dotenv
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
   ```

> Mantenha o comando `stripe listen ...` rodando em um terminal enquanto testa o app.

#### Opção B – Usando o serviço Docker `stripe-cli`

Caso queira usar o container definido no `docker-compose.yml`:

1. Suba os containers (incluindo o serviço `stripe`):

   ```bash
   docker compose up -d stripe
   ```

2. A forma mais simples de garantir que o container está autenticado na sua conta Stripe é **executar o login** dentro dele (apenas uma vez):

   ```bash
   docker exec -it stripe-cli stripe login
   ```

   Siga o fluxo no navegador para autorizar.

3. Depois você pode ajustar o comando de `listen` no `docker-compose.yml` se quiser personalizar, por exemplo:

   ```yaml
   command: listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

4. O segredo `whsec_...` usado pelo container deverá ser copiado para o seu `.env`:

   ```dotenv
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
   ```

> Mesmo usando o container, é comum rodar `stripe listen` manualmente (fora ou dentro do container) para capturar o segredo mais recente.

---

## 4. Atualizar `.env` com as chaves Stripe

No final, o seu `.env` deve ter algo como:

```dotenv
STRIPE_SECRET_KEY=sk_test_exemplo1234567890
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

Salve o arquivo.

Reinicie o servidor de desenvolvimento se ele já estiver rodando (`Ctrl+C` e depois `bun dev`).

---

## 5. Testar webhooks com eventos de teste

Com o comando `stripe listen` ativo (localmente ou via Docker), você pode enviar eventos de teste:

```bash
# Exemplo: enviar um evento checkout.session.completed
time stripe trigger checkout.session.completed
```

O Stripe CLI deve mostrar que o evento foi enviado para `http://host.docker.internal:3000/api/stripe/webhook` e a aplicação deve processar o evento (confira logs do terminal do `bun dev`).

Outros eventos de teste úteis:

```bash
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_succeeded
```

Consulte a documentação da Stripe para a lista completa de triggers disponíveis.

---

## 6. Integração com Docker no fluxo completo do projeto

No fluxo padrão descrito em `docs/local-setup.md`:

1. Você sobe Docker (`postgres`, `starter-studio`, opcionalmente `stripe-cli`).
2. Roda migrations Prisma.
3. Inicia o app com `bun dev`.
4. Roda o Stripe CLI (local ou no container) com:

   ```bash
   stripe listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

5. Copia o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
6. Gera eventos de teste (`stripe trigger ...`) para validar o fluxo.

---

## 7. Referências

- **Stripe – Docs gerais**: https://stripe.com/docs
- **Stripe API keys**: https://stripe.com/docs/keys
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Stripe Webhooks overview**: https://stripe.com/docs/webhooks
- **Trigger test events**: https://stripe.com/docs/stripe-cli#trigger
