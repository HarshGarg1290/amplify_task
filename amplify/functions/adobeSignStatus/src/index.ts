type ApiGatewayEvent = {
	queryStringParameters?: Record<string, string | undefined>;
};

type ApiGatewayResult = {
	statusCode: number;
	headers?: Record<string, string>;
	body: string;
	isBase64Encoded?: boolean;
};

const corsHeaders = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Expose-Headers": "Content-Disposition,Content-Type",
};

const jsonResponse = (statusCode: number, payload: unknown): ApiGatewayResult => ({
	statusCode,
	headers: corsHeaders,
	body: JSON.stringify(payload),
});

interface AgreementStatusResponse {
	agreementId: string;
	status: string;
	agreementName?: string;
	createdDate?: string;
	senderEmail?: string;
	senderName?: string;
	recipients?: RecipientStatus[];
	recipientProgressFromEvents?: RecipientStatus[];
	displayDate?: string;
	signedDate?: string;
}

type RecipientStatus = {
	email: string;
	name?: string;
	status?: string;
	role?: string;
	order?: number;
};

type AdobeMemberInfo = {
	email?: string;
	name?: string;
	status?: string;
	signingStatus?: string;
	participantStatus?: string;
	state?: string;
};

type AdobeParticipantSetInfo = {
	status?: string;
	signingStatus?: string;
	participantStatus?: string;
	state?: string;
	role?: string;
	order?: number;
	memberInfos?: AdobeMemberInfo[];
	participantSetMemberInfos?: AdobeMemberInfo[];
	members?: AdobeMemberInfo[];
};

type AdobeAgreementMembersResponse = {
	participantSetsInfo?: AdobeParticipantSetInfo[];
	participantSetInfos?: AdobeParticipantSetInfo[];
	participantSets?: AdobeParticipantSetInfo[];
};

type AdobeAgreementEvent = {
	type?: string;
	eventType?: string;
	name?: string;
	status?: string;
	participantEmail?: string;
	actingUserEmail?: string;
	userEmail?: string;
	email?: string;
	participantName?: string;
	actingUserName?: string;
	userName?: string;
	date?: string;
	createdDate?: string;
	eventDate?: string;
	role?: string;
	participantRole?: string;
};

type AdobeAgreementEventsResponse = {
	events?: AdobeAgreementEvent[];
	eventList?: AdobeAgreementEvent[];
	agreementEvents?: AdobeAgreementEvent[];
};

const TERMINAL_AGREEMENT_TO_RECIPIENT_STATUS: Record<string, string> = {
	SIGNED: "SIGNED",
	APPROVED: "SIGNED",
	CANCELLED: "CANCELLED",
	ABORTED: "CANCELLED",
	EXPIRED: "EXPIRED",
	REJECTED: "REJECTED",
};

const ADOBE_SIGN_BASE_URI =
	process.env.ADOBE_SIGN_BASE_URI || "https://api.na1.adobesign.com";
const ADOBE_SIGN_ACCESS_TOKEN = process.env.ADOBE_SIGN_ACCESS_TOKEN;
const ADOBE_SIGN_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID;
const ADOBE_SIGN_CLIENT_SECRET = process.env.ADOBE_SIGN_CLIENT_SECRET;
const ADOBE_SIGN_REFRESH_TOKEN = process.env.ADOBE_SIGN_REFRESH_TOKEN;

const getAdobeSignHeaders = (accessToken: string) => ({
	Authorization: `Bearer ${accessToken}`,
	"Content-Type": "application/json",
});

const getAccessTokenFromRefreshToken = async (): Promise<string> => {
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

	const tokenResponse = (await response.json()) as { access_token?: string };
	if (!tokenResponse.access_token) {
		throw new Error("Adobe OAuth refresh did not return an access_token");
	}

	return tokenResponse.access_token;
};

const getAdobeAccessToken = async (): Promise<string> => {
	if (ADOBE_SIGN_ACCESS_TOKEN) {
		console.info("Using static Adobe access token from environment");
		return ADOBE_SIGN_ACCESS_TOKEN;
	}

	console.info("Generating Adobe access token from refresh token");
	return getAccessTokenFromRefreshToken();
};

