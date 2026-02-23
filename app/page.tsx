"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import LoginPage from "./login/page";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.push("/home");
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
					<p className="text-white">Loading...</p>
				</div>
			</div>
		);
	}

	return <LoginPage />;
}
