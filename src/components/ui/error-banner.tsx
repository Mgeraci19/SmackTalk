import { ErrorState } from "@/hooks/useErrorState";

interface ErrorBannerProps {
    error: ErrorState | null;
    onDismiss?: () => void;
}

/**
 * A visible error banner component that replaces browser alerts.
 * LLMs can detect errors by looking for this element.
 */
export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
    if (!error) return null;

    return (
        <div
            id="error-banner"
            role="alert"
            aria-live="assertive"
            data-error-type={error.type}
            data-error-message={error.message}
            data-testid="error-banner"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
            <div className="bg-red-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3
                        id="error-title"
                        className="font-medium text-sm"
                    >
                        {error.type === "join-failed" && "Failed to Join Game"}
                        {error.type === "create-failed" && "Failed to Create Game"}
                        {error.type === "vote-failed" && "Vote Failed"}
                        {error.type === "submit-failed" && "Submission Failed"}
                        {error.type === "action-failed" && "Action Failed"}
                        {!["join-failed", "create-failed", "vote-failed", "submit-failed", "action-failed"].includes(error.type) && "Error"}
                    </h3>
                    <p
                        id="error-message"
                        className="text-sm opacity-90 mt-1"
                    >
                        {error.message}
                    </p>
                </div>
                {onDismiss && (
                    <button
                        id="dismiss-error-button"
                        data-action="dismiss-error"
                        onClick={onDismiss}
                        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                        aria-label="Dismiss error"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
