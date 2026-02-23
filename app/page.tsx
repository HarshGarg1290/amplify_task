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
			router.replace("/home");
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return null;
	}

	if (isAuthenticated) {
		return null;
	}

	return <LoginPage />;
}