const callAdobeSignAPI = async <T>(
	accessToken: string,
	path: string,
	init?: RequestInit
): Promise<T> => {
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

	return (await response.json()) as T;
};

const callAdobeSignBinary = async (
	accessToken: string,
	path: string,
	init?: RequestInit
): Promise<{
	buffer: Buffer;
	contentType: string;
	contentDisposition?: string;
}> => {
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

const extractParticipantSets = (
	payload: AdobeAgreementMembersResponse
): AdobeParticipantSetInfo[] => {
	return (
		payload.participantSetsInfo ||
		payload.participantSetInfos ||
		payload.participantSets ||
		[]
	);
};

const extractEvents = (
	payload: AdobeAgreementEventsResponse
): AdobeAgreementEvent[] => {
	return payload.events || payload.eventList || payload.agreementEvents || [];
};

const getStatusPriority = (status: string | undefined): number => {
	const normalized = (status || "").toUpperCase();

	if (
		normalized === "SIGNED" ||
		normalized === "COMPLETED" ||
		normalized === "REJECTED" ||
		normalized === "CANCELLED" ||
		normalized === "EXPIRED"
	) {
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

const getBetterStatus = (
	currentStatus: string | undefined,
	incomingStatus: string | undefined
): string | undefined => {
	return getStatusPriority(incomingStatus) >= getStatusPriority(currentStatus)
		? incomingStatus
		: currentStatus;
};

const getEventTypeToken = (event: AdobeAgreementEvent): string =>
	[
		event.type,
		event.eventType,
		event.name,
		event.status,
	]
		.filter(Boolean)
		.join("_")
		.toUpperCase();

const getEventEmail = (event: AdobeAgreementEvent): string | undefined =>
	event.participantEmail ||
	event.actingUserEmail ||
	event.userEmail ||
	event.email;

const getEventName = (event: AdobeAgreementEvent): string | undefined =>
	event.participantName || event.actingUserName || event.userName;

const mapEventToRecipientStatus = (
	event: AdobeAgreementEvent
): string | undefined => {
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

const buildRecipientsFromEvents = (events: AdobeAgreementEvent[]): RecipientStatus[] => {
	const recipientMap = new Map<string, RecipientStatus>();

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
			role: (event.participantRole || event.role || existing?.role) as
				| string
				| undefined,
			order: existing?.order,
		});
	}

	return Array.from(recipientMap.values());
};

const getMemberStatus = (member: AdobeMemberInfo): string | undefined =>
	member.status || member.signingStatus || member.participantStatus || member.state;

const getParticipantSetStatus = (
	participantSet: AdobeParticipantSetInfo
): string | undefined =>
	participantSet.status ||
	participantSet.signingStatus ||
	participantSet.participantStatus ||
	participantSet.state;

const buildRecipientsFromParticipantSets = (
	participantSets: AdobeParticipantSetInfo[]
): RecipientStatus[] => {
	return participantSets
		.flatMap((participantSet) =>
			(
				participantSet.memberInfos ||
				participantSet.participantSetMemberInfos ||
				participantSet.members ||
				[]
			)
				.filter((member) => Boolean(member.email))
				.map((member) => ({
					email: member.email as string,
					name: member.name,
					status:
						getMemberStatus(member) ||
						getParticipantSetStatus(participantSet) ||
						"UNKNOWN",
					role: participantSet.role,
					order: participantSet.order,
				}))
		)
		.filter((recipient, index, allRecipients) => {
			const currentEmail = recipient.email.toLowerCase();
			return (
				allRecipients.findIndex(
					(entry) => entry.email.toLowerCase() === currentEmail
				) === index
			);
		});
};

const mergeRecipients = (
	agreementRecipients: RecipientStatus[],
	memberRecipients: RecipientStatus[],
	eventRecipients: RecipientStatus[]
): RecipientStatus[] => {
	const recipientMap = new Map<string, RecipientStatus>();

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

const normalizeRecipientStatuses = (
	recipients: RecipientStatus[],
	agreementStatus: string,
	nextParticipantSets: AdobeParticipantSetInfo[]
): RecipientStatus[] => {
	const terminalRecipientStatus =
		TERMINAL_AGREEMENT_TO_RECIPIENT_STATUS[agreementStatus.toUpperCase()];

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

	const pendingEmailSet = new Set(
		pendingRecipients.map((recipient) => recipient.email.toLowerCase())
	);
	const pendingOrderValues = pendingRecipients
		.map((recipient) => recipient.order)
		.filter((order): order is number => typeof order === "number");
	const currentPendingOrder =
		pendingOrderValues.length > 0 ? Math.min(...pendingOrderValues) : undefined;

	return recipients.map((recipient) => {
		const emailKey = recipient.email.toLowerCase();
		if (pendingEmailSet.has(emailKey)) {
			return {
				...recipient,
				status: "OUT_FOR_SIGNATURE",
			};
		}

		if (
			typeof recipient.order === "number" &&
			typeof currentPendingOrder === "number"
		) {
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

export const handler = async (
	event: ApiGatewayEvent
): Promise<ApiGatewayResult> => {
	console.info("adobeSignStatus request received", {
		hasAgreementId: Boolean(event.queryStringParameters?.agreementId),
	});

	if (
		!ADOBE_SIGN_ACCESS_TOKEN &&
		(!ADOBE_SIGN_CLIENT_ID || !ADOBE_SIGN_CLIENT_SECRET || !ADOBE_SIGN_REFRESH_TOKEN)
	) {
		console.error("Missing OAuth environment variables for Adobe Sign");
		return jsonResponse(500, {
			error: "Server configuration error",
		});
	}

	try {
		const agreementId = event.queryStringParameters?.agreementId;
		const shouldDownload =
			event.queryStringParameters?.download?.toLowerCase() === "true";
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
			const binaryDocument = await callAdobeSignBinary(
				accessToken,
				`/agreements/${agreementId}/combinedDocument`,
				{ method: "GET" }
			);

			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Expose-Headers": "Content-Disposition,Content-Type",
					"Content-Type": binaryDocument.contentType,
					"Content-Disposition":
						binaryDocument.contentDisposition ||
						`attachment; filename="agreement-${agreementId}.pdf"`,
				},
				isBase64Encoded: true,
				body: binaryDocument.buffer.toString("base64"),
			};
		}

		const agreement = await callAdobeSignAPI<{
			id: string;
			status: string;
			name?: string;
			createdDate?: string;
			senderEmail?: string;
			senderName?: string;
			creatorEmail?: string;
			participantSetsInfo?: AdobeParticipantSetInfo[];
			nextParticipantSetInfos?: AdobeParticipantSetInfo[];
			nextParticipantSets?: AdobeParticipantSetInfo[];
			displayDate?: string;
			signedDate?: string;
		}>(accessToken, `/agreements/${agreementId}`, { method: "GET" });

		const recipients = buildRecipientsFromParticipantSets(
			agreement.participantSetsInfo || []
		);

		let recipientsFromEvents: RecipientStatus[] = [];
		let agreementEvents: AdobeAgreementEvent[] = [];
		const debugWarnings: string[] = [];

		try {
			const eventsPayload = await callAdobeSignAPI<AdobeAgreementEventsResponse>(
				accessToken,
				`/agreements/${agreementId}/events`,
				{ method: "GET" }
			);

			agreementEvents = extractEvents(eventsPayload);
			recipientsFromEvents = buildRecipientsFromEvents(agreementEvents);
		} catch (eventsError) {
			const eventsMessage =
				eventsError instanceof Error
					? eventsError.message
					: "Unknown events error";
			debugWarnings.push(`events: ${eventsMessage}`);
		}

		const result: AgreementStatusResponse = {
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
			let recipientsFromMembers: RecipientStatus[] = [];

			try {
				const agreementMembers = await callAdobeSignAPI<AdobeAgreementMembersResponse>(
					accessToken,
					`/agreements/${agreementId}/members`,
					{ method: "GET" }
				);

				recipientsFromMembers = buildRecipientsFromParticipantSets(
					extractParticipantSets(agreementMembers)
				);
			} catch (membersError) {
				const membersMessage =
					membersError instanceof Error
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
	} catch (error) {
		console.error("adobeSignStatus error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";

		return jsonResponse(500, {
			error: "Unable to fetch agreement status",
			details: errorMessage,
		});
	}
};
