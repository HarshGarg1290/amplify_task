"use client";

import { useAuth } from "./authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
	children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;

		if (!isAuthenticated) {
			router.replace("/login");
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return null;
	}

	if (!isAuthenticated) return null;

	return <>{children}</>;
};
