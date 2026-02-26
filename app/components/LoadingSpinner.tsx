type LoadingSpinnerProps = {
	size?: "sm" | "md" | "lg";
	className?: string;
	label?: string;
};

const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-10 w-10 border-[3px]",
};

export default function LoadingSpinner({
	size = "md",
	className = "text-white",
	label,
}: LoadingSpinnerProps) {
	return (
		<div className={`inline-flex items-center gap-2 ${className}`} aria-live="polite">
			<span
				className={`inline-block animate-spin rounded-full border-current/30 border-t-current ${sizeClasses[size]}`}
				aria-hidden="true"
			/>
			{label ? <span className="text-sm text-current">{label}</span> : null}
		</div>
	);
}
