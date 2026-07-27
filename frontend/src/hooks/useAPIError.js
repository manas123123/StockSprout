import { useState } from 'react';

export function useAPIError() {
    const [error, setError] = useState(null);

    const handleError = (err) => {
        console.error('API Error:', err);

        setError({
            message: err.response?.data?.message || err.message || 'An unexpected error occurred',
            status: err.response?.status || null,
            statusText: err.response?.statusText || null,
            originalError: err,
        });
    };

    const clearError = () => setError(null);

    return {
        error,
        setError,
        handleError,
        clearError,
    };
}
