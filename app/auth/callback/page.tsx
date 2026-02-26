"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { exchangeCodeForToken } from "@/lib/cognito";

function AuthCallbackContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { setUser } = useAuth();

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const code = searchParams.get("code");
				const error = searchParams.get("error");
				const errorDescription = searchParams.get("error_description");

				if (error) {
					router.push(
						`/login?error=${encodeURIComponent(error)}${
							errorDescription
								? `&error_description=${encodeURIComponent(errorDescription)}`
								: ""
						}`,
					);
					return;
				}

				if (!code) {
					router.push("/login");
					return;
				}

				const user = await exchangeCodeForToken(code);
				setUser(user);

				localStorage.setItem("idToken", user.idToken);
				localStorage.setItem("accessToken", user.accessToken);
				localStorage.setItem("refreshToken", user.refreshToken);

				router.push("/home");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Token exchange failed";
				router.push(
					`/login?error=auth_failed&error_description=${encodeURIComponent(message)}`,
				);
			}
		};

		handleCallback();
	}, [searchParams, router, setUser]);

	return (
		<div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700">
			<p className="text-white text-lg">Completing sign in...</p>
		</div>
	);
}

export default function AuthCallback() {
	return (
		<Suspense fallback={null}>
			<AuthCallbackContent />
		</Suspense>
	);
}
