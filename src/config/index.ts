
// Add these to your imports
import type { Availability } from '@quillbooking/client';
import type {
    Capabilities,
    ConfigData,
    CurrentUser,
    Integrations,
    Locations,
    MergeTagGroups,
    PaymentGateways,
    ProPluginData,
    License,
} from './types/config-data';

// Update your configData object to include mergeTags
const configData: ConfigData = {
    blogName: '',
    adminUrl: '',
    pluginDirUrl: '',
    adminEmail: '',
    ajaxUrl: '',
    siteUrl: '',
    nonce: '',
    hasCalendars: false,
    hasAvailability: false,
    isWoocommerceActive: false,
    proPluginData: {
        is_installed: false,
        is_active: false,
    },
    license: false,
    timezones: {},
    integrations: {},
    locations: {},
    availabilities: [],
    capabilities: {},
    paymentGateways: {},
    fieldsTypes: {},
    mergeTags: {}, // Initialize empty merge tags
    currentUser: {
        id: 0,
        email: '',
        display_name: '',
        is_admin: false,
        capabilities: {},
    } as CurrentUser,
};


/**
 * Returns configuration value for given key
 *
 * If the requested key isn't defined in the configuration
 * data then this will report the failure with either an
 * error or a console warning.

 * @param {ConfigData} data Configurat data.
 * @returns A function that gets the value of property named by the key
 */
const config =
    (data: ConfigData) =>
        <T>(key: string): T | undefined => {
            if (key in data) {
                return data[key] as T;
            }
            return undefined;
        };

/**
 * Get blog name
 *
 * @param data the json environment configuration to use for getting config values
 * @returns string
 */
const getBlogName = (data: ConfigData) => (): string => {
    return data.blogName;
};

/**
 * Set blog name
 *
 * @param data the json environment configuration to use for getting config values
 */
const setBlogName = (data: ConfigData) => (value: string) => {
    data.blogName = value;
};

/**
 * Get admin url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAdminUrl = (data: ConfigData) => (): string => {
    return data.adminUrl;
};

/**
 * Set admin url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAdminUrl = (data: ConfigData) => (value: string) => {
    data.adminUrl = value;
};

/**
 * Get admin email
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAdminEmail = (data: ConfigData) => (): string => {
    return data.adminEmail;
};

/**
 * Set admin email
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAdminEmail = (data: ConfigData) => (value: string) => {
    data.adminEmail = value;
};

/**
 * Get ajax url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAjaxUrl = (data: ConfigData) => (): string => {
    return data.ajaxUrl;
};

/**
 * Set ajax url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAjaxUrl = (data: ConfigData) => (value: string) => {
    data.ajaxUrl = value;
};

/**
 * Get nonce
 *
 * @param data the json environment configuration to use for getting config values
 */
const getNonce = (data: ConfigData) => (): string => {
    return data.nonce;
};

/**
 * Set nonce
 *
 * @param data the json environment configuration to use for getting config values
 */
const setNonce = (data: ConfigData) => (value: string) => {
    data.nonce = value;
};

/**
 * Get plugin dir url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getPluginDirUrl = (data: ConfigData) => (): string => {
    return data.pluginDirUrl;
};

/**
 * Set plugin dir url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setPluginDirUrl = (data: ConfigData) => (value: string) => {
    data.pluginDirUrl = value;
};

/**
 * Get is woocommerce active
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns boolean
 */
export const isWoocommerceActive = (data: ConfigData): boolean => {
    return data.isWoocommerceActive;
};

/**
 * Set is woocommerce active
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIsWoocommerceActive =
    (data: ConfigData) => (value: boolean) => {
        data.isWoocommerceActive = value;
    };

/**
 * Get site url
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns string
 */
export const getSiteUrl = (data: ConfigData) => (): string => {
    return data.siteUrl;
};

/**
 * Set site url
 *
 * @param data the json environment configuration to use for getting config values
 */
export const setSiteUrl = (data: ConfigData) => (value: string) => {
    data.siteUrl = value;
};

/**
 * Get timezones
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Record<string, string>
 */
export const getTimezones = (data: ConfigData): Record<string, string> => {
    return data.timezones;
};

