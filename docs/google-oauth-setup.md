# Google OAuth – passo a passo

Este documento explica **como obter as chaves do Google** e configurar o OAuth para funcionar com o projeto local.

Ao final você terá:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

preenchidos corretamente no seu `.env`.

---

## 1. Acessar o Google Cloud Console

1. Vá para: https://console.cloud.google.com/
2. Faça login com a conta Google que será usada para desenvolvimento.
3. Se for a primeira vez, aceite os termos de uso.

---

## 2. Criar (ou selecionar) um projeto

1. No topo da página, clique no seletor de projeto (próximo ao logo do Google Cloud).
2. Clique em **"Novo projeto"** ou selecione um projeto existente específico para este app.
3. Dê um nome ao projeto, por exemplo: `origin-starter-dev`.
4. Clique em **Criar** e aguarde o provisionamento.

Certifique-se de que o projeto correto está selecionado após a criação.

---

## 3. Ativar a API de Google Identity (se necessário)

Em muitos casos, o fluxo de OAuth já funciona apenas com as credenciais, mas, se o console pedir:

1. Vá em **APIs e serviços → Biblioteca**.
2. Busque por **"Google Identity Services"** ou **"Google+ API"** (dependendo da interface atual).
3. Clique em **Ativar**.

Se não aparecer nenhum alerta ou erro, você pode pular esta etapa.

---

## 4. Configurar a tela de consentimento OAuth

1. No menu lateral, vá em **APIs e serviços → Tela de consentimento OAuth**.
2. Escolha o tipo de usuário:
   - Para ambiente de desenvolvimento, normalmente **"Externo"** é suficiente.
3. Preencha os campos básicos:
   - **Nome do app**: `Origin Starter (Dev)` ou semelhante.
   - **E-mail de suporte do usuário**: seu e-mail.
   - **Domínios autorizados**: para ambiente local, normalmente pode ficar vazio, mas, se for solicitado, você pode usar `localhost`.
   - **E-mail de contato do desenvolvedor**: seu e-mail.
4. Salve e continue até o fim, mantendo configurações simples.

Para ambiente apenas de teste, normalmente você manterá o app em modo de **teste** e adicionará usuários de teste.

---

## 5. Criar credenciais OAuth 2.0 (Client ID / Secret)

1. No menu lateral, vá em **APIs e serviços → Credenciais**.
2. Clique em **+ Criar credenciais → ID do cliente OAuth**.
3. Em **Tipo de aplicativo**, escolha **Aplicativo da Web**.
4. Defina um nome descritivo, por exemplo: `origin-starter-local`.
5. Em **Origens JavaScript autorizadas**, adicione:

   - `http://localhost:3000`

6. Em **URIs de redirecionamento autorizados**, adicione a URL usada pelo seu fluxo de autenticação.

   Como estamos usando BetterAuth + Next.js, normalmente será algo como:

   - `http://localhost:3000/api/auth/callback/google`

   > Se o projeto usar outro caminho específico, ajuste aqui de acordo com a rota de callback configurada.

7. Clique em **Criar**.

O Google exibirá uma janela com:

- **ID do cliente** (Client ID)
- **Segredo do cliente** (Client Secret)

Guarde essa tela aberta ou baixe o JSON das credenciais.

---

## 6. Mapear valores para o `.env`

No seu projeto, edite o arquivo `.env` e preencha:

```dotenv
GOOGLE_CLIENT_ID=<colar aqui o Client ID>
GOOGLE_CLIENT_SECRET=<colar aqui o Client Secret>
```

Por exemplo:

```dotenv
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-EXEMPLO_SECRETO
```

Salve o arquivo `.env`.

> Sempre que você alterar o `.env`, é uma boa prática **reiniciar o server de desenvolvimento** (`bun dev`) para garantir que as variáveis sejam recarregadas.

---

## 7. Testar login com Google localmente

1. Certifique-se de que:
   - Docker está rodando (banco de dados ativo).
   - Migrations do Prisma já foram aplicadas.
   - `.env` contém `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` válidos.
2. Rode o servidor de desenvolvimento:

   ```bash
   bun dev
   ```

3. Acesse `http://localhost:3000`.
4. Inicie o fluxo de login com Google (botão "Login com Google" ou similar).
5. Se o Google exibir a tela de consentimento, revise e aceite.

Se tudo estiver correto, você deverá ser redirecionado de volta para o app logado com sua conta.

---

## 8. Referências

- **Google OAuth 2.0 – Overview**: https://developers.google.com/identity/protocols/oauth2
- **Configurar tela de consentimento OAuth**: https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred
- **Google Cloud Console**: https://console.cloud.google.com/
