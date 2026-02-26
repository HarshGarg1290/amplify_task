This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Adobe Sign Integration via AWS Lambda

Use this flow in this project:

Frontend (Next.js) → API Gateway → Lambda → Adobe Sign API

### 1) Collect Adobe OAuth values

From your team lead / Adobe app:

- Application ID (`client_id`)
- Client Secret (`client_secret`)

From OAuth consent flow (one-time) you must also get:

- Refresh Token (`refresh_token`)

You also need:

- `ADOBE_SIGN_BASE_URI` (for most accounts: `https://api.na1.adobesign.com`)
- `ADOBE_SIGN_LIBRARY_DOCUMENT_ID` (template/document id used for signing)

### 2) Configure Lambda environment variables

You can run in either mode:

- Preferred (production): `client_id + client_secret + refresh_token`
- Temporary fallback: `access_token` only

For `adobeSignInitiate`:

```bash
ADOBE_SIGN_ACCESS_TOKEN=... # optional temporary fallback
ADOBE_SIGN_CLIENT_ID=...
ADOBE_SIGN_CLIENT_SECRET=...
ADOBE_SIGN_REFRESH_TOKEN=...
ADOBE_SIGN_BASE_URI=https://api.na1.adobesign.com
ADOBE_SIGN_LIBRARY_DOCUMENT_ID=...
```

For `adobeSignStatus`:

```bash
ADOBE_SIGN_ACCESS_TOKEN=... # optional temporary fallback
ADOBE_SIGN_CLIENT_ID=...
ADOBE_SIGN_CLIENT_SECRET=...
ADOBE_SIGN_REFRESH_TOKEN=...
ADOBE_SIGN_BASE_URI=https://api.na1.adobesign.com
```

If `ADOBE_SIGN_ACCESS_TOKEN` is provided, Lambda will use it directly.
If it is not provided, Lambda will generate access tokens via refresh-token flow.

### 3) Create API Gateway routes

Map routes to Lambdas:

- `POST /api/adobe-sign/initiate` → `adobeSignInitiate`
- `GET /api/adobe-sign/status` → `adobeSignStatus`

Enable CORS and deploy stage (for example `dev`).

### 4) Configure frontend endpoint

In `.env.local`:

```bash
NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
```

### 5) Runtime flow

1. User clicks Accept & Sign.
2. Frontend calls `POST /api/adobe-sign/initiate`.
3. Lambda exchanges refresh token for a short-lived Adobe access token.
4. Lambda creates Adobe agreement and sends review/sign email to signer.
5. Frontend redirects user to internal status page using `agreementId`.
6. Status page calls `GET /api/adobe-sign/status?agreementId=...` to track status.

### Notes

- Keep `client_secret` and `refresh_token` only in Lambda environment/Secrets Manager.
- Do not store Adobe tokens in frontend code.

## Deploy this app on Amplify Hosting

### 1) Push code to Git

- Commit and push this repository to GitHub/GitLab/Bitbucket.

### 2) Create Amplify app

- AWS Console → Amplify → Create new app → Host web app.
- Connect your Git provider and select this repo and branch.
- Amplify will pick up `amplify.yml` from repo root.

### 3) Add Amplify environment variables

In Amplify app settings → Environment variables, set:

```bash
NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_caRoAWZDd
NEXT_PUBLIC_COGNITO_CLIENT_ID=462rt760703rh9v55ckbc0plfk
NEXT_PUBLIC_COGNITO_DOMAIN=ap-south-1caroawzdd
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://main.d1flytdzrouwef.amplifyapp.com/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=https://main.d1flytdzrouwef.amplifyapp.com/login
NEXT_PUBLIC_COGNITO_SCOPES=openid profile email
NEXT_PUBLIC_IDENTITY_PROVIDER=AzureAD
```

### 4) Deploy

- Trigger build/deploy from Amplify Console.
- Wait for successful build and copy the generated HTTPS domain.

### 5) Update Adobe OAuth redirect URI

- In Adobe app settings, set redirect URI to an HTTPS URL you control.
- Recommended to keep OAuth callback server-side (API Gateway/Lambda callback).
- If your callback is app-side, use:

```text
https://main.d1flytdzrouwef.amplifyapp.com/adobe-sign/callback
```

Redirect URI in Adobe settings must exactly match the URI used in OAuth authorize/token calls.

### 7) Add Lambda functions in AWS (if not created yet)

Use the code already in this repo:

- `amplify/functions/adobeSignInitiate/src/index.ts`
- `amplify/functions/adobeSignStatus/src/index.ts`

Create two Lambda functions in AWS Console:

1. Lambda → Create function → Author from scratch.
2. Function names:
	- `adobeSignInitiate`
	- `adobeSignStatus`
3. Runtime: Node.js 20.x (or 18.x).
4. Paste code from the files above into each function.
5. Add environment variables:
	- For both: `ADOBE_SIGN_CLIENT_ID`, `ADOBE_SIGN_CLIENT_SECRET`, `ADOBE_SIGN_REFRESH_TOKEN`, `ADOBE_SIGN_BASE_URI`
	- For initiate only: `ADOBE_SIGN_LIBRARY_DOCUMENT_ID`

### 7.1) TypeScript Lambda workflow (recommended)

Do not paste raw `.ts` code in Lambda console. Compile TypeScript to JavaScript first.

From project root run:

```bash
npm run lambda:build
```

Compiled files will be generated at:

- `amplify/functions/adobeSignInitiate/dist/index.js`
- `amplify/functions/adobeSignStatus/dist/index.js`

In AWS Lambda:

1. Upload compiled JS (from `dist/index.js`) as your function code.
2. Set handler to:

```text
index.handler
```

3. Runtime: Node.js 20.x.

### 8) Create API Gateway and get `NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT`

1. API Gateway → Create API → HTTP API.
2. Add integrations:
	- `POST /api/adobe-sign/initiate` → Lambda `adobeSignInitiate`
	- `GET /api/adobe-sign/status` → Lambda `adobeSignStatus`
3. Enable CORS for your frontend origin:
	- `https://main.d1flytdzrouwef.amplifyapp.com`
4. Deploy to stage (for example `prod`).
5. Copy **Invoke URL** from API Gateway stage.

Your frontend env var value becomes:

```bash
NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT=<invoke-url>
```

Example:

```bash
NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT=https://abc123.execute-api.ap-south-1.amazonaws.com/prod
```

### 6) Smoke test

- Open your Amplify app URL.
- Go to proposal page and click Accept & Sign Quote.
- Verify redirect to Adobe signing page.