/**
 * Set timezones
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setTimezones = (data: ConfigData) => (value: Record<string, string>) => {
    data.timezones = value;
};

/**
 * Get integrations
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Integrations
 */
export const getIntegrations = (data: ConfigData): Integrations => {
    return data.integrations;
};

/**
 * Set integrations
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIntegrations = (data: ConfigData) => (value: Integrations) => {
    data.integrations = value;
};

/**
 * Get locations
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Locations
 */
export const getLocations = (data: ConfigData): Locations => {
    return data.locations;
};

/**
 * Set locations
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setLocations = (data: ConfigData) => (value: Locations) => {
    data.locations = value;
};

/**
 * Get availabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Availability[]
 */
export const getAvailabilities = (data: ConfigData): Availability[] => {
    return data.availabilities;
};

/**
 * Set availabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setAvailabilities = (data: ConfigData) => (value: Availability[]) => {
    data.availabilities = value;
};

/**
 * Get capabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Capabilities
 */
export const getCapabilities = (data: ConfigData): Capabilities => {
    return data.capabilities;
};

/**
 * Set capabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setCapabilities = (data: ConfigData) => (value: Capabilities) => {
    data.capabilities = value;
};

/**
 * Get payment gateways
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns PaymentGateways
 */
export const getPaymentGateways = (data: ConfigData): PaymentGateways => {
    return data.paymentGateways;
};

/**
 * Set payment gateways
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setPaymentGateways = (data: ConfigData) => (value: PaymentGateways) => {
    data.paymentGateways = value;
};

/**
 * Get current user
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns CurrentUser
 */
export const getCurrentUser = (data: ConfigData): CurrentUser => {
    return data.currentUser;
};

/**
 * Set current user
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setCurrentUser = (data: ConfigData) => (value: CurrentUser) => {
    data.currentUser = value;
};

/**
 * Get merge tags
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns MergeTagGroups
 */
export const getMergeTags = (data: ConfigData): MergeTagGroups => {
    return data.mergeTags;
};

/**
 * Set merge tags
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setMergeTags = (data: ConfigData) => (value: MergeTagGroups) => {
    data.mergeTags = value;
};


/**
 * Get has calendars
 *
 * @param data the json environment configuration to use for getting config values
 * @returns boolean
 */
export const getHasCalendars = (data: ConfigData) => (): boolean => {
    return data.hasCalendars;
};


/**
 * Set has calendars
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setHasCalendars = (data: ConfigData) => (value: boolean) => {
    data.hasCalendars = value;
};


/**
 * Get has Availability
 *
 * @param data the json environment configuration to use for getting config values
 * @returns boolean
 */
export const getHasAvailability = (data: ConfigData) => (): boolean => {
    return data.hasAvailability;
};


/**
 * Set has Availability
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setHasAvailability = (data: ConfigData) => (value: boolean) => {
    data.hasAvailability = value;
};

// license
/**
 * Set license
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns {License | false} license
 */
const setLicense = (data: ConfigData) => (value: License | false) => {
    data.license = value;
};

/**
 * Get license
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns {License | false} license
 */
const getLicense = (data: ConfigData) => (): License | false => {
    return data.license;
};

/**
 * Set pro plugin data
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns {ProPluginData} proPluginData
 */
const setProPluginData = (data: ConfigData) => (value: ProPluginData) => {
    data.proPluginData = value;
};

/**
 * Get pro plugin data
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns {ProPluginData} proPluginData
 */
const getProPluginData = (data: ConfigData) => (): ProPluginData => {
    return data.proPluginData;
};


