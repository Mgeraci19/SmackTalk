import { useState, useCallback } from "react";

export interface ErrorState {
    type: string;
    message: string;
    timestamp: number;
}

/**
 * Hook for managing error states that are visible in the DOM
 * instead of using browser alerts.
 */
export function useErrorState() {
    const [error, setError] = useState<ErrorState | null>(null);

    const showError = useCallback((type: string, message: string) => {
        setError({
            type,
            message,
            timestamp: Date.now()
        });

        // Auto-clear after 5 seconds
        setTimeout(() => {
            setError(prev => {
                // Only clear if it's the same error (not a new one)
                if (prev && prev.timestamp === Date.now()) {
                    return null;
                }
                return prev;
            });
        }, 5000);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { error, showError, clearError };
}
