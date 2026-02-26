# Philips Sensei - Adobe Sign Flow

## Current Architecture

Frontend (Next.js) -> API Gateway -> AWS Lambda -> Adobe Acrobat Sign API

## Working Business Flow

1. Sales user opens proposal and clicks **Accept & Sign Quote**.
2. Frontend calls initiate Lambda through API Gateway.
3. Adobe agreement email is sent to signer.
4. Frontend redirects to internal status page using `agreementId`.
5. Status page polls status Lambda and shows agreement progress and metadata.

## Session Behavior

- All authenticated pages are protected by route guard.
- Expired or invalid local session automatically signs out and redirects to login.
- No generic fallback identity is shown.

## Required Frontend Environment Variables

- `NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT`
- `NEXT_PUBLIC_COGNITO_REGION`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`
- `NEXT_PUBLIC_COGNITO_LOGOUT_URI`
- `NEXT_PUBLIC_COGNITO_SCOPES`
- `NEXT_PUBLIC_IDENTITY_PROVIDER`

## Required Lambda Environment Variables

### `adobeSignInitiate`
- `ADOBE_SIGN_BASE_URI`
- `ADOBE_SIGN_LIBRARY_DOCUMENT_ID`
- `ADOBE_SIGN_CLIENT_ID` + `ADOBE_SIGN_CLIENT_SECRET` + `ADOBE_SIGN_REFRESH_TOKEN` (preferred)
- or `ADOBE_SIGN_ACCESS_TOKEN` (temporary fallback)

### `adobeSignStatus`
- `ADOBE_SIGN_BASE_URI`
- `ADOBE_SIGN_CLIENT_ID` + `ADOBE_SIGN_CLIENT_SECRET` + `ADOBE_SIGN_REFRESH_TOKEN` (preferred)
- or `ADOBE_SIGN_ACCESS_TOKEN` (temporary fallback)

## API Gateway Routes

- `POST /api/adobe-sign/initiate` -> `adobeSignInitiate`
- `GET /api/adobe-sign/status` -> `adobeSignStatus`

## Notes

- Keep Adobe secrets only in Lambda environment or AWS Secrets Manager.
- Keep frontend variables public-only (`NEXT_PUBLIC_*`).
- Ensure Adobe base URI matches account environment (sandbox vs production).
