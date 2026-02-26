type ApiGatewayEvent = {
	body: string | null;
	requestContext?: unknown;
};

type ApiGatewayResult = {
	statusCode: number;
	headers?: Record<string, string>;
	body: string;
};

const corsHeaders = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
};

const jsonResponse = (statusCode: number, payload: unknown): ApiGatewayResult => ({
	statusCode,
	headers: corsHeaders,
	body: JSON.stringify(payload),
});

/**
 * Lambda function to initiate an Adobe Sign agreement
 * Triggered by API Gateway from the Next.js client
 * 
 * Environment variables required:
 * - ADOBE_SIGN_ACCESS_TOKEN: Adobe access token (temporary fallback mode)
 * - ADOBE_SIGN_CLIENT_ID: Adobe OAuth application ID
 * - ADOBE_SIGN_CLIENT_SECRET: Adobe OAuth client secret
 * - ADOBE_SIGN_REFRESH_TOKEN: Adobe OAuth refresh token
 * - ADOBE_SIGN_BASE_URI: Adobe Sign API base (default: https://api.na1.adobesign.com)
 * - ADOBE_SIGN_LIBRARY_DOCUMENT_ID: Pre-created template document ID
 */

interface InitiatePayload {
	quoteId: string;
	signerEmail: string;
	signerName?: string;
}

const ADOBE_SIGN_BASE_URI =
	process.env.ADOBE_SIGN_BASE_URI || "https://api.na1.adobesign.com";
const ADOBE_SIGN_ACCESS_TOKEN = process.env.ADOBE_SIGN_ACCESS_TOKEN;
const ADOBE_SIGN_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID;
const ADOBE_SIGN_CLIENT_SECRET = process.env.ADOBE_SIGN_CLIENT_SECRET;
const ADOBE_SIGN_REFRESH_TOKEN = process.env.ADOBE_SIGN_REFRESH_TOKEN;
const ADOBE_SIGN_LIBRARY_DOCUMENT_ID =
	process.env.ADOBE_SIGN_LIBRARY_DOCUMENT_ID;

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
		throw new Error(
			`Adobe Sign API error (${response.status}): ${errorBody}`
		);
	}

	return (await response.json()) as T;
};

const createAgreement = async (
	accessToken: string,
	quoteId: string,
	signerEmail: string,
	signerName?: string
): Promise<{ agreementId: string; status: string }> => {
	// Step 1: Create agreement from library document
	const createResponse = await callAdobeSignAPI<{ id: string }>(
		accessToken,
		"/agreements",
		{
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
		}
	);

	const agreementId = createResponse.id;
	console.info("Adobe agreement created", { agreementId, quoteId });

	return {
		agreementId,
		status: "IN_PROCESS",
	};
};

export const handler = async (
	event: ApiGatewayEvent
): Promise<ApiGatewayResult> => {
	console.info("adobeSignInitiate request received", {
		hasBody: Boolean(event.body),
	});

	// Validate environment variables
	if (
		!ADOBE_SIGN_ACCESS_TOKEN &&
		(!ADOBE_SIGN_CLIENT_ID ||
		!ADOBE_SIGN_CLIENT_SECRET ||
		!ADOBE_SIGN_REFRESH_TOKEN) ||
		!ADOBE_SIGN_LIBRARY_DOCUMENT_ID
	) {
		console.error("Missing required Adobe Sign environment variables");
		return jsonResponse(500, {
			error: "Server configuration error",
		});
	}

	try {
		// Parse and validate request payload
		const payload: InitiatePayload = JSON.parse(event.body || "{}");

		if (!payload.quoteId || !payload.signerEmail) {
			return jsonResponse(400, {
				error: "Missing required fields: quoteId, signerEmail",
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(payload.signerEmail)) {
			return jsonResponse(400, { error: "Invalid email format" });
		}

		console.info("Initiating Adobe agreement", {
			quoteId: payload.quoteId,
			signerDomain: payload.signerEmail.split("@")[1] || "unknown",
		});

		const accessToken = await getAdobeAccessToken();

		// Create Adobe Sign agreement
		const result = await createAgreement(
			accessToken,
			payload.quoteId,
			payload.signerEmail,
			payload.signerName
		);

		return jsonResponse(200, result);
	} catch (error) {
		console.error("adobeSignInitiate error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";

		return jsonResponse(500, {
			error: "Unable to initiate Adobe Sign agreement",
			details: errorMessage,
		});
	}
};
