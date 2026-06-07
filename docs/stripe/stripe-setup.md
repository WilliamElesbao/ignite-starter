# Stripe Setup Guide – Test Keys, Webhooks, and Docker

This document explains how to configure **Stripe** for local environment using:

- Stripe account in **Test** mode
- `STRIPE_API_KEY` (test key)
- `STRIPE_WEBHOOK_SECRET` (webhook secret)
- Docker with `stripe/stripe-cli` or locally installed Stripe CLI

At the end you will be able to:

- Process calls to the Stripe API with the test key.
- Receive webhook events at `http://localhost:3000/api/stripe/webhook`.

---

## 1. Create (or access) Stripe test account

1. Access: https://dashboard.stripe.com/
2. Sign in or create a new account.
3. Make sure you're in **Test data** mode (test mode) – at the top of the dashboard there's a toggle for "Viewing test data".

---

## 2. Get STRIPE_API_KEY (test secret key)

1. In the Stripe dashboard, go to **Developers → API keys**.
2. Under **Standard keys**, locate the **Secret key** (usually starts with `sk_test_...`).
3. Click **Reveal test key** to view.
4. Copy the test secret key value.

In your `.env`, fill in:

```dotenv
STRIPE_API_KEY=sk_test_example1234567890
```

> Always use **test** keys in local environment.

---

## 3. Configure webhook to receive events

The project expects to receive webhooks at:

- `http://localhost:3000/api/stripe/webhook`

When using Docker, the Stripe CLI container communicates with the host machine via `host.docker.internal`.

### 3.1. Using Docker (stripe/stripe-cli image)

The `docker-compose.yml` already includes a `stripe` service:

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

To use **your own Stripe account** and get a valid `whsec_...`, the most transparent way is to run the authenticated Stripe CLI **outside** the container first, or log in to the container.

#### Option A – Locally installed Stripe CLI (recommended)

1. Make sure you have Stripe CLI installed on your machine:

   ```bash
   stripe --version
   ```

2. Log in to Stripe CLI with your account:

   ```bash
   stripe login
   ```

   This will open the browser to authorize the CLI with your account.

3. Start the webhook listener pointing to the application endpoint (via `host.docker.internal` to work well with containers):

   ```bash
   stripe listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

4. The command will display something like:

   ```text
   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxx
   ```

5. Copy the `whsec_...` value and put it in `.env`:

   ```dotenv
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
   ```

> Keep the `stripe listen ...` command running in a terminal while testing the app.

#### Option B – Using Docker `stripe-cli` service

If you want to use the container defined in `docker-compose.yml`:

1. Start the containers (including the `stripe` service):

   ```bash
   docker compose up -d stripe
   ```

2. The simplest way to ensure the container is authenticated with your Stripe account is to **run login** inside it (only once):

   ```bash
   docker exec -it stripe-cli stripe login
   ```

   Follow the flow in the browser to authorize.

3. Then you can adjust the `listen` command in `docker-compose.yml` if you want to customize, for example:

   ```yaml
   command: listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

4. The `whsec_...` secret used by the container should be copied to your `.env`:

   ```dotenv
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
   ```

> Even using the container, it's common to run `stripe listen` manually (outside or inside the container) to capture the most recent secret.

---

## 4. Update `.env` with Stripe keys

In the end, your `.env` should have something like:

```dotenv
STRIPE_API_KEY=sk_test_example1234567890
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

Save the file.

Restart the development server if it's already running (`Ctrl+C` then `bun dev`).

---

## 5. Test webhooks with test events

With the `stripe listen` command active (locally or via Docker), you can send test events:

```bash
# Example: send a checkout.session.completed event
stripe trigger checkout.session.completed
```

The Stripe CLI should show that the event was sent to `http://host.docker.internal:3000/api/stripe/webhook` and the application should process the event (check logs in the `bun dev` terminal).

Other useful test events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_succeeded
```

Consult Stripe documentation for the complete list of available triggers.

---

## 6. Integration with Docker in the complete project flow

In the standard flow described in `docs/local-setup/local-setup.md`:

1. You start Docker (`postgres`, `starter-studio`, optionally `stripe-cli`).
2. Run Drizzle migrations.
3. Start the app with `bun dev`.
4. Run Stripe CLI (local or in container) with:

   ```bash
   stripe listen --forward-to http://host.docker.internal:3000/api/stripe/webhook
   ```

5. Copy the `whsec_...` to `STRIPE_WEBHOOK_SECRET`.
6. Generate test events (`stripe trigger ...`) to validate the flow.

---

## 7. References

- **Stripe – General docs**: https://stripe.com/docs
- **Stripe API keys**: https://stripe.com/docs/keys
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Stripe Webhooks overview**: https://stripe.com/docs/webhooks
- **Trigger test events**: https://stripe.com/docs/stripe-cli#trigger
