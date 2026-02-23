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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
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
	}, []);

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
