"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import LoginPage from "./login/page";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace("/home");
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
				<LoadingSpinner size="lg" label="Loading session..." />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	return <LoginPage />;
}
