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
const TERMINAL_AGREEMENT_TO_RECIPIENT_STATUS = {
    SIGNED: "SIGNED",
    APPROVED: "SIGNED",
    CANCELLED: "CANCELLED",
    ABORTED: "CANCELLED",
    EXPIRED: "EXPIRED",
    REJECTED: "REJECTED",
};
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
const extractEvents = (payload) => {
    return payload.events || payload.eventList || payload.agreementEvents || [];
};
const getStatusPriority = (status) => {
    const normalized = (status || "").toUpperCase();
    if (normalized === "SIGNED" ||
        normalized === "COMPLETED" ||
        normalized === "REJECTED" ||
        normalized === "CANCELLED" ||
        normalized === "EXPIRED") {
        return 100;
    }
    if (normalized === "OUT_FOR_SIGNATURE") {
        return 60;
    }
    if (normalized === "WAITING_FOR_OTHERS") {
        return 40;
    }
    if (normalized === "ACTIVE") {
        return 20;
    }
    if (normalized === "UNKNOWN" || normalized.length === 0) {
        return 0;
    }
    return 30;
};
const getBetterStatus = (currentStatus, incomingStatus) => {
    return getStatusPriority(incomingStatus) >= getStatusPriority(currentStatus)
        ? incomingStatus
        : currentStatus;
};
const getEventTypeToken = (event) => [
    event.type,
    event.eventType,
    event.name,
    event.status,
]
    .filter(Boolean)
    .join("_")
    .toUpperCase();
const getEventEmail = (event) => event.participantEmail ||
    event.actingUserEmail ||
    event.userEmail ||
    event.email;
const getEventName = (event) => event.participantName || event.actingUserName || event.userName;
const mapEventToRecipientStatus = (event) => {
    const token = getEventTypeToken(event);
    if (/ACTION_REQUESTED/.test(token)) {
        return "OUT_FOR_SIGNATURE";
    }
    if (/SIGN|ESIGN|APPROV/.test(token)) {
        return "SIGNED";
    }
    if (/REJECT|DECLIN/.test(token)) {
        return "REJECTED";
    }
    if (/CANCEL|ABORT|VOID/.test(token)) {
        return "CANCELLED";
    }
    if (/EXPIRE/.test(token)) {
        return "EXPIRED";
    }
    return undefined;
};
const buildRecipientsFromEvents = (events) => {
    const recipientMap = new Map();
    for (const event of events) {
        const statusFromEvent = mapEventToRecipientStatus(event);
        const email = getEventEmail(event);
        if (!email || !statusFromEvent) {
            continue;
        }
        const key = email.toLowerCase();
        const existing = recipientMap.get(key);
        recipientMap.set(key, {
            email,
            name: getEventName(event) || existing?.name,
            status: getBetterStatus(existing?.status, statusFromEvent),
            role: (event.participantRole || event.role || existing?.role),
            order: existing?.order,
        });
    }
    return Array.from(recipientMap.values());
};
const getMemberStatus = (member) => member.status || member.signingStatus || member.participantStatus || member.state;
const getParticipantSetStatus = (participantSet) => participantSet.status ||
    participantSet.signingStatus ||
    participantSet.participantStatus ||
    participantSet.state;
