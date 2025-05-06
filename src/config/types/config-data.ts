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
	paymentGateways: PaymentGateways;
	locations: Locations;
	availabilities: Availability[];
	fieldsTypes: FieldsTypes;
	capabilities: Capabilities;
	currentUser: CurrentUser;
	mergeTags: MergeTagGroups; 

};

export type MergeTagGroups = {
	[group: string]: {
	  mergeTags: {
		[slug: string]: {
		  name: string;
		  value: string;
		};
	  };
	};
  };
  
export type CurrentUser = {
	id: number;
	email: string;
	display_name: string;
	is_admin: boolean;
	capabilities: UserCapabilities;
};

export type UserCapabilities = {
	[key: string]: boolean;
};

export type PaymentGateways = {
	[key: string]: PaymentGateway;
};

export type PaymentGateway = {
	name: string;
	description: string;
	settings: {
		mode: 'saandbox' | 'live';
		[key: string]: unknown;
	};
	fields: Fields;
};

export type Capabilities = Record<string, CapabilityGroup>;

export type CapabilityGroup = {
	title: string;
	capabilities: Record<string, string>;
};

export type FieldsTypes = {
	[key: string]: FieldType;
};

export type FieldType = {
	type: 'text' | 'textarea' | 'checkbox' | 'select' | 'radio' | 'date' | 'time' | 'datetime' | 'number' | 'multiple_select' | 'file' | 'hidden' | 'checkbox_group' | 'terms';
	has_options: boolean;
	multiple: boolean;
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
	auth_fields: Fields;
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
	type: 'text' | 'password' | 'swtich' | 'checkbox';
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
	frontend_fields: {
		[key: string]: LocationField;
	};
};

export type LocationField = {
	label: string;
	desc: string;
	type: 'text' | 'checkbox' | 'url';
	required: boolean;
};