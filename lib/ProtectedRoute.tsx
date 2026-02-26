"use client";

import { useAuth } from "./authContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";

type Props = {
	children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (isLoading) return;

		if (!isAuthenticated) {
			console.info("Redirecting to login due to missing/expired session", {
				path: pathname,
			});
			router.replace("/login");
		}
	}, [isLoading, isAuthenticated, pathname, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
				<LoadingSpinner size="lg" label="Loading session..." />
			</div>
		);
	}

	if (!isAuthenticated) return null;

	return <>{children}</>;
};
