"use client";
import { FaMicrophone } from "react-icons/fa";
import { useState } from "react";

export const SearchForm = () => {
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;
		console.info("Search submitted", { query: searchQuery.trim() });
	};

	return (
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
							if (!searchQuery.trim()) return;
							console.info("Search submitted", { query: searchQuery.trim() });
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
					<FaMicrophone className="text-white" />
				</button>
			</div>
		</form>
	);
};
