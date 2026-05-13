# Google OAuth Setup Guide

This document explains **how to obtain Google credentials** and configure OAuth to work with the local project.

At the end you will have:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

properly filled in your `.env` file.

---

## 1. Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Sign in with the Google account that will be used for development.
3. If it's your first time, accept the terms of service.

---

## 2. Create (or select) a project

1. At the top of the page, click on the project selector (next to the Google Cloud logo).
2. Click **"New project"** or select an existing project specific to this app.
3. Give the project a name, for example: `ignite-starter-dev`.
4. Click **Create** and wait for provisioning.

Make sure the correct project is selected after creation.

---

## 3. Enable Google Identity API (if necessary)

In many cases, the OAuth flow works with just the credentials, but if the console asks:

1. Go to **APIs & Services → Library**.
2. Search for **"Google Identity Services"** or **"Google+ API"** (depending on the current interface).
3. Click **Enable**.

If no alert or error appears, you can skip this step.

---

## 4. Configure OAuth consent screen

1. In the side menu, go to **APIs & Services → OAuth consent screen**.
2. Choose the user type:
   - For development environment, **"External"** is usually sufficient.
3. Fill in the basic fields:
   - **App name**: `Origin Starter (Dev)` or similar.
   - **User support email**: your email.
   - **Authorized domains**: for local environment, it can usually be left empty, but if requested, you can use `localhost`.
   - **Developer contact email**: your email.
4. Save and continue to the end, keeping simple settings.

For test-only environment, you will typically keep the app in **test** mode and add test users.

---

## 5. Create OAuth 2.0 credentials (Client ID / Secret)

1. In the side menu, go to **APIs & Services → Credentials**.
2. Click **+ Create credentials → OAuth client ID**.
3. Under **Application type**, choose **Web application**.
4. Set a descriptive name, for example: `ignite-starter-local`.
5. Under **Authorized JavaScript origins**, add:

   - `http://localhost:3000`

6. Under **Authorized redirect URIs**, add the URL used by your authentication flow.

   Since we're using BetterAuth + Next.js, it will typically be something like:

   - `http://localhost:3000/api/auth/callback/google`

   > If the project uses another specific path, adjust here according to the configured callback route.

7. Click **Create**.

Google will display a window with:

- **Client ID**
- **Client Secret**

Keep this screen open or download the credentials JSON.

---

## 6. Map values to `.env`

In your project, edit the `.env` file and fill in:

```dotenv
GOOGLE_CLIENT_ID=<paste Client ID here>
GOOGLE_CLIENT_SECRET=<paste Client Secret here>
```

For example:

```dotenv
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-EXAMPLE_SECRET
```

Save the `.env` file.

> Whenever you change `.env`, it's good practice to **restart the development server** (`bun dev`) to ensure variables are reloaded.

---

## 7. Test Google login locally

1. Make sure that:
   - Docker is running (database active).
   - Drizzle migrations have been applied.
   - `.env` contains valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. Run the development server:

   ```bash
   bun dev
   ```

3. Access `http://localhost:3000`.
4. Start the Google login flow (button "Sign in with Google" or similar).
5. If Google displays the consent screen, review and accept.

If everything is correct, you should be redirected back to the app logged in with your account.

---

## 8. References

- **Google OAuth 2.0 – Overview**: https://developers.google.com/identity/protocols/oauth2
- **Configure OAuth consent screen**: https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred
- **Google Cloud Console**: https://console.cloud.google.com/
