"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getHostedUILoginUrl } from "@/lib/cognito";

function LoginPageContent() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error")
		? "Authentication failed. Please try again."
		: "";

	const handleMicrosoftSSO = () => {
		const loginUrl = getHostedUILoginUrl();
		window.location.href = loginUrl;
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 p-4">
			<div className="bg-linear-to-br from-blue-400/30 to-blue-600/30 backdrop-blur-sm p-12 md:p-16 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
				<div className="text-center mb-12">
					<h1 className="text-white text-3xl font-extrabold mb-2 whitespace-nowrap">
						PHILIPS
					</h1>
					<h2 className="text-white text-3xl font-light tracking-[0.3em] whitespace-nowrap">
						SENSEI
					</h2>
				</div>

				{error && (
					<div className="mb-6 p-3 bg-red-500/20 border border-red-400 rounded-lg text-red-200 text-sm">
						{error}
					</div>
				)}

				<div className="space-y-4">
					<button
						onClick={handleMicrosoftSSO}
						className="w-full bg-white text-gray-800 py-3 px-6 rounded-full font-medium shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-blue-800 flex items-center justify-center gap-2"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
						</svg>
						Sign in with Microsoft
					</button>

					<p className="text-white/70 text-sm text-center mt-4">
						Sign in with your Microsoft account to continue
					</p>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-blue-600 to-blue-700">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
						<p className="text-white">Loading...</p>
					</div>
				</div>
			}
		>
			<LoginPageContent />
		</Suspense>
	);
}