const buildRecipientsFromParticipantSets = (participantSets) => {
    return participantSets
        .flatMap((participantSet) => (participantSet.memberInfos ||
        participantSet.participantSetMemberInfos ||
        participantSet.members ||
        [])
        .filter((member) => Boolean(member.email))
        .map((member) => ({
        email: member.email,
        name: member.name,
        status: getMemberStatus(member) ||
            getParticipantSetStatus(participantSet) ||
            "UNKNOWN",
        role: participantSet.role,
        order: participantSet.order,
    })))
        .filter((recipient, index, allRecipients) => {
        const currentEmail = recipient.email.toLowerCase();
        return (allRecipients.findIndex((entry) => entry.email.toLowerCase() === currentEmail) === index);
    });
};
const mergeRecipients = (agreementRecipients, memberRecipients, eventRecipients) => {
    const recipientMap = new Map();
    for (const recipient of agreementRecipients) {
        recipientMap.set(recipient.email.toLowerCase(), { ...recipient });
    }
    for (const sourceRecipients of [memberRecipients, eventRecipients]) {
        for (const recipient of sourceRecipients) {
            const key = recipient.email.toLowerCase();
            const existing = recipientMap.get(key);
            recipientMap.set(key, {
                email: recipient.email,
                name: recipient.name || existing?.name,
                status: getBetterStatus(existing?.status, recipient.status),
                role: recipient.role || existing?.role,
                order: recipient.order ?? existing?.order,
            });
        }
    }
    return Array.from(recipientMap.values());
};
const normalizeRecipientStatuses = (recipients, agreementStatus, nextParticipantSets) => {
    const terminalRecipientStatus = TERMINAL_AGREEMENT_TO_RECIPIENT_STATUS[agreementStatus.toUpperCase()];
    if (terminalRecipientStatus) {
        return recipients.map((recipient) => ({
            ...recipient,
            status: terminalRecipientStatus,
        }));
    }
    const pendingRecipients = buildRecipientsFromParticipantSets(nextParticipantSets);
    if (pendingRecipients.length === 0) {
        return recipients;
    }
    const pendingEmailSet = new Set(pendingRecipients.map((recipient) => recipient.email.toLowerCase()));
    const pendingOrderValues = pendingRecipients
        .map((recipient) => recipient.order)
        .filter((order) => typeof order === "number");
    const currentPendingOrder = pendingOrderValues.length > 0 ? Math.min(...pendingOrderValues) : undefined;
    return recipients.map((recipient) => {
        const emailKey = recipient.email.toLowerCase();
        if (pendingEmailSet.has(emailKey)) {
            return {
                ...recipient,
                status: "OUT_FOR_SIGNATURE",
            };
        }
        if (typeof recipient.order === "number" &&
            typeof currentPendingOrder === "number") {
            if (recipient.order < currentPendingOrder) {
                return {
                    ...recipient,
                    status: "SIGNED",
                };
            }
            if (recipient.order > currentPendingOrder) {
                return {
                    ...recipient,
                    status: "WAITING_FOR_OTHERS",
                };
            }
        }
        return recipient;
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
        const agreementId = event.queryStringParameters?.agreementId;
        const shouldDownload = event.queryStringParameters?.download?.toLowerCase() === "true";
        const debugMode = event.queryStringParameters?.debug?.toLowerCase() === "true";
        if (!agreementId) {
            return jsonResponse(400, {
                error: "Missing required parameter: agreementId",
            });
        }
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
        const agreement = await callAdobeSignAPI(accessToken, `/agreements/${agreementId}`, { method: "GET" });
        const recipients = buildRecipientsFromParticipantSets(agreement.participantSetsInfo || []);
        let recipientsFromEvents = [];
        let agreementEvents = [];
        const debugWarnings = [];
        try {
            const eventsPayload = await callAdobeSignAPI(accessToken, `/agreements/${agreementId}/events`, { method: "GET" });
            agreementEvents = extractEvents(eventsPayload);
            recipientsFromEvents = buildRecipientsFromEvents(agreementEvents);
        }
        catch (eventsError) {
            const eventsMessage = eventsError instanceof Error
                ? eventsError.message
                : "Unknown events error";
            debugWarnings.push(`events: ${eventsMessage}`);
        }
        const result = {
            agreementId: agreement.id,
            status: agreement.status,
            agreementName: agreement.name,
            createdDate: agreement.createdDate,
            senderEmail: agreement.senderEmail || agreement.creatorEmail,
            senderName: agreement.senderName,
            recipients,
            recipientProgressFromEvents: recipientsFromEvents,
            displayDate: agreement.displayDate,
            signedDate: agreement.signedDate,
        };
        if (debugMode) {
            let recipientsFromMembers = [];
            try {
                const agreementMembers = await callAdobeSignAPI(accessToken, `/agreements/${agreementId}/members`, { method: "GET" });
                recipientsFromMembers = buildRecipientsFromParticipantSets(extractParticipantSets(agreementMembers));
            }
            catch (membersError) {
                const membersMessage = membersError instanceof Error
                    ? membersError.message
                    : "Unknown members error";
                debugWarnings.push(`members: ${membersMessage}`);
            }
            const eventTypeSample = agreementEvents.slice(0, 25).map((event) => ({
                type: event.type || event.eventType || event.name || event.status,
                email: getEventEmail(event),
            }));
            return jsonResponse(200, {
                ...result,
                debug: {
                    agreementStatus: agreement.status,
                    recipientsRawFromAgreement: recipients,
                    recipientsFromMembers,
                    recipientsFromEvents,
                    agreementEventsCount: agreementEvents.length,
                    eventTypeSample,
                    warnings: debugWarnings,
                },
            });
        }
        console.info("Adobe agreement status fetched", {
            agreementId,
            status: result.status,
            recipientsCount: result.recipients?.length || 0,
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