// Update your ConfigApi interface to include the new methods
export interface ConfigApi {
    <T>(key: string): T;
    getBlogName: () => string;
    setBlogName: (value: string) => void;
    setAdminUrl: (value: string) => void;
    getAdminUrl: () => string;
    setAdminEmail: (value: string) => void;
    getAdminEmail: () => string;
    setAjaxUrl: (value: string) => void;
    getAjaxUrl: () => string;
    setNonce: (value: string) => void;
    getNonce: () => string;
    setPluginDirUrl: (value: string) => void;
    getPluginDirUrl: () => string;
    isWoocommerceActive: () => boolean;
    setIsWoocommerceActive: (value: boolean) => void;
    getSiteUrl: () => string;
    setSiteUrl: (value: string) => void;
    getTimezones: () => Record<string, string>;
    setTimezones: (value: Record<string, string>) => void;
    getIntegrations: () => Integrations;
    setIntegrations: (value: Integrations) => void;
    getLocations: () => Locations;
    setLocations: (value: Locations) => void;
    getAvailabilities: () => Availability[];
    setAvailabilities: (value: Availability[]) => void;
    getCapabilities: () => Capabilities;
    setCapabilities: (value: Capabilities) => void;
    getPaymentGateways: () => PaymentGateways;
    setPaymentGateways: (value: PaymentGateways) => void;
    getCurrentUser: () => CurrentUser;
    setCurrentUser: (value: CurrentUser) => void;
    getMergeTags: () => MergeTagGroups; // New method
    setMergeTags: (value: MergeTagGroups) => void; // New method
    getHasCalendars: () => boolean; // New method
    setHasCalendars: (value: boolean) => void; // New method
    getHasAvailability: () => boolean; // New method
    setHasAvailability: (value: boolean) => void; // New method
    getLicense: () => License | false; // New method
    setLicense: (value: License | false) => void; // New method
    getProPluginData: () => ProPluginData; // New method
    setProPluginData: (value: ProPluginData) => void; // New method
}

// Update the createConfig function to include the new methods
const createConfig = (data: ConfigData): ConfigApi => {
    const configApi = config(data) as ConfigApi;
    configApi.getBlogName = getBlogName(data);
    configApi.setBlogName = setBlogName(data);
    configApi.getAdminUrl = getAdminUrl(data);
    configApi.setAdminUrl = setAdminUrl(data);
    configApi.getAdminEmail = getAdminEmail(data);
    configApi.setAdminEmail = setAdminEmail(data);
    configApi.getAjaxUrl = getAjaxUrl(data);
    configApi.setAjaxUrl = setAjaxUrl(data);
    configApi.getNonce = getNonce(data);
    configApi.setNonce = setNonce(data);
    configApi.getPluginDirUrl = getPluginDirUrl(data);
    configApi.setPluginDirUrl = setPluginDirUrl(data);
    configApi.isWoocommerceActive = () => isWoocommerceActive(data);
    configApi.setIsWoocommerceActive = setIsWoocommerceActive(data);
    configApi.getSiteUrl = getSiteUrl(data);
    configApi.setSiteUrl = setSiteUrl(data);
    configApi.getTimezones = () => getTimezones(data);
    configApi.setTimezones = setTimezones(data);
    configApi.getIntegrations = () => getIntegrations(data);
    configApi.setIntegrations = setIntegrations(data);
    configApi.getLocations = () => getLocations(data);
    configApi.setLocations = setLocations(data);
    configApi.getAvailabilities = () => getAvailabilities(data);
    configApi.setAvailabilities = setAvailabilities(data);
    configApi.getCapabilities = () => getCapabilities(data);
    configApi.setCapabilities = setCapabilities(data);
    configApi.getPaymentGateways = () => getPaymentGateways(data);
    configApi.setPaymentGateways = setPaymentGateways(data);
    configApi.getCurrentUser = () => getCurrentUser(data);
    configApi.setCurrentUser = setCurrentUser(data);
    configApi.getMergeTags = () => getMergeTags(data); // New method
    configApi.setMergeTags = setMergeTags(data); // New method
    configApi.getHasCalendars = getHasCalendars(data); // New method
    configApi.setHasCalendars = setHasCalendars(data); // New method
    configApi.getHasAvailability = getHasAvailability(data); // New method
    configApi.setHasAvailability = setHasAvailability(data); // New method
    configApi.getLicense = getLicense(data); // New method
    configApi.setLicense = setLicense(data); // New method
    configApi.getProPluginData = getProPluginData(data); // New method
    configApi.setProPluginData = setProPluginData(data); // New method
    return configApi;
};

const ConfigAPI = createConfig(configData);

// @ts-ignore
if (window.quillbooking === undefined) {
    // @ts-ignore
    window.quillbooking = {
        config: ConfigAPI,
    };
}

// @ts-ignore
export default window.quillbooking.config as ConfigApi;
export * from './types/config-data';
