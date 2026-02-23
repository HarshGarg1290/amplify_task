"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, getCurrentUser, signOut as cognitoSignOut } from "./cognito";

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signOut: () => void;
	setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserFromStorage = (): AuthUser | null => {
	if (typeof window === "undefined") return null;

	const idToken = localStorage.getItem("idToken");
	const accessToken = localStorage.getItem("accessToken");
	const refreshToken = localStorage.getItem("refreshToken");

	if (!idToken || !accessToken) return null;

	try {
		const parts = idToken.split(".");
		const decoded = JSON.parse(atob(parts[1]));
		const currentTime = Math.floor(Date.now() / 1000);

		if (!decoded.exp || decoded.exp <= currentTime) {
			return null;
		}

		const displayName =
			decoded.name ||
			decoded.given_name ||
			decoded.preferred_username ||
			(decoded.email ? decoded.email.split("@")[0] : undefined);

		return {
			username: decoded.preferred_username || decoded.sub,
			email: decoded.email || "",
			name: displayName,
			idToken,
			accessToken,
			refreshToken: refreshToken || "",
		};
	} catch {
		return null;
	}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(() => getUserFromStorage());
	const [isLoading, setIsLoading] = useState(() => getUserFromStorage() === null);

	useEffect(() => {
		if (user) {
			setIsLoading(false);
			return;
		}

		const checkAuth = async () => {
			try {
				const currentUser = await getCurrentUser();
				setUser(currentUser);
			} catch (error) {
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [user]);

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
