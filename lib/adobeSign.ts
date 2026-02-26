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
	signingUrl: string;
	status: string;
};

type StatusResponse = {
	agreementId: string;
	status: string;
	displayDate?: string;
	signedDate?: string;
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
 * - Creates agreement from template
 * - Returns signing URL for user to complete signature
 * 
 * Calls: POST /api/adobe-sign/initiate
 */
export const initiateAdobeSignAgreement = async (
	payload: InitiatePayload
): Promise<InitiateResponse> => {
	try {
		const apiEndpoint = getApiEndpoint();
		const url = `${apiEndpoint}/api/adobe-sign/initiate`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			const errorMsg = (errorBody as { error?: string }).error;
			throw new Error(
				errorMsg || `Failed to initiate Adobe Sign (${response.status})`
			);
		}

		const data = (await response.json()) as InitiateResponse;
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

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			const errorMsg = (errorBody as { error?: string }).error;
			throw new Error(
				errorMsg || `Failed to fetch status (${response.status})`
			);
		}

		const data = (await response.json()) as StatusResponse;
		return data;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Failed to fetch Adobe Sign status:", message);
		throw error;
	}
};
