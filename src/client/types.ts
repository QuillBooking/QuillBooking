export type Response = {
	current_page: number;
	first_page_url: string;
	from: number;
	last_page: number;
	last_page_url: string;
	next_page_url: string;
	path: string;
	prev_page_url: string;
	per_page: number;
	to: number;
	total: number;
};

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
		created_at: string;
		payments_settings: PaymentsSettings;
		additional_settings: AdditionalSettings;
	}[];
	created_at: string;
	updated_at: string;
	user?: User;
	team_members: number[];
};

export type CalendarResponse = Response & {
	data: Calendar[];
};

export type ConnectedIntegrationsFields = {
	name: string;
	connected: boolean;
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
	booking_count: number;
	is_disabled: boolean;
	visibility: 'public' | 'private';
	dynamic_duration: boolean;
	location: Location[];
	created_at: string;
	updated_at: string;
	calendar: Calendar;
	additional_settings: AdditionalSettings;
	group_settings?: GroupSettings;
	hosts?: Host[];
	fields?: EventMetaData[];
	availability_data?: Availability;
	reserve: boolean;
	payments_settings?: {
		enable_payment: boolean;
		enable_paypal?: boolean;
		enable_stripe?: boolean;
		enable_woocommerce?: boolean;
		woo_product?: number;
		items: Array<{
			item: string;
			price: number;
		}>;
		currency: string;
	};
	connected_integrations: {
		apple: ConnectedIntegrationsFields;
		google: ConnectedIntegrationsFields;
		outlook: ConnectedIntegrationsFields;
		twilio: ConnectedIntegrationsFields;
		zoom: ConnectedIntegrationsFields;
	};
};

export type AdditionalSettings = {
	allow_attendees_to_select_duration: boolean;
	default_duration: number;
	selectable_durations: number[];
	allow_additional_guests: boolean;
	max_invitees?: number;
	show_remaining?: boolean;
};

export type GroupSettings = {
	max_invites: number;
	show_remaining: boolean;
};

export type Location = {
	type: string;
	id?: string;
	fields: {
		[key: string]: string;
	};
};

export type WeeklyHours = {
	[day: string]: {
		times: Array<{
			start: string;
			end: string;
		}>;
		off: boolean;
	};
};

export type TimeSlot = {
	start: string;
	end: string;
};

export type DateOverrides = {
	[date: string]: TimeSlot[];
};

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
}

export type AvailabilityRange = {
	type: 'days' | 'date_range' | 'infinity';
	days?: number;
	start_date?: string;
	end_date?: string;
};

export type EventAvailability = {
	availability: Availability;
	range: AvailabilityRange;
};

export type LimitUnit = 'days' | 'weeks' | 'months';

export interface LimitRule {
	limit: number;
	unit: LimitUnit;
}

export interface UnitOption {
	label: string;
	disabled: boolean;
}

export type UnitOptions = Record<LimitUnit, UnitOption>;

export interface EventLimits {
	general: {
		buffer_before: number;
		buffer_after: number;
		minimum_notices: number;
		minimum_notice_unit: 'minutes' | 'hours';
		time_slot: number;
	};
	frequency: {
		enable: boolean;
		limits: LimitRule[];
	};
	duration: {
		enable: boolean;
		limits: LimitRule[];
	};
	timezone_lock: {
		enable: boolean;
		timezone: string;
	};
}

export interface EventMetaData {
	id: number;
	event_id: number;
	event: Event;
	meta_key: string;
	meta_value: string;
	updated_at: string;
	create_at: string;
}

export type NotificationType = {
	label: string;
	type: string;
	default: boolean;
	template: {
		subject: string;
		message: string;
	};
	times?: Array<{ unit: string; value: number }>;
};

export type BookingsTabsTypes =
	| 'upcoming'
	| 'completed'
	| 'pending'
	| 'latest'
	| 'cancelled'
	| 'no-show'
	| 'all';

export type EventTypes = 'one-to-one' | 'group' | 'round-robin';

export type EventTypesOptions =
	| 'All Event Types'
	| 'One to One'
	| 'Group'
	| 'Round Robin';

export type GeneralOptions = { value: string; label: string };

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

export type BookingLog = {
	booking_id: number;
	created_at: string;
	id: number;
	message: string;
	type: string;
	updated_at: string;
};

export interface BookingResponse {
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
}

export interface Booking extends BookingResponse {
	time_span: string;
	guest?: Guest | Guest[];
	calendar?: Calendar;
	logs?: BookingLog[];
	order: {
		booking_id: number;
		created_at: string;
		currency: string;
		discount: number;
		id: number;
		items: any[] | null;
		payment_method: string;
		status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
		total: number;
	};
}

export type User = {
	ID: number;
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

export type IconProps = {
	width?: number;
	height?: number;
	rectFill?: boolean;
};

export interface EventTabHandle {
	saveSettings: () => Promise<void>;
}

export interface EventTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

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
		min?: number;
		max?: number;
		format?: string;
		maxFileSize?: number;
		maxFileCount?: number;
		allowedFiles?: string[];
		termsText?: string;
	};
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

export interface LimitBaseProps {
	limits: EventLimits;
	handleChange: (section: keyof EventLimits, key: string, value: any) => void;
}

export type NoticeMessage = {
	type: 'success' | 'error';
	title: string;
	message: string;
};

export interface PaymentItem {
	item?: string;
	price?: number;
	woo_product?: number;
	duration?: string;
}

export interface PaymentsSettings {
	enable_payment: boolean;
	type: 'native' | 'woocommerce';
	woo_product: number | null;
	enable_items_based_on_duration: boolean;
	items: PaymentItem[];
	multi_duration_items: {
		[key: string]: PaymentItem & { duration: string };
	};
	payment_methods?: string[];
	enable_paypal: boolean;
	enable_stripe: boolean;
}
