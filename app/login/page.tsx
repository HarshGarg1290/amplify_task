"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
	const router = useRouter();
	const [step, setStep] = useState<"initial" | "username" | "password">(
		"initial",
	);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleInitialLogin = () => {
		setStep("username");
	};

	const handleUsernameNext = (e: React.FormEvent) => {
		e.preventDefault();
		if (username.trim()) {
			setStep("password");
		}
	};

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Login with:", { username, password });
		router.push("/home");
	};

	const handleBack = () => {
		if (step === "password") {
			setStep("username");
		} else if (step === "username") {
			setStep("initial");
		}
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

				<div className="relative min-h-[180px]">
					<div
						className={`absolute w-full transition-all duration-500 ease-in-out ${
							step === "initial"
								? "translate-x-0 opacity-100"
								: "-translate-x-full opacity-0 pointer-events-none"
						}`}
					>
						<button
							onClick={handleInitialLogin}
							className="w-full bg-white text-gray-800 py-3 px-6 rounded-full font-medium shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-blue-800"
						>
							Log in
						</button>
					</div>

					<div
						className={`absolute w-full transition-all duration-500 ease-in-out ${
							step === "username"
								? "translate-x-0 opacity-100"
								: step === "initial"
									? "translate-x-full opacity-0 pointer-events-none"
									: "-translate-x-full opacity-0 pointer-events-none"
						}`}
					>
						<form onSubmit={handleUsernameNext} className="space-y-4">
							<div>
								<label className="block text-white text-sm font-medium mb-2">
									Username
								</label>
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="w-full px-4 py-3 rounded-full bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white"
									placeholder="Enter your username"
									autoFocus
									required
								/>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleBack}
									className="px-6 py-3 rounded-full font-medium bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
								>
									Back
								</button>
								<button
									type="submit"
									className="flex-1 bg-white text-gray-800 py-3 px-6 rounded-full font-medium shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-blue-800"
								>
									Next
								</button>
							</div>
						</form>
					</div>

					<div
						className={`absolute w-full transition-all duration-500 ease-in-out ${
							step === "password"
								? "translate-x-0 opacity-100"
								: "translate-x-full opacity-0 pointer-events-none"
						}`}
					>
						<form onSubmit={handlePasswordSubmit} className="space-y-4">
							<div>
								<label className="block text-white text-sm font-medium mb-2">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-4 py-3 rounded-full bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white"
									placeholder="Enter your password"
									autoFocus
									required
								/>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleBack}
									className="px-6 py-3 rounded-full font-medium bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
								>
									Back
								</button>
								<button
									type="submit"
									className="flex-1 bg-white text-gray-800 py-3 px-6 rounded-full font-medium shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-blue-800"
								>
									Log in
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
