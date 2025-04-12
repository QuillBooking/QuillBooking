/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import type { CurrentUser } from '@quillbooking/config';

interface UserHook {
    /**
     * Get the current user object
     */
    getCurrentUser: () => CurrentUser;

    /**
     * Check if the current user has a specific capability
     * @param capability - The capability to check for
     */
    hasCapability: (capability: string) => boolean;

    /**
     * Check if the current user is an admin
     */
    isAdmin: () => boolean;

    /**
     * Check if the current user has any of the specified capabilities
     * @param capabilities - Array of capabilities to check
     */
    hasAnyCapability: (capabilities: string[]) => boolean;

    /**
     * Check if the current user has all of the specified capabilities
     * @param capabilities - Array of capabilities to check
     */
    hasAllCapabilities: (capabilities: string[]) => boolean;

    /**
     * Get the user's display name
     */
    getDisplayName: () => string;

    /**
     * Get the user's email
     */
    getEmail: () => string;

    /**
     * Get the user's ID
     */
    getId: () => number;
}

/**
 * Hook for user-related functionality and capability checks
 */
const useCurrentUser = (): UserHook => {
    /**
     * Get the current user object from config
     */
    const getCurrentUser = (): CurrentUser => {
        return ConfigAPI.getCurrentUser();
    };

    /**
     * Check if current user has specific capability
     * 
     * @param capability The capability to check
     * @returns boolean Whether user has the capability
     */
    const hasCapability = (capability: string): boolean => {
        const user = getCurrentUser();
        return !!user.capabilities[capability];
    };

    /**
     * Check if current user is admin
     * 
     * @returns boolean Whether user is admin
     */
    const isAdmin = (): boolean => {
        const user = getCurrentUser();
        return !!user.is_admin;
    };

    /**
     * Check if current user has any of the provided capabilities
     * 
     * @param capabilities Array of capabilities to check
     * @returns boolean Whether user has any of the capabilities
     */
    const hasAnyCapability = (capabilities: string[]): boolean => {
        return capabilities.some(capability => hasCapability(capability));
    };

    /**
     * Check if current user has all of the provided capabilities
     * 
     * @param capabilities Array of capabilities to check
     * @returns boolean Whether user has all capabilities
     */
    const hasAllCapabilities = (capabilities: string[]): boolean => {
        return capabilities.every(capability => hasCapability(capability));
    };

    /**
     * Get user's display name
     * 
     * @returns string User's display name
     */
    const getDisplayName = (): string => {
        return getCurrentUser().display_name;
    };

    /**
     * Get user's email
     * 
     * @returns string User's email
     */
    const getEmail = (): string => {
        return getCurrentUser().email;
    };

    /**
     * Get user's ID
     * 
     * @returns number User's ID
     */
    const getId = (): number => {
        return getCurrentUser().id;
    };

    return {
        getCurrentUser,
        hasCapability,
        isAdmin,
        hasAnyCapability,
        hasAllCapabilities,
        getDisplayName,
        getEmail,
        getId,
    };
};

export default useCurrentUser;