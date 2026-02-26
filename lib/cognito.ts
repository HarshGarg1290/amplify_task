import {
	CognitoUserPool,
	CognitoUserSession,
} from "amazon-cognito-identity-js";

const PKCE_VERIFIER_STORAGE_KEY = "cognito_pkce_verifier";

const poolData = {
	UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
	ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
};

export const userPool = new CognitoUserPool(poolData);

export interface AuthUser {
	username: string;
	email: string;
	name?: string;
	idToken: string;
	accessToken: string;
	refreshToken: string;
}

export const signOut = (): void => {
	localStorage.removeItem("idToken");
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");

	const cognitoUser = userPool.getCurrentUser();
	if (cognitoUser) {
		cognitoUser.signOut();
	}
};

export const getCurrentUser = (): Promise<AuthUser | null> => {
	return new Promise((resolve) => {
		const idToken = localStorage.getItem("idToken");
		const accessToken = localStorage.getItem("accessToken");
		const refreshToken = localStorage.getItem("refreshToken");

		if (idToken && accessToken) {
			try {
				const parts = idToken.split(".");
				const decoded = JSON.parse(atob(parts[1]));

				const currentTime = Math.floor(Date.now() / 1000);
				if (decoded.exp && decoded.exp > currentTime) {
					const displayName =
						decoded.name ||
						decoded.given_name ||
						decoded.preferred_username ||
						(decoded.email ? decoded.email.split("@")[0] : undefined);

					resolve({
						username: decoded.preferred_username || decoded.sub,
						email: decoded.email || "",
						name: displayName,
						idToken,
						accessToken,
						refreshToken: refreshToken || "",
					});
					return;
				}
			} catch (error) {
				localStorage.removeItem("idToken");
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
			}
		}

		const cognitoUser = userPool.getCurrentUser();
		if (!cognitoUser) {
			resolve(null);
			return;
		}

		cognitoUser.getSession(
			(err: Error | undefined, session: CognitoUserSession | null) => {
				if (err || !session?.isValid()) {
					resolve(null);
					return;
				}

				const idToken = session.getIdToken().getJwtToken();
				const accessToken = session.getAccessToken().getJwtToken();
				const refreshToken = session.getRefreshToken().getToken();
				const payload = session.getIdToken().payload;

				resolve({
					username: cognitoUser.getUsername(),
					email: payload.email || "",
					name:
						payload.name || payload.given_name || payload.preferred_username,
					idToken,
					accessToken,
					refreshToken,
				});
			},
		);
	});
};

export const getHostedUILoginUrl = async (): Promise<string> => {
	const generateRandomString = (length: number): string => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
		const randomValues = new Uint8Array(length);
		crypto.getRandomValues(randomValues);
		let result = "";
		for (let index = 0; index < length; index += 1) {
			result += chars[randomValues[index] % chars.length];
		}
		return result;
	};

	const base64UrlEncode = (arrayBuffer: ArrayBuffer): string => {
		const bytes = new Uint8Array(arrayBuffer);
		let binary = "";
		for (let index = 0; index < bytes.length; index += 1) {
			binary += String.fromCharCode(bytes[index]);
		}
		return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
	};

	const generateCodeChallenge = async (verifier: string): Promise<string> => {
		const data = new TextEncoder().encode(verifier);
		const digest = await crypto.subtle.digest("SHA-256", data);
		return base64UrlEncode(digest);
	};

	const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
	const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
	const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
	const scopes =
		(process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid profile email").replace(/"/g, "");
	const identityProvider =
		process.env.NEXT_PUBLIC_IDENTITY_PROVIDER || "AzureAD";

	const verifier = generateRandomString(96);
	sessionStorage.setItem(PKCE_VERIFIER_STORAGE_KEY, verifier);

	const challenge = await generateCodeChallenge(verifier);

	const params = new URLSearchParams({
		client_id: clientId || "",
		response_type: "code",
		scope: scopes,
		redirect_uri: redirectUri || "",
		identity_provider: identityProvider,
		code_challenge_method: "S256",
		code_challenge: challenge,
	});

	return `https://${domain}.auth.${process.env.NEXT_PUBLIC_COGNITO_REGION}.amazoncognito.com/oauth2/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string): Promise<AuthUser> => {
	const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
	const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
	const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
	const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_STORAGE_KEY) || "";

	const response = await fetch(
		`https://${domain}.auth.${process.env.NEXT_PUBLIC_COGNITO_REGION}.amazoncognito.com/oauth2/token`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: clientId || "",
				code: code,
				code_verifier: codeVerifier,
				redirect_uri: redirectUri || "",
			}).toString(),
		},
	);

	const data = await response.json();

	if (!response.ok) {
		const errorText =
			(data.error_description as string | undefined) ||
			(data.error as string | undefined) ||
			"Failed to exchange code for token";
		throw new Error(errorText);
	}

	sessionStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);

	const parts = data.id_token.split(".");
	const decoded = JSON.parse(atob(parts[1]));

	const displayName =
		decoded.name ||
		decoded.given_name ||
		decoded.preferred_username ||
		(decoded.email ? decoded.email.split("@")[0] : undefined);

	return {
		username: decoded.preferred_username || decoded.sub,
		email: decoded.email || "",
		name: displayName,
		idToken: data.id_token,
		accessToken: data.access_token,
		refreshToken: data.refresh_token || "",
	};
};
