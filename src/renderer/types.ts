export type Config = {
    ajax_url: string;
    nonce: string;
    url: string;
    lang: string;
    calendar: Calendar;
    event: Event;
    booking: Booking;
};

export type Event = {
    id: number;
    hash_id: string;
    calendar_id: number;
    user_id: number;
    name: string;
    description: string | null;
    slug: string;
    status: 'active' | 'inactive' | 'deleted';
    type: EventTypes;
    duration: number;
    color: string;
    visibility: 'public' | 'private';
    dynamic_duration: boolean;
    location: Location[];
    created_at: string;
    updated_at: string;
    calendar: Calendar;
    additional_settings: AdditionalSettings;
    hosts?: Host[];
    fields: Fields;
    availability_data?: Availability,
    reserve: boolean;
    connected_integrations: {
        apple: ConnectedIntegrationsFields;
        google: ConnectedIntegrationsFields;
        outlook: ConnectedIntegrationsFields;
        twilio: ConnectedIntegrationsFields;
        zoom: ConnectedIntegrationsFields;
    };
};


export type EventTypes = 'one-to-one' | 'group' | 'round-robin';

export type Calendar = {
    id: number;
    user_id: number;
    name: string;
    description: string;
    slug: string;
    status: 'active' | 'inactive';
    timezone: string;
    type: string;
    avatar: {
        id: number;
        url: string;
    };
    featured_image: {
        id: number;
        url: string;
    };
    events: {
        id: number;
        calendar_id: number;
        name: string;
        duration: number;
        type: EventTypes;
        slug: string;
        location: Location[];
        is_disabled: boolean;
        booking_count: number;
    }[];
    created_at: string;
    updated_at: string;
    user?: User;
};

export type AdditionalSettings = {
    allow_attendees_to_select_duration: boolean;
    default_duration: number;
    selectable_durations: number[];
    allow_additional_guests: boolean;
    max_invitees: number;
    show_remaining: boolean;
};


export type User = {
    id: number;
    display_name: string;
    user_login: string;
    user_email: string;
};

export type Host = {
    id: number;
    name: string;
    image: string;
    availabilities?: {
        [key: string]: Availability;
    };
};

export interface EventMetaData {
    id: number;
    event_id: number;
    event: Event;
    meta_key: string;
    meta_value: string;
    updated_at: string;
    create_at: string;
}

export interface CustomAvailability {
    name: string;
    weekly_hours: WeeklyHours;
    override: DateOverrides;
    timezone: string;
    events?: EventMetaData[];
    events_count?: number;
    is_default?: boolean;
    type?: 'custom' | 'existing';
    is_common?: boolean;
}
export interface Availability extends CustomAvailability {
    id: string;
    user_id: string | number;
};

export type ConnectedIntegrationsFields = {
    name: string;
    connected: boolean;
}

export type WeeklyHours = {
    [day: string]: {
        times: Array<{
            start: string;
            end: string;
        }>;
        off: boolean;
    };
};

export type DateOverrides = {
    [date: string]: TimeSlot[];
};

export type TimeSlot = {
    start: string;
    end: string;
};


export type FieldType = {
	label: string;
	type: string;
	required: boolean;
	group: string;
	event_location: string;
	placeholder: string;
	order: number;
	enabled?: boolean;
	settings?: {
		options?: string[];
		min?: string;
		max?: string;
		format?: string;
		maxFileSize?: number;
		maxFileCount?: number;
		allowedFiles?: string[];
	};
    helpText?: string;
};

export type Fields = {
	system: FieldsGroup;
	location: FieldsGroup;
	custom: FieldsGroup;
	other?: FieldsGroup;
};

export type FieldsGroup = {
	[key: string]: FieldType;
};


export interface Booking {
    id: number;
    hash_id: string;
    event_id: number;
    calendar_id: number;
    guest_id: number;
    start_time: string;
    end_time: string;
    slot_time: number;
    source: string;
    status: 'scheduled' | 'cancelled' | 'completed' | 'pending';
    cancelled_by: string | null;
    event_url: string;
    created_at: string;
    updated_at: string;
    timezone: string;
    fields: any | null;
    location: string;
    event: Event;
    meta: EventMetaData[];
    guest: Guest;
}

export type Guest = {
	booking_id: number;
	create_at: string;
	email: string;
	id: number;
	name: string;
	phone?: string;
	updated_at: string;
	user_id: number;
};

export type Location = {
	type: string;
	fields: {
		[key: string]: string;
	};
};