"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface NavigationProps {
	activePage: "home" | "deals";
}

export default function Navigation({ activePage }: NavigationProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = () => {
		setIsDropdownOpen(false);
		router.push("/login");
	};

	return (
		<nav className=" border-b border-white/10">
			<div className="  px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-14">
					<div className="flex items-center gap-8">
						<div className="flex items-center gap-3">
							<span className="text-white font-bold text-lg whitespace-nowrap">
								PHILIPS
							</span>
							<span className="text-white font-light text-lg tracking-[0.2em] whitespace-nowrap">
								SENSEI
							</span>
						</div>

						<div className="hidden md:flex items-center gap-6">
							<a
								href="/home"
								className={`transition-colors text-sm ${
									activePage === "home"
										? "text-white px-4 py-2 rounded-lg bg-blue-400/40 hover:bg-blue-400/60"
										: "text-white hover:text-blue-200"
								}`}
							>
								Home
							</a>
							<a
								href="/deals"
								className={`transition-colors text-sm ${
									activePage === "deals"
										? "text-white px-4 py-2 rounded-lg bg-blue-400/40 hover:bg-blue-400/60"
										: "text-white hover:text-blue-200"
								}`}
							>
								Deals
							</a>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="relative flex items-center gap-2" ref={dropdownRef}>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className="text-white text-sm hidden sm:block hover:text-blue-200 transition-all duration-300"
							>
								JD
								<span
									className={`ml-1 inline-block transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
								>
									▼
								</span>
							</button>

							{isDropdownOpen && (
								<div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
									<button
										onClick={handleLogout}
										className="w-full px-4 py-2 text-left text-gray-700 hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-sm font-medium"
									>
										Log out
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
