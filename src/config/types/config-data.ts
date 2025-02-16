import type { Availability } from '@quillbooking/client';

export type ConfigData = Record<string, unknown> & {
	blogName: string;
	adminUrl: string;
	siteUrl: string;
	pluginDirUrl: string;
	adminEmail: string;
	ajaxUrl: string;
	nonce: string;
	isWoocommerceActive: boolean;
	timezones: Record<string, string>;
	integrations: Integrations;
	locations: Locations;
	availabilities: Availability[];
};

export type Integrations = {
	[key: string]: Integration;
};

export type Integration = {
	name: string;
	description: string;
	icon: string;
	is_calendar: boolean;
	auth_type: 'oauth' | 'basic';
	fields: Fields;
	settings: Record<string, unknown>;
	is_global: boolean;
	has_accounts: boolean;
};

export type Fields = {
	[key: string]: Field;
};

export type Field = {
	label: string;
	description: string;
	type: 'text' | 'password';
	required: boolean;
	placeholder?: string;
};

export type Locations = {
	[key: string]: Location;
};

export type Location = {
	title: string;
	is_integration: boolean;
	fields: {
		[key: string]: LocationField;
	};
};

export type LocationField = {
	label: string;
	desc: string;
	type: 'text' | 'checkbox' | 'url';
	required: boolean;
};