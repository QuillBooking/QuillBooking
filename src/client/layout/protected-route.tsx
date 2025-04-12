/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCurrentUser, useNotice, useNavigate } from '@quillbooking/hooks';
import type { PageSettings } from '@quillbooking/navigation';

interface ProtectedRouteProps {
    page: PageSettings;
}

/**
 * Protected route component that checks if user has required permissions
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ page }) => {
    const { hasAnyCapability } = useCurrentUser();
    const { errorNotice } = useNotice();
    const navigate = useNavigate();

    useEffect(() => {
        if (page.capabilities && page.capabilities.length > 0) {
            if (!hasAnyCapability(page.capabilities)) {
                errorNotice(__('You do not have permission to access this page', 'quillbooking'));
                navigate('/');
            }
        }
    }, [page.capabilities]);

    // @ts-ignore
    return <page.component />;
};

export default ProtectedRoute;