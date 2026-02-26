"use client";

import Navigation from "../components/Navigation";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { SearchForm } from "../components/SearchForm";
import { useAuth } from "@/lib/authContext";

const actionItems = [
	{ label: "View all in-progress deals" },
	{ label: "Work on a deal for..." },
	{ label: "Create a new deal" },
];

function HomePageContent() {
	const { user } = useAuth();

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col">
			<Navigation activePage="home" />
			<div className="flex-1 flex flex-col items-center justify-center px-4">
				<div className="mb-8 text-center">
					<h2 className="text-white text-xl font-light">
						Welcome,{" "}
						<span className="font-semibold">
							{user?.name || user?.email}
						</span>
					</h2>
				</div>
				<SearchForm />

				<div className="w-full max-w-xl space-y-3">
					{actionItems.map((item, index) => (
						<button
							key={index}
							className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors group"
						>
							<span className="w-4 h-4 inline-flex items-center justify-center">+</span>
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
