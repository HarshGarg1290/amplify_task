import Navigation from "../components/Navigation";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

export default function DealsPage() {
	const dealsData = [
		{
			customer: "University of Texas Medical",
			location: "Galveston, TX",
			primaryContact: "Dr. Ahmed Rohan",
			contactTitle: "Lab Director",
			philipsLead: "Jamie Braith",
			leadUpdated: "Updated 2 days ago",
			status: "Waiting for info",
		},
		{
			customer: "Cleveland Medical Center",
			location: "Cleveland, OH",
			primaryContact: "Dr. Sarah Chen",
			contactTitle: "Chief of Pathology",
			philipsLead: "Stacy McManus",
			leadUpdated: "Updated 2 days ago",
			status: "Ready for proposal",
		},
		{
			customer: "Hospitals of Providence",
			location: "El Paso, TX",
			primaryContact: "John Smith",
			contactTitle: "Director of Pathology",
			philipsLead: "Stacy McManus",
			leadUpdated: "Updated 2 days ago",
			status: "Ready for proposal",
		},
	];

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col">
				<Navigation activePage="deals" />

				<div className="flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8">

				<div className="flex items-center justify-between mb-8">
					<h1 className="text-white text-2xl font-bold">Deals</h1>
					<button className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-full font-medium  transition-colors">
						<span className="w-4 h-4 inline-flex items-center justify-center">+</span>
						<span>Create a new deal</span>
					</button>
				</div>
				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
									Customer
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
									Primary Contact
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
									Phillips Lead
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{dealsData.map((deal, index) => (
								<tr
									key={index}
									className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
								>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-gray-900">
											{deal.customer}
										</div>
										<div className="text-xs text-gray-500">{deal.location}</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-gray-900">
											{deal.primaryContact}
										</div>
										<div className="text-xs text-gray-500">
											{deal.contactTitle}
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-gray-900">
											{deal.philipsLead}
										</div>
										<div className="text-xs text-gray-500">
											{deal.leadUpdated}
										</div>
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
											{deal.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
