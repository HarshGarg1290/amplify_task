type ApiGatewayEvent = {
	queryStringParameters?: Record<string, string | undefined>;
};

type ApiGatewayResult = {
	statusCode: number;
	headers?: Record<string, string>;
	body: string;
};

/**
 * Lambda function to fetch Adobe Sign agreement status
 * Called by client to poll signing progress
 * 
 * Environment variables required:
 * - ADOBE_SIGN_ACCESS_TOKEN: Adobe access token (temporary fallback mode)
 * - ADOBE_SIGN_CLIENT_ID: Adobe OAuth application ID
 * - ADOBE_SIGN_CLIENT_SECRET: Adobe OAuth client secret
 * - ADOBE_SIGN_REFRESH_TOKEN: Adobe OAuth refresh token
 * - ADOBE_SIGN_BASE_URI: Adobe Sign API base (default: https://api.na1.adobesign.com)
 */

interface AgreementStatusResponse {
	agreementId: string;
	status: string;
	agreementName?: string;
	createdDate?: string;
	senderEmail?: string;
	senderName?: string;
	recipients?: Array<{ email: string; name?: string }>;
	displayDate?: string;
	signedDate?: string;
}

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
		return ADOBE_SIGN_ACCESS_TOKEN;
	}

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
		throw new Error(
			`Adobe Sign API error (${response.status}): ${errorBody}`
		);
	}

	return (await response.json()) as T;
};

export const handler = async (
	event: ApiGatewayEvent
): Promise<ApiGatewayResult> => {
	console.log("adobeSignStatus handler invoked", {
		queryStringParameters: event.queryStringParameters,
	});

	if (
		!ADOBE_SIGN_ACCESS_TOKEN &&
		(!ADOBE_SIGN_CLIENT_ID || !ADOBE_SIGN_CLIENT_SECRET || !ADOBE_SIGN_REFRESH_TOKEN)
	) {
		console.error("Missing OAuth environment variables for Adobe Sign");
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Server configuration error",
			}),
		};
	}

	try {
		// Get agreementId from query parameter
		const agreementId = event.queryStringParameters?.agreementId;

		if (!agreementId) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: "Missing required parameter: agreementId",
				}),
			};
		}

		// Validate agreementId format (basic check)
		if (agreementId.length === 0 || agreementId.length > 128) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: "Invalid agreementId format",
				}),
			};
		}

		const accessToken = await getAdobeAccessToken();

		// Fetch agreement status from Adobe Sign
		const agreement = await callAdobeSignAPI<{
			id: string;
			status: string;
			name?: string;
			createdDate?: string;
			senderEmail?: string;
			senderName?: string;
			creatorEmail?: string;
			participantSetsInfo?: Array<{
				memberInfos?: Array<{ email?: string; name?: string }>;
			}>;
			displayDate?: string;
			signedDate?: string;
		}>(accessToken, `/agreements/${agreementId}`, { method: "GET" });

		const recipients =
			agreement.participantSetsInfo
				?.flatMap((participantSet) =>
					(participantSet.memberInfos || [])
						.filter((member) => Boolean(member.email))
						.map((member) => ({
							email: member.email as string,
							name: member.name,
						}))
				)
				.filter(
					(recipient, index, allRecipients) =>
						allRecipients.findIndex((entry) => entry.email === recipient.email) === index
				) || [];

		const result: AgreementStatusResponse = {
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

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(result),
		};
	} catch (error) {
		console.error("adobeSignStatus error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";

		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Unable to fetch agreement status",
				details: errorMessage,
			}),
		};
	}
};
