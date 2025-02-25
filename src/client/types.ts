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
		type: 'one-to-one' | 'group' | 'round-robin';
		slug: string;
	}[];
	created_at: string;
	updated_at: string;
};

export type CalendarResponse = Response & {
	data: Calendar[];
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
	type: 'one-to-one' | 'group' | 'round-robin';
	duration: number;
	color: string;
	visibility: 'public' | 'private';
	dynamic_duration: boolean;
	location: Location[];
	created_at: string;
	updated_at: string;
	calendar: Calendar;
	additional_settings: AdditionalSettings;
};

export type AdditionalSettings = {
	allow_attendees_to_select_duration?: boolean;
	duration?: number;
	allow_additional_guests?: boolean;
	max_invitees: number;
	show_remaining: boolean;
};

export type Location = {
	type: string;
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

export type Availability = {
	id: string;
	user_id: string | number;
	name: string;
	weekly_hours: WeeklyHours;
	override: DateOverrides;
	timezone: string;
	events?: number;
};

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

export type LimitUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export interface LimitRule {
	limit: number;
	unit: LimitUnit;
}

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