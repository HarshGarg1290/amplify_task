import {
	CognitoUserPool,
	CognitoUserSession,
} from "amazon-cognito-identity-js";

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

export const getHostedUILoginUrl = (): string => {
	const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
	const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
	const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
	const identityProvider =
		process.env.NEXT_PUBLIC_IDENTITY_PROVIDER || "AzureAD";

	const params = new URLSearchParams({
		client_id: clientId || "",
		response_type: "code",
		scope: "openid email",
		redirect_uri: redirectUri || "",
		identity_provider: identityProvider,
	});

	return `https://${domain}.auth.${process.env.NEXT_PUBLIC_COGNITO_REGION}.amazoncognito.com/oauth2/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string): Promise<AuthUser> => {
	const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
	const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
	const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

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
				redirect_uri: redirectUri || "",
			}).toString(),
		},
	);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || "Failed to exchange code for token");
	}

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
