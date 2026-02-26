"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { getAdobeSignAgreementStatus } from "@/lib/adobeSign";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

type AgreementStatus = {
	agreementId: string;
	status: string;
	agreementName?: string;
	createdDate?: string;
	senderEmail?: string;
	senderName?: string;
	recipients?: Array<{ email: string; name?: string }>;
	displayDate?: string;
	signedDate?: string;
};

const STATUS_COPY: Record<string, string> = {
	IN_PROCESS: "Sent for signature. User will sign from Adobe email.",
	SIGNED: "Signed successfully.",
	CANCELLED: "Agreement was cancelled.",
	EXPIRED: "Agreement has expired.",
};

const formatDateTime = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
};

function ProposalStatusContent() {
	const searchParams = useSearchParams();
	const agreementId = searchParams.get("agreementId") || "";
	const [statusData, setStatusData] = useState<AgreementStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const previousStatusRef = useRef<string | null>(null);

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
					if (previousStatusRef.current !== status.status) {
						console.info("Agreement status updated", {
							agreementId,
							status: status.status,
						});
						previousStatusRef.current = status.status;
					}
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
	const recipients = statusData?.recipients || [];

	return (
		<ProtectedRoute>
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

						<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div className="rounded-lg border border-gray-200 p-4 bg-blue-50/40">
							<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Agreement Name</p>
							<p className="text-gray-900 font-semibold">
								{statusData?.agreementName || "Quote Acceptance"}
							</p>
						</div>
						<div className="rounded-lg border border-gray-200 p-4 bg-blue-50/40">
							<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Current Status</p>
							<p className="text-blue-700 font-semibold">{statusLabel}</p>
							<p className="text-gray-600 mt-1">{statusMessage}</p>
						</div>
						<div className="rounded-lg border border-gray-200 p-4">
							<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Sent For Signature</p>
							<p className="text-gray-900">{formatDateTime(statusData?.createdDate)}</p>
						</div>
						<div className="rounded-lg border border-gray-200 p-4">
							<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Signed At</p>
							<p className="text-gray-900">{formatDateTime(statusData?.signedDate)}</p>
						</div>
						</div>

						<div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm">
						<p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recipients</p>
						{recipients.length > 0 ? (
							<ul className="space-y-1 text-gray-900">
								{recipients.map((recipient) => (
									<li key={recipient.email}>
										{recipient.name ? `${recipient.name} ` : ""}
										&lt;{recipient.email}&gt;
									</li>
								))}
							</ul>
						) : (
							<p className="text-gray-500">Recipient details not available yet.</p>
						)}
						</div>

						<div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm space-y-2">
						<p>
							<span className="font-semibold text-gray-700">Agreement ID:</span>{" "}
							<span className="text-gray-900 break-all">{agreementId || "-"}</span>
						</p>
						<p>
							<span className="font-semibold text-gray-700">Sent By:</span>{" "}
							<span className="text-gray-900">
								{statusData?.senderName
									? `${statusData.senderName} `
									: ""}
								{statusData?.senderEmail ? `<${statusData.senderEmail}>` : "-"}
							</span>
						</p>
						</div>

						{isLoading && (
							<div className="mt-4">
								<LoadingSpinner
									size="sm"
									className="text-blue-700"
									label="Loading status..."
								/>
							</div>
						)}
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
		</ProtectedRoute>
	);
}

export default function ProposalStatusPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
					<LoadingSpinner size="lg" label="Loading status page..." />
				</div>
			}
		>
			<ProposalStatusContent />
		</Suspense>
	);
}
