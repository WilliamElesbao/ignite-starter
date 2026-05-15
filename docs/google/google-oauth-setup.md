# Google OAuth setup
This guide configures Google OAuth for BetterAuth in Ignite Starter.

## 1) Create or select a Google Cloud project
1. Open https://console.cloud.google.com/.
2. Create a dedicated project for local/staging usage.
3. Open **APIs & Services**.

## 2) Configure OAuth consent screen
1. Go to **APIs & Services → OAuth consent screen**.
2. Configure app name and support email.
3. Add test users if the app is in testing mode.
4. Save.

## 3) Create OAuth client credentials
1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → OAuth client ID**.
3. Choose **Web application**.
4. Add authorized origins:
   - `http://localhost:3000`
   - `http://localhost:3333`
5. Add authorized redirect URI:
   - `http://localhost:3333/auth/callback/google`
6. Save and copy the generated values.

## 4) Configure backend environment
Update `apps/backend/.env`:
```dotenv
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

Also verify:
```dotenv
WEB_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3333
```

## 5) Start the stack and test
```bash
docker compose up -d
(cd packages/database && bun db:migrate)
bun dev
```

Then:
1. Open `http://localhost:3000`.
2. Trigger Google sign-in.
3. Confirm successful redirect and authenticated session.

## Troubleshooting
- `redirect_uri_mismatch`: confirm callback URL is `http://localhost:3333/auth/callback/google`.
- CORS/session issues: verify `WEB_URL` and `BETTER_AUTH_URL`.
- Missing credentials at runtime: restart the backend after editing `.env`.

## References
- BetterAuth Google auth docs: https://better-auth.com/docs/authentication/google
- Google OAuth docs: https://developers.google.com/identity/protocols/oauth2
