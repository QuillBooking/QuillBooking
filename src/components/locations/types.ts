import type {
    ConnectedIntegrationsFields,
    ConnectedIntegrationsFieldsMicrosoft,
    Location,
} from '@quillbooking/types';

// Extended Location type to include custom ID for multiple custom locations
export interface ExtendedLocation extends Location {
    id?: string;
}

export interface LocationsProps {
    locations: ExtendedLocation[];
    onChange: (locations: ExtendedLocation[]) => void;
    onKeepDialogOpen?: () => void;
    connected_integrations: {
        apple: ConnectedIntegrationsFields;
        google: ConnectedIntegrationsFields;
        outlook: ConnectedIntegrationsFieldsMicrosoft;
        twilio: ConnectedIntegrationsFields;
        zoom: ConnectedIntegrationsFields;
    };
    calendar?: any;
    handleSubmit?: (redirect: boolean) => Promise<any>;
}

export interface CustomLocationState {
    id: string;
    fields?: Record<string, any>;
    visible: boolean;
}

export type IntegrationType = 'google-meet' | 'zoom' | 'ms-teams';
export type LocationType = IntegrationType | 'attendee_address' | 'person_address' | 'attendee_phone' | 'person_phone' | 'online' | 'custom';
