import type { LocationsProps, IntegrationType } from './types';
import { INTEGRATION_SLUGS } from './constants';
import { Calendar } from '../../types';

export class IntegrationHelper {
    private connected_integrations: LocationsProps['connected_integrations'];

    constructor(connected_integrations: LocationsProps['connected_integrations']) {
        this.connected_integrations = connected_integrations;
    }


    isCalendarTypeTeam(calendar: Calendar): boolean {
        return calendar.type === 'team';
    }

    isIntegrationConnected(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.connected;
            case 'zoom':
                return this.connected_integrations.zoom.connected;
            case 'ms-teams':
                return this.connected_integrations.outlook.connected;
        }
    }

    isIntegrationGlobalConnected(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_settings;
            case 'zoom':
                return this.connected_integrations.zoom.has_settings;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_settings;
        }
    }

    hasGetStarted(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_get_started;
            case 'zoom':
                return this.connected_integrations.zoom.has_get_started;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_get_started;
        }
    }

    hasProVersion(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_pro_version;
            case 'zoom':
                return this.connected_integrations.zoom.has_pro_version;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_pro_version;
        }
    }

    hasSettings(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_settings;
            case 'zoom':
                return this.connected_integrations.zoom.has_settings;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_settings;
        }
    }

    hasAccounts(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_accounts;
            case 'zoom':
                return this.connected_integrations.zoom.has_accounts;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_accounts;
        }
    }

    isTeamsEnabled(): boolean {
        return this.connected_integrations.outlook.teams_enabled;
    }

    /**
     * Check if team members have the specific integration configured
     * For team calendars, each member needs individual integration setup
     */
    hasTeamMembersIntegrationSetup(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.team_members_setup || false;
            case 'zoom':
                return this.connected_integrations.zoom.team_members_setup || false;
            case 'ms-teams':
                return this.connected_integrations.outlook.team_members_setup || false;
            default:
                return false;
        }
    }

    convertToSlug(type: IntegrationType): string {
        return INTEGRATION_SLUGS[type];
    }
}
