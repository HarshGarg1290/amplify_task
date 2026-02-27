# Philips Sensei – Adobe Sign Integration Report

## 1) Executive Summary

This project implements a complete quote-to-signature workflow:

- Frontend: Next.js 16 (React 19)
- Identity: AWS Cognito Hosted UI (Microsoft SSO)
- E-sign backend: API Gateway + AWS Lambda
- E-sign provider: Adobe Acrobat Sign (REST v6)

Business outcome: Sales users can send an agreement from a quote page and track real-time status from an internal status page.

---

## 2) Solution Architecture

`Next.js UI -> API Gateway -> Lambda (initiate/status) -> Adobe Sign API`

### Runtime Flow

1. User signs in via Cognito Hosted UI.
2. User opens proposal and clicks **Send Agreement for Signature**.
3. Frontend calls `POST /api/adobe-sign/initiate`.
4. `adobeSignInitiate` creates agreement using `ADOBE_SIGN_LIBRARY_DOCUMENT_ID`.
5. Adobe sends email to signer.
6. Frontend routes to `/proposal/status?agreementId=...`.
7. Status page calls `GET /api/adobe-sign/status?agreementId=...` every 15s.

---

## 3) Repository Structure (Key Files)

- `app/components/AcceptAndSignButton.tsx` – starts signing process.
- `app/proposal/status/page.tsx` – status polling UI.
- `lib/adobeSign.ts` – API client for initiate/status endpoints.
- `amplify/functions/adobeSignInitiate/src/index.ts` – creates agreement in Adobe Sign.
- `amplify/functions/adobeSignStatus/src/index.ts` – fetches Adobe agreement status.
- `fetchDocumentID.txt` – sample command to list Adobe library documents.

---

## 4) Prerequisites

- Node.js 20+
- npm 10+
- AWS account with API Gateway + Lambda access
- Adobe Acrobat Sign account with API app credentials
- AWS Cognito User Pool + Hosted UI configured

---

## 5) Frontend Setup

### 5.1 Install dependencies

```bash
npm ci
```

### 5.2 Configure `.env.local`

Create `.env.local` in repo root:

```env
NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>

NEXT_PUBLIC_COGNITO_REGION=<aws-region>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<app-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito-domain-prefix>
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/login
NEXT_PUBLIC_COGNITO_SCOPES=openid profile email
NEXT_PUBLIC_IDENTITY_PROVIDER=AzureAD
```

### 5.3 Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## 6) Lambda Setup

### 6.1 Build Lambda TypeScript

```bash
npm run lambda:build
```

### 6.2 Required environment variables

#### `adobeSignInitiate`

- `ADOBE_SIGN_BASE_URI`
- `ADOBE_SIGN_LIBRARY_DOCUMENT_ID`
- Preferred auth: `ADOBE_SIGN_CLIENT_ID`, `ADOBE_SIGN_CLIENT_SECRET`, `ADOBE_SIGN_REFRESH_TOKEN`
- Temporary fallback: `ADOBE_SIGN_ACCESS_TOKEN`

#### `adobeSignStatus`

- `ADOBE_SIGN_BASE_URI`
- Preferred auth: `ADOBE_SIGN_CLIENT_ID`, `ADOBE_SIGN_CLIENT_SECRET`, `ADOBE_SIGN_REFRESH_TOKEN`
- Temporary fallback: `ADOBE_SIGN_ACCESS_TOKEN`

> Important: Do not expose Adobe secrets in frontend variables. Keep them in Lambda environment or AWS Secrets Manager.

---

## 7) Document ID Fetching and Integration (Critical)

This implementation requires an Adobe **Library Document ID** as template source.

### 7.1 Fetch `libraryDocumentId` from Adobe

Use PowerShell (sandbox example):

```powershell
$accessToken = "<ADOBE_ACCESS_TOKEN>"
$baseUri = "https://api.na1.adobesignsandbox.com"

Invoke-RestMethod -Method Get -Uri "$baseUri/api/rest/v6/libraryDocuments?pageSize=100" -Headers @{ Authorization = "Bearer $accessToken" } |
Select-Object -ExpandProperty libraryDocumentList |
Select-Object id,name,status |
Format-Table -AutoSize
```

Pick the correct template `id` (usually `status = ACTIVE`) and copy it.

### 7.2 Integrate into Lambda

Set copied value in `adobeSignInitiate` Lambda environment:

```text
ADOBE_SIGN_LIBRARY_DOCUMENT_ID=<copied-library-document-id>
```

### 7.3 How it is used in code

`adobeSignInitiate` creates agreements using:

- `fileInfos: [{ libraryDocumentId: ADOBE_SIGN_LIBRARY_DOCUMENT_ID }]`

If this value is missing/invalid, agreement initiation fails.

---

## 8) API Contract

### POST `/api/adobe-sign/initiate`

Request body:

```json
{
	"quoteId": "UTM-2026-0042",
	"signerEmail": "user@company.com",
	"signerName": "User Name"
}
```

Response:

```json
{
	"agreementId": "CBJCHBCAABAA...",
	"status": "IN_PROCESS"
}
```

### GET `/api/adobe-sign/status?agreementId=<id>`

Response (example):

```json
{
	"agreementId": "CBJCHBCAABAA...",
	"status": "SIGNED",
	"agreementName": "Quote UTM-2026-0042 Acceptance",
	"createdDate": "2026-02-27T09:00:00Z",
	"signedDate": "2026-02-27T09:10:00Z"
}
```

---

## 9) End-to-End Validation Checklist

1. Login works through Microsoft SSO.
2. Proposal page loads for authenticated user.
3. **Send Agreement for Signature** creates agreement.
4. Browser redirects to status page with `agreementId` query param.
5. Status updates from `IN_PROCESS` to terminal state (`SIGNED` / `CANCELLED` / `EXPIRED`).

---

## 10) Deployment Notes

- Amplify frontend pipeline (`amplify.yml`) runs:
	- `npm ci`
	- `npm run build`
- Ensure API Gateway URL stage in `NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT` matches deployed routes.
- Ensure Adobe base URI matches tenant (`adobesignsandbox.com` for sandbox, `adobesign.com` for production).

---

## 11) Troubleshooting

- **Server configuration error**: missing Lambda env vars.
- **Adobe OAuth refresh failed**: invalid `client_id/client_secret/refresh_token` or wrong base URI.
- **Unable to initiate Adobe Sign agreement**: invalid `ADOBE_SIGN_LIBRARY_DOCUMENT_ID` or Adobe API permission issue.
- **Missing agreementId in URL**: initiate endpoint did not return valid `agreementId`.

---

## 12) Security and Compliance Notes

- Store OAuth secrets in AWS Secrets Manager where possible.
- Rotate Adobe refresh tokens based on your org policy.
- Keep `NEXT_PUBLIC_*` variables non-secret by design.
- Use least-privilege IAM for Lambda execution roles.

---

## 13) Commands Quick Reference

```bash
npm ci
npm run dev
npm run build
npm run lambda:build
```

---

## 14) Report Hand-off

If your lead needs this in Word format, open this file in Word and save as `.docx`.
You can also share the companion report file: `Project-Setup-Report.md`.
