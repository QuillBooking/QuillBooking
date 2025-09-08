/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

export interface UseTabsOptions {
    /** Default tab to select */
    defaultTab: string;
    /** Valid tab keys - if provided, only these tabs are allowed */
    validTabs?: string[];
    /** URL parameter name for the tab - defaults to 'tab' */
    urlParam?: string;
    /** Whether to update URL when tab changes - defaults to true */
    updateUrl?: boolean;
    /** Validation function called before tab changes */
    onBeforeTabChange?: (newTab: string, currentTab: string) => boolean;
    /** Callback when tab changes */
    onTabChange?: (newTab: string, previousTab: string) => void;
    /** Whether to prevent infinite loops in URL handling - defaults to false */
    preventUrlLoops?: boolean;
}

export interface UseTabsReturn {
    /** Current active tab */
    activeTab: string;
    /** Function to change the active tab */
    setActiveTab: (tab: string) => void;
    /** Function to handle tab change with validation */
    handleTabChange: (tab: string) => void;
}

/**
 * Custom hook for managing tab state with URL synchronization
 * 
 * @param options Configuration options for the tabs hook
 * @returns Object with activeTab state and handlers
 */
export const useTabs = ({
    defaultTab,
    validTabs,
    urlParam = 'tab',
    updateUrl = true,
    onBeforeTabChange,
    onTabChange,
    preventUrlLoops = false,
}: UseTabsOptions): UseTabsReturn => {
    const [activeTab, setActiveTab] = useState<string>(defaultTab);
    const isUpdatingUrl = useRef(false);
    const lastActiveTabRef = useRef<string | null>(null);

    // Initialize tab from URL on mount
    useEffect(() => {
        const handleURLChange = () => {
            // Prevent handling URL changes if we're currently updating the URL
            if (preventUrlLoops && isUpdatingUrl.current) {
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get(urlParam);

            if (tabParam) {
                // Validate tab if validTabs is provided
                if (validTabs && !validTabs.includes(tabParam)) {
                    return;
                }

                // Only update if it's different from current tab to prevent loops
                if (
                    tabParam !== activeTab &&
                    lastActiveTabRef.current !== tabParam
                ) {
                    lastActiveTabRef.current = tabParam;
                    setActiveTab(tabParam);
                }
            } else if (!activeTab || activeTab !== defaultTab) {
                // Set default tab if no URL param and no current tab
                lastActiveTabRef.current = defaultTab;
                setActiveTab(defaultTab);

                // Initialize URL with default tab if updateUrl is enabled
                if (updateUrl && preventUrlLoops) {
                    try {
                        isUpdatingUrl.current = true;
                        const newUrlParams = new URLSearchParams(window.location.search);
                        newUrlParams.set(urlParam, defaultTab);
                        const newUrl = `${window.location.pathname}?${newUrlParams.toString()}`;
                        window.history.pushState({}, '', newUrl);
                    } finally {
                        setTimeout(() => {
                            isUpdatingUrl.current = false;
                        }, 0);
                    }
                }
            }
        };

        // Initial setup
        handleURLChange();

        // Listen for URL changes (back/forward navigation)
        if (updateUrl) {
            window.addEventListener('popstate', handleURLChange);
            // Listen for custom tab change events if needed
            window.addEventListener('quillbooking-tab-changed', handleURLChange);

            return () => {
                window.removeEventListener('popstate', handleURLChange);
                window.removeEventListener('quillbooking-tab-changed', handleURLChange);
            };
        }

        // Return undefined explicitly when updateUrl is false
        return undefined;
    }, [activeTab, defaultTab, validTabs, urlParam, updateUrl, preventUrlLoops]);

    /**
     * Handle tab change with validation and URL update
     */
    const handleTabChange = (newTab: string) => {
        // Validate tab if validTabs is provided
        if (validTabs && !validTabs.includes(newTab)) {
            console.warn(`Invalid tab: ${newTab}. Valid tabs are: ${validTabs.join(', ')}`);
            return;
        }

        // Call validation function if provided
        if (onBeforeTabChange && !onBeforeTabChange(newTab, activeTab)) {
            return;
        }

        const previousTab = activeTab;

        // Update URL if enabled
        if (updateUrl) {
            const urlParams = new URLSearchParams(window.location.search);

            if (newTab === defaultTab) {
                // Remove tab param if switching to default tab
                urlParams.delete(urlParam);
                // Also remove subtab if it exists
                urlParams.delete('subtab');
            } else {
                urlParams.set(urlParam, newTab);
                // Remove subtab when changing main tabs
                urlParams.delete('subtab');
            }

            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl);
        }

        // Update state
        setActiveTab(newTab);

        // Call onChange callback if provided
        if (onTabChange) {
            onTabChange(newTab, previousTab);
        }
    };

    return {
        activeTab,
        setActiveTab,
        handleTabChange,
    };
};

export default useTabs;
