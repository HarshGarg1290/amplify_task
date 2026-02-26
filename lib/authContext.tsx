"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
	AuthUser,
	getCurrentUser,
	getUserFromStoredTokens,
	signOut as cognitoSignOut,
} from "./cognito";

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signOut: () => void;
	setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const storedUser = getUserFromStoredTokens();
				if (storedUser) {
					setUser(storedUser);
					return;
				}

				const currentUser = await getCurrentUser();
				setUser(currentUser);
			} catch {
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		void checkAuth();
	}, []);

	useEffect(() => {
		if (isLoading) return;

		const validateSession = () => {
			const storedUser = getUserFromStoredTokens();
			if (!storedUser && user) {
				console.info("Session expired. Signing out user.");
				cognitoSignOut();
				setUser(null);
			}
		};

		const handleVisibility = () => {
			if (!document.hidden) {
				validateSession();
			}
		};

		const interval = window.setInterval(validateSession, 60000);
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [isLoading, user]);

	const handleSignOut = () => {
		cognitoSignOut();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: user !== null,
				signOut: handleSignOut,
				setUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
