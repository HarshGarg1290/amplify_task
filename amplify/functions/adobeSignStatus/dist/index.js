"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Content-Disposition,Content-Type",
};
const jsonResponse = (statusCode, payload) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(payload),
});
const ADOBE_SIGN_BASE_URI = process.env.ADOBE_SIGN_BASE_URI || "https://api.na1.adobesign.com";
const ADOBE_SIGN_ACCESS_TOKEN = process.env.ADOBE_SIGN_ACCESS_TOKEN;
const ADOBE_SIGN_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID;
const ADOBE_SIGN_CLIENT_SECRET = process.env.ADOBE_SIGN_CLIENT_SECRET;
const ADOBE_SIGN_REFRESH_TOKEN = process.env.ADOBE_SIGN_REFRESH_TOKEN;
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
        console.info("Using static Adobe access token from environment");
        return ADOBE_SIGN_ACCESS_TOKEN;
    }
    console.info("Generating Adobe access token from refresh token");
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
const callAdobeSignBinary = async (accessToken, path, init) => {
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
    const arrayBuffer = await response.arrayBuffer();
    return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get("content-type") || "application/pdf",
        contentDisposition: response.headers.get("content-disposition") || undefined,
    };
};
const extractParticipantSets = (payload) => {
    return (payload.participantSetsInfo ||
        payload.participantSetInfos ||
        payload.participantSets ||
        []);
};
const buildRecipientsFromParticipantSets = (participantSets) => {
    return participantSets
        .flatMap((participantSet) => (participantSet.memberInfos || participantSet.members || [])
        .filter((member) => Boolean(member.email))
        .map((member) => ({
        email: member.email,
        name: member.name,
        status: member.status || participantSet.status || "UNKNOWN",
        role: participantSet.role,
        order: participantSet.order,
    })))
        .filter((recipient, index, allRecipients) => {
        const currentEmail = recipient.email.toLowerCase();
        return (allRecipients.findIndex((entry) => entry.email.toLowerCase() === currentEmail) === index);
    });
};
const handler = async (event) => {
    console.info("adobeSignStatus request received", {
        hasAgreementId: Boolean(event.queryStringParameters?.agreementId),
    });
    if (!ADOBE_SIGN_ACCESS_TOKEN &&
        (!ADOBE_SIGN_CLIENT_ID || !ADOBE_SIGN_CLIENT_SECRET || !ADOBE_SIGN_REFRESH_TOKEN)) {
        console.error("Missing OAuth environment variables for Adobe Sign");
        return jsonResponse(500, {
            error: "Server configuration error",
        });
    }
    try {
        // Get agreementId from query parameter
        const agreementId = event.queryStringParameters?.agreementId;
        const shouldDownload = event.queryStringParameters?.download?.toLowerCase() === "true";
        if (!agreementId) {
            return jsonResponse(400, {
                error: "Missing required parameter: agreementId",
            });
        }
        // Validate agreementId format (basic check)
        if (agreementId.length === 0 || agreementId.length > 128) {
            return jsonResponse(400, {
                error: "Invalid agreementId format",
            });
        }
        const accessToken = await getAdobeAccessToken();
        if (shouldDownload) {
            const binaryDocument = await callAdobeSignBinary(accessToken, `/agreements/${agreementId}/combinedDocument`, { method: "GET" });
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Expose-Headers": "Content-Disposition,Content-Type",
                    "Content-Type": binaryDocument.contentType,
                    "Content-Disposition": binaryDocument.contentDisposition ||
                        `attachment; filename="agreement-${agreementId}.pdf"`,
                },
                isBase64Encoded: true,
                body: binaryDocument.buffer.toString("base64"),
            };
        }
        // Fetch agreement status from Adobe Sign
        const agreement = await callAdobeSignAPI(accessToken, `/agreements/${agreementId}`, { method: "GET" });
        let recipients = buildRecipientsFromParticipantSets(agreement.participantSetsInfo || []);
        const hasKnownRecipientStatus = recipients.some((recipient) => recipient.status && recipient.status !== "UNKNOWN");
        if (!hasKnownRecipientStatus) {
            const agreementMembers = await callAdobeSignAPI(accessToken, `/agreements/${agreementId}/members`, { method: "GET" });
            const memberRecipients = buildRecipientsFromParticipantSets(extractParticipantSets(agreementMembers));
            if (memberRecipients.length > 0) {
                recipients = memberRecipients;
            }
        }
        const result = {
            agreementId: agreement.id,
            status: agreement.status,
            agreementName: agreement.name,
            createdDate: agreement.createdDate,
            senderEmail: agreement.senderEmail || agreement.creatorEmail,
            senderName: agreement.senderName,
            recipients,
            displayDate: agreement.displayDate,
            signedDate: agreement.signedDate,
        };
        console.info("Adobe agreement status fetched", {
            agreementId,
            status: result.status,
        });
        return jsonResponse(200, result);
    }
    catch (error) {
        console.error("adobeSignStatus error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return jsonResponse(500, {
            error: "Unable to fetch agreement status",
            details: errorMessage,
        });
    }
};
exports.handler = handler;
