/**
 *  hook for navigation
 *
 * @since 1.0.0
 */

import { useNavigate, getToLink } from '@quillbooking/navigation';

/**
 * A custom hook for navigation with additional functionalities.
 *
 * @return {Function} navigate function
 */
const useCustomNavigate = () => {
    const navigate = useNavigate();

    /**
     * Navigate to a new route.
     *
     * @param {string} path The target route.
     * @param {Object} [options] Additional options (e.g., state).
     */
    const customNavigate = (path: string, options: Record<string, string | number> = {}) => {
        navigate(getToLink(path, options));
    };

    return customNavigate;
};

export default useCustomNavigate;
