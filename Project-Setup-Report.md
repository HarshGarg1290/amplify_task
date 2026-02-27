# Philips Sensei – Application Setup and Integration Report


---

## 1. Objective

This report documents the complete setup, integration, and execution flow of the Philips Sensei application, with specific focus on Adobe Sign agreement creation, status tracking, and `libraryDocumentId` onboarding.

---

## 2. Technology Stack

- Frontend: Next.js 16, React 19, TypeScript
- Authentication: AWS Cognito Hosted UI (Microsoft identity provider)
- Backend Integration Layer: API Gateway + AWS Lambda
- E-sign platform: Adobe Acrobat Sign REST API v6
- Deployment: AWS Amplify (frontend build pipeline)

---

## 3. Functional Workflow

1. User logs in using Microsoft SSO through Cognito Hosted UI.
2. Authenticated user opens proposal page.
3. User clicks **Send Agreement for Signature**.
4. Frontend sends quote and signer details to `POST /api/adobe-sign/initiate`.
5. Lambda `adobeSignInitiate` creates an Adobe agreement from a library document template.
6. Frontend receives `agreementId` and navigates to status page.
7. Status page polls `GET /api/adobe-sign/status?agreementId=...` every 15 seconds.
8. UI displays latest status, recipient details, sender details, and timestamps.

---

## 4. Setup Procedure

### 4.1 Local dependencies

```bash
npm ci
```

### 4.2 Frontend environment file (`.env.local`)

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

### 4.3 Build and run frontend

```bash
npm run dev
```

### 4.4 Build Lambda TypeScript bundles

```bash
npm run lambda:build
```

---

## 5. Adobe Sign Credentials and Environment Variables

### 5.1 `adobeSignInitiate` Lambda

Required variables:
- `ADOBE_SIGN_BASE_URI`
- `ADOBE_SIGN_LIBRARY_DOCUMENT_ID`
- `ADOBE_SIGN_CLIENT_ID`
- `ADOBE_SIGN_CLIENT_SECRET`
- `ADOBE_SIGN_REFRESH_TOKEN`

Optional fallback:
- `ADOBE_SIGN_ACCESS_TOKEN`

### 5.2 `adobeSignStatus` Lambda

Required variables:
- `ADOBE_SIGN_BASE_URI`
- `ADOBE_SIGN_CLIENT_ID`
- `ADOBE_SIGN_CLIENT_SECRET`
- `ADOBE_SIGN_REFRESH_TOKEN`

Optional fallback:
- `ADOBE_SIGN_ACCESS_TOKEN`

---

## 6. Document ID Fetching and Integration

### 6.1 Purpose

The application creates agreements from a pre-configured Adobe library template. Therefore, `ADOBE_SIGN_LIBRARY_DOCUMENT_ID` is mandatory.

### 6.2 Command to fetch library documents

```powershell
$accessToken = "<ADOBE_ACCESS_TOKEN>"
$baseUri = "https://api.na1.adobesignsandbox.com"

Invoke-RestMethod -Method Get -Uri "$baseUri/api/rest/v6/libraryDocuments?pageSize=100" -Headers @{ Authorization = "Bearer $accessToken" } |
Select-Object -ExpandProperty libraryDocumentList |
Select-Object id,name,status |
Format-Table -AutoSize
```

### 6.3 Integration step

1. Choose the correct template ID (preferably with `ACTIVE` status).
2. Set this ID as:

```text
ADOBE_SIGN_LIBRARY_DOCUMENT_ID=<selected-id>
```

3. Redeploy/update Lambda environment variables.
4. Re-test agreement initiation.

---

## 7. Endpoint Definitions

### 7.1 Initiate agreement

- Method: `POST`
- Route: `/api/adobe-sign/initiate`
- Required fields: `quoteId`, `signerEmail`

### 7.2 Fetch agreement status

- Method: `GET`
- Route: `/api/adobe-sign/status`
- Query param: `agreementId`

---

## 8. Validation Checklist

- [ ] SSO login succeeds
- [ ] Proposal page opens for authenticated user
- [ ] Agreement is created from quote page
- [ ] Status page receives valid `agreementId`
- [ ] Status polling shows current Adobe status
- [ ] Signed/cancelled/expired outcomes displayed correctly

---

## 9. Deployment and Operations Notes

- Amplify build config executes `npm ci` and `npm run build`.
- Adobe sandbox and production require matching `ADOBE_SIGN_BASE_URI`.
- API URL in frontend (`NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT`) must target deployed API Gateway stage.

---

## 10. Risks and Common Failure Points

- Missing Lambda variables -> server configuration error.
- Incorrect Adobe OAuth credentials -> token refresh failure.
- Invalid library document ID -> agreement creation failure.
- Environment mismatch (sandbox vs production) -> API call failures.

---

## 11. Recommendations

1. Keep secrets in AWS Secrets Manager instead of plain environment variables.
2. Add CloudWatch alarms for Lambda 5xx rates and latency.
3. Add structured request correlation IDs for easier tracing.
4. Maintain a controlled process for rotating Adobe OAuth credentials.

---

## 12. Conclusion

The application is production-approachable with clear separation of concerns across UI, auth, integration, and external e-sign workflows. Correct onboarding of `ADOBE_SIGN_LIBRARY_DOCUMENT_ID` and OAuth credentials is the key success factor for stable Adobe Sign operations.

If needed for management circulation, this report can be opened in Microsoft Word and saved as `.docx`.
