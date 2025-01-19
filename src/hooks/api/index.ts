/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { NAMESPACE } from '@quillbooking/constants';

interface ApiOptions {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, any>;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    isCore?: boolean;
}

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const callApi = async ({ path, method = 'GET', data, onSuccess, onError, isCore = true }: ApiOptions) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch({
                path: isCore ? `${NAMESPACE}/${path}` : path,
                method,
                data,
            });
            onSuccess?.(response);
        } catch (err: any) {
            setError(err.message);
            onError?.(err);
        } finally {
            setLoading(false);
        }
    };

    return { callApi, loading, error };
};

export default useApi;
