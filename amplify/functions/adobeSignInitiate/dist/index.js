"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ADOBE_SIGN_BASE_URI = process.env.ADOBE_SIGN_BASE_URI || "https://api.na1.adobesign.com";
const ADOBE_SIGN_ACCESS_TOKEN = process.env.ADOBE_SIGN_ACCESS_TOKEN;
const ADOBE_SIGN_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID;
const ADOBE_SIGN_CLIENT_SECRET = process.env.ADOBE_SIGN_CLIENT_SECRET;
const ADOBE_SIGN_REFRESH_TOKEN = process.env.ADOBE_SIGN_REFRESH_TOKEN;
const ADOBE_SIGN_LIBRARY_DOCUMENT_ID = process.env.ADOBE_SIGN_LIBRARY_DOCUMENT_ID;
const getAdobeSignHeaders = (accessToken) => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
});
const getAccessTokenFromRefreshToken = async () => {
    if (!ADOBE_SIGN_CLIENT_ID || !ADOBE_SIGN_CLIENT_SECRET || !ADOBE_SIGN_REFRESH_TOKEN) {
        throw new Error("Missing OAuth environment variables for Adobe Sign");
    }
    const tokenUrl = `${ADOBE_SIGN_BASE_URI}/oauth/v2/refresh`;
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: ADOBE_SIGN_CLIENT_ID,
        client_secret: ADOBE_SIGN_CLIENT_SECRET,
        refresh_token: ADOBE_SIGN_REFRESH_TOKEN,
    });
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Adobe OAuth refresh failed (${response.status}): ${errorBody}`);
    }
    const tokenResponse = (await response.json());
    if (!tokenResponse.access_token) {
        throw new Error("Adobe OAuth refresh did not return an access_token");
    }
    return tokenResponse.access_token;
};
const getAdobeAccessToken = async () => {
    if (ADOBE_SIGN_ACCESS_TOKEN) {
        return ADOBE_SIGN_ACCESS_TOKEN;
    }
    return getAccessTokenFromRefreshToken();
};
const callAdobeSignAPI = async (accessToken, path, init) => {
    const url = `${ADOBE_SIGN_BASE_URI}/api/rest/v6${path}`;
    const response = await fetch(url, {
        ...init,
        headers: {
            ...getAdobeSignHeaders(accessToken),
            ...(init?.headers || {}),
        },
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Adobe Sign API error (${response.status}): ${errorBody}`);
    }
    return (await response.json());
};
const createAgreement = async (accessToken, quoteId, signerEmail, signerName) => {
    // Step 1: Create agreement from library document
    const createResponse = await callAdobeSignAPI(accessToken, "/agreements", {
        method: "POST",
        body: JSON.stringify({
            name: `Quote ${quoteId} Acceptance`,
            fileInfos: [{ libraryDocumentId: ADOBE_SIGN_LIBRARY_DOCUMENT_ID }],
            participantSetsInfo: [
                {
                    memberInfos: [{ email: signerEmail }],
                    role: "SIGNER",
                    order: 1,
                    name: signerName || signerEmail,
                },
            ],
            signatureType: "ESIGN",
            state: "IN_PROCESS",
        }),
    });
    const agreementId = createResponse.id;
    console.log(`Created agreement: ${agreementId}`);
    return {
        agreementId,
        status: "IN_PROCESS",
    };
};
const handler = async (event) => {
    console.log("adobeSignInitiate handler invoked", {
        body: event.body,
        requestContext: event.requestContext,
    });
    // Validate environment variables
    if (!ADOBE_SIGN_ACCESS_TOKEN &&
        (!ADOBE_SIGN_CLIENT_ID ||
            !ADOBE_SIGN_CLIENT_SECRET ||
            !ADOBE_SIGN_REFRESH_TOKEN) ||
        !ADOBE_SIGN_LIBRARY_DOCUMENT_ID) {
        console.error("Missing required Adobe Sign environment variables");
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Server configuration error",
            }),
        };
    }
    try {
        // Parse and validate request payload
        const payload = JSON.parse(event.body || "{}");
        if (!payload.quoteId || !payload.signerEmail) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing required fields: quoteId, signerEmail",
                }),
            };
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.signerEmail)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid email format" }),
            };
        }
        const accessToken = await getAdobeAccessToken();
        // Create Adobe Sign agreement
        const result = await createAgreement(accessToken, payload.quoteId, payload.signerEmail, payload.signerName);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(result),
        };
    }
    catch (error) {
        console.error("adobeSignInitiate error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Unable to initiate Adobe Sign agreement",
                details: errorMessage,
            }),
        };
    }
};
exports.handler = handler;
