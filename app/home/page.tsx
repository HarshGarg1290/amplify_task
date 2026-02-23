"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faPlus } from "@fortawesome/free-solid-svg-icons";
import Navigation from "../components/Navigation";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { useAuth } from "@/lib/authContext";

function HomePageContent() {
	const [searchQuery, setSearchQuery] = useState("");
	const { user } = useAuth();

	const submitSearch = () => {
		if (!searchQuery.trim()) return;
	};

	const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		submitSearch();
	};

	const actionItems = [
		{ label: "View all in-progress deals" },
		{ label: "Work on a deal for..." },
		{ label: "Create a new deal" },
	];

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col">
			<Navigation activePage="home" />
			<div className="flex-1 flex flex-col items-center justify-center px-4">
				<div className="mb-8 text-center">
					<h2 className="text-white text-xl font-light">
						Welcome,{" "}
						<span className="font-semibold">
							{user?.name || user?.username}
						</span>
					</h2>
				</div>
				<form
					onSubmit={handleSearch}
					className="w-full  justify-start items-start  max-w-xl mb-8"
				>
					<div className="flex items-end justify-start w-full bg-blue-300 rounded-xl p-3 gap-3">
						<textarea
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									submitSearch();
								}
							}}
							placeholder="Ask anything"
							rows={3}
							className="flex-1 rounded-xl bg-white/95 text-gray-800 placeholder-gray-400 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white shadow-lg transition-all duration-200"
						/>
						<button
							type="button"
							className="w-9 h-9 rounded-full bg-blue-600/50 flex items-center justify-center hover:bg-blue-900/70 transition-colors shrink-0"
						>
							<FontAwesomeIcon icon={faMicrophone} />
						</button>
					</div>
				</form>

				<div className="w-full max-w-xl space-y-3">
					{actionItems.map((item, index) => (
						<button
							key={index}
							className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors group"
						>
							<FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
							<span className="text-sm font-light">{item.label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	return (
		<ProtectedRoute>
			<HomePageContent />
		</ProtectedRoute>
	);
}
