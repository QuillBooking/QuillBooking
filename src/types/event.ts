import type { EventAvailabilityMeta, EventMetaData } from './availability';
import type { LimitRule, Location, UnitOptions } from './common';
import type { ConnectedIntegrationsFields, ConnectedIntegrationsFieldsMicrosoft } from './integrations';
import type { PaymentsSettings } from './payments';

export type EventTypes = 'one-to-one' | 'group' | 'round-robin' | 'collective';

export type EventTypesOptions =
  | 'All Event Types'
  | 'One to One'
  | 'Group'
  | 'Round Robin'
  | 'Collective';

export type AdditionalSettings = {
  allow_attendees_to_select_duration: boolean;
  default_duration: number;
  selectable_durations: number[];
  allow_additional_guests: boolean;
  max_invitees?: number;
  show_remaining?: boolean;
};

export type AdvancedSettings = {
  submit_button_text: string;
  redirect_after_submit: boolean;
  redirect_url: string;
  require_confirmation: boolean;
  confirmation_time: 'always' | 'less_than';
  confirmation_time_value: number;
  confirmation_time_unit: UnitOptions;
  allow_multiple_bookings: boolean;
  maximum_bookings: number;
  attendee_cannot_cancel: boolean;
  cannot_cancel_time: 'event_start' | 'less_than';
  cannot_cancel_time_value: number;
  cannot_cancel_time_unit: UnitOptions;
  permission_denied_message: string;
  attendee_cannot_reschedule: boolean;
  cannot_reschedule_time: 'event_start' | 'less_than';
  cannot_reschedule_time_value: number;
  cannot_reschedule_time_unit: UnitOptions;
  reschedule_denied_message: string;
  event_title: string;
  redirect_query_string: string;
};

export type GroupSettings = {
  max_invites: number;
  show_remaining: boolean;
};

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
  // Updated availability fields based on migration
  availability_type: 'existing' | 'custom';
  availability_meta: EventAvailabilityMeta;
  availability_id: number | null;
  created_at: string;
  updated_at: string;
  calendar: any; // Using any to avoid circular dependency with Calendar
  additional_settings: AdditionalSettings;
  advanced_settings: AdvancedSettings;
  group_settings?: GroupSettings;
  hosts?: any[]; // Using any to avoid circular dependency with Host
  fields?: EventMetaData[];
  availability_data?: any; // Using any to avoid circular dependency with Availability
  reserve: boolean;
  payments_settings: PaymentsSettings;
  connected_integrations: {
    apple: ConnectedIntegrationsFields;
    google: ConnectedIntegrationsFields;
    outlook: ConnectedIntegrationsFieldsMicrosoft;
    twilio: ConnectedIntegrationsFields;
    zoom: ConnectedIntegrationsFields;
  };
};