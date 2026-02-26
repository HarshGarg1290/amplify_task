"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { getAdobeSignAgreementStatus } from "@/lib/adobeSign";

type AgreementStatus = {
	agreementId: string;
	status: string;
	displayDate?: string;
	signedDate?: string;
};

const STATUS_COPY: Record<string, string> = {
	IN_PROCESS: "Sent for signature. User will sign from Adobe email.",
	SIGNED: "Signed successfully.",
	CANCELLED: "Agreement was cancelled.",
	EXPIRED: "Agreement has expired.",
};

function ProposalStatusContent() {
	const searchParams = useSearchParams();
	const agreementId = searchParams.get("agreementId") || "";
	const [statusData, setStatusData] = useState<AgreementStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!agreementId) {
			setError("Missing agreementId in URL.");
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		const fetchStatus = async () => {
			try {
				const status = await getAdobeSignAgreementStatus(agreementId);
				if (!cancelled) {
					setStatusData(status);
					setError(null);
				}
			} catch (statusError) {
				if (!cancelled) {
					setError(
						statusError instanceof Error
							? statusError.message
							: "Failed to fetch agreement status"
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void fetchStatus();
		const interval = setInterval(() => {
			void fetchStatus();
		}, 15000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [agreementId]);

	const statusLabel = statusData?.status || "UNKNOWN";
	const statusMessage =
		STATUS_COPY[statusLabel] || "Status updated. Please review in Adobe account.";

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700">
			<Navigation activePage="proposal" />
			<div className="max-w-3xl mx-auto px-4 py-8">
				<div className="bg-white rounded-xl shadow-lg p-6">
					<h1 className="text-2xl font-semibold text-blue-900">
						Agreement Status
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						This page auto-refreshes every 15 seconds.
					</p>

					<div className="mt-6 space-y-3 text-sm">
						<p>
							<span className="font-semibold text-gray-700">Agreement ID:</span>{" "}
							<span className="text-gray-900 break-all">
								{agreementId || "-"}
							</span>
						</p>
						<p>
							<span className="font-semibold text-gray-700">Current Status:</span>{" "}
							<span className="text-blue-700 font-semibold">{statusLabel}</span>
						</p>
						<p className="text-gray-600">{statusMessage}</p>
						{statusData?.signedDate && (
							<p>
								<span className="font-semibold text-gray-700">Signed At:</span>{" "}
								<span className="text-gray-900">{statusData.signedDate}</span>
							</p>
						)}
					</div>

					{isLoading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}
					{error && <p className="mt-4 text-sm text-red-600">{error}</p>}

					<div className="mt-6 flex gap-3">
						<Link
							href="/proposal"
							className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 text-sm font-medium"
						>
							Back to Proposal
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ProposalStatusPage() {
	return (
		<Suspense fallback={null}>
			<ProposalStatusContent />
		</Suspense>
	);
}
