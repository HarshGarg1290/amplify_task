/**
 * Adobe Sign Lambda client
 * Direct HTTP calls to AWS Lambda via API Gateway
 * 
 * Workflow: Frontend → API Gateway → Lambda → Adobe Sign API
 */

type InitiatePayload = {
	quoteId: string;
	signerEmail: string;
	signerName?: string;
};

type InitiateResponse = {
	agreementId: string;
	signingUrl?: string;
	status: string;
};

type StatusResponse = {
	agreementId: string;
	status: string;
	agreementName?: string;
	createdDate?: string;
	senderEmail?: string;
	senderName?: string;
	recipients?: Array<{ email: string; name?: string }>;
	displayDate?: string;
	signedDate?: string;
};

const unwrapApiResponse = <T>(payload: unknown): T => {
	if (
		typeof payload === "object" &&
		payload !== null &&
		"body" in payload &&
		typeof (payload as { body?: unknown }).body === "string"
	) {
		return JSON.parse((payload as { body: string }).body) as T;
	}

	return payload as T;
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
	if (
		typeof payload === "object" &&
		payload !== null &&
		"error" in payload &&
		typeof (payload as { error?: unknown }).error === "string"
	) {
		return (payload as { error: string }).error;
	}

	if (
		typeof payload === "object" &&
		payload !== null &&
		"message" in payload &&
		typeof (payload as { message?: unknown }).message === "string"
	) {
		return (payload as { message: string }).message;
	}

	return fallback;
};

const requestJson = async <T>(url: string, init: RequestInit, fallbackMessage: string): Promise<T> => {
	const response = await fetch(url, init);

	if (!response.ok) {
		const rawErrorBody = await response.json().catch(() => ({}));
		const errorBody = unwrapApiResponse<{ error?: string; message?: string }>(
			rawErrorBody
		);
		throw new Error(getErrorMessage(errorBody, `${fallbackMessage} (${response.status})`));
	}

	const rawPayload = (await response.json()) as unknown;
	return unwrapApiResponse<T>(rawPayload);
};

/**
 * Get API Gateway endpoint from environment variable
 * Must be set in .env.local as NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT
 */
const getApiEndpoint = (): string => {
	const endpoint = process.env.NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT;
	if (!endpoint) {
		throw new Error(
			"Adobe Sign API endpoint not configured. Set NEXT_PUBLIC_ADOBE_SIGN_API_ENDPOINT in .env.local"
		);
	}
	return endpoint;
};

/**
 * Initiate an Adobe Sign agreement via Lambda
 * - Creates agreement from template and sends email to signer
 * - Returns agreement id for status tracking
 * 
 * Calls: POST /api/adobe-sign/initiate
 */
export const initiateAdobeSignAgreement = async (
	payload: InitiatePayload
): Promise<InitiateResponse> => {
	try {
		const apiEndpoint = getApiEndpoint();
		const url = `${apiEndpoint}/api/adobe-sign/initiate`;
		console.info("Initiating Adobe Sign agreement", { quoteId: payload.quoteId });

		const data = await requestJson<InitiateResponse>(
			url,
			{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
			},
			"Failed to initiate Adobe Sign"
		);

		return data;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Failed to initiate Adobe Sign agreement:", message);
		throw error;
	}
};

/**
 * Get Adobe Sign agreement status via Lambda
 * - Polls agreement progress
 * - Returns signing status and timestamps
 * 
 * Calls: GET /api/adobe-sign/status?agreementId=...
 */
export const getAdobeSignAgreementStatus = async (
	agreementId: string
): Promise<StatusResponse> => {
	try {
		const apiEndpoint = getApiEndpoint();
		const url = new URL(
			`${apiEndpoint}/api/adobe-sign/status`
		);
		url.searchParams.set("agreementId", agreementId);
		console.info("Fetching Adobe Sign agreement status", { agreementId });

		const data = await requestJson<StatusResponse>(
			url.toString(),
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
			"Failed to fetch status"
		);
		return data;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Failed to fetch Adobe Sign status:", message);
		throw error;
	}
};
