/* eslint-disable jsdoc/check-line-alignment */
import type {
    ConfigData,
    Integrations,
    Locations,
    Capabilities,
    PaymentGateways,
    CurrentUser,
} from './types/config-data';
import type { Availability } from '@quillbooking/client';

const configData: ConfigData = {
    blogName: '',
    adminUrl: '',
    pluginDirUrl: '',
    adminEmail: '',
    ajaxUrl: '',
    siteUrl: '',
    nonce: '',
    isWoocommerceActive: false,
    timezones: {},
    integrations: {},
    locations: {},
    availabilities: [],
    capabilities: {},
    paymentGateways: {},
    fieldsTypes: {},
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
}

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
