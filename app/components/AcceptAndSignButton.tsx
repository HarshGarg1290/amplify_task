"use client";

import { useState } from "react";
import { TiTick } from "react-icons/ti";
import { useAuth } from "@/lib/authContext";
import { initiateAdobeSignAgreement } from "@/lib/adobeSign";

type Props = {
	quoteId: string;
	className?: string;
};

export default function AcceptAndSignButton({ quoteId, className }: Props) {
	const { user } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClick = async () => {
		// Verify user is authenticated with valid email
		if (!user?.email) {
			setError(
				"You must be signed in with a valid email to sign this quote."
			);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// Call Lambda function via API Gateway
			const result = await initiateAdobeSignAgreement({
				quoteId,
				signerEmail: user.email,
				signerName: user.name ?? user.username ?? user.email,
			});

			// Redirect user to Adobe Sign signing URL
			if (result.signingUrl) {
				window.location.assign(result.signingUrl);
			} else {
				throw new Error("No signing URL returned from Adobe Sign");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Unable to start Adobe Sign flow";
			setError(errorMessage);
			setIsSubmitting(false);
			console.error("Accept & Sign error:", err);
		}
	};

	return (
		<div className="flex flex-col items-start gap-2">
			<button
				type="button"
				onClick={handleClick}
				disabled={isSubmitting}
				className={className}
			>
				<TiTick />
				{isSubmitting
					? "Preparing Adobe Sign..."
					: "Accept & Sign Quote"}
			</button>
			{error && (
				<p className="text-xs text-red-200 max-w-xs">{error}</p>
			)}
		</div>
	);
}
