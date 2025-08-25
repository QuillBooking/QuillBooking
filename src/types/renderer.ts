import type { EventMetaData } from './availability';
import type { UnitOptions } from './common';
import type { EventLimits, EventTypes } from './event';
import type { Fields } from './fields';
import type { ConnectedIntegrationsFields } from './integrations';
import type { PaymentsSettings } from './payments';

// Renderer-specific configuration type
export type Config = {
  ajax_url: string;
  nonce: string;
  url: string;
  lang: string;
  calendar: any; // Using any to avoid circular dependency
  event: RendererEvent;
  booking: RendererBooking;
  global_settings: GlobalSettings;
  can_reschedule?: boolean;
  reschedule_denied_message?: string;
};

// Renderer-specific Event type (slightly different from main Event)
export type RendererEvent = {
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
  location: RendererLocation[];
  created_at: string;
  updated_at: string;
  calendar: any; // Using any to avoid circular dependency
  additional_settings: RendererAdditionalSettings;
  advanced_settings: RendererAdvancedSettings;
  hosts?: any[]; // Using any to avoid circular dependency
  fields: Fields;
  availability_data?: any; // Using any to avoid circular dependency
  reserve: boolean;
  group_settings?: {
    max_invites: number;
    show_remaining: boolean;
  };
  payments_settings?: PaymentsSettings;
  connected_integrations: {
    apple: ConnectedIntegrationsFields;
    google: ConnectedIntegrationsFields;
    outlook: ConnectedIntegrationsFields;
    twilio: ConnectedIntegrationsFields;
    zoom: ConnectedIntegrationsFields;
  };
  limits_data: EventLimits;
};

export type RendererLocation = {
  type: string;
  fields: {
    [key: string]: string;
  };
};

export type RendererAdditionalSettings = {
  allow_attendees_to_select_duration: boolean;
  default_duration: number;
  selectable_durations: number[];
  allow_additional_guests: boolean;
  max_invitees: number;
  show_remaining: boolean;
};

export type RendererAdvancedSettings = {
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

export interface RendererBooking {
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
  event: RendererEvent;
  meta: EventMetaData[];
  guest: any; // Using any to avoid circular dependency
  booking_title?: string;
}

export type GlobalSettings = {
  general: {
    admin_email: string;
    start_from: string;
    time_format: string;
    auto_cancel_after: number;
    auto_complete_after: number;
    default_country_code: string;
    enable_summary_email: boolean;
    summary_email_frequency: string;
  };
  payments: {
    currency: string;
  };
  email: {
    from_name: string;
    from_email: string;
    reply_to_name: string;
    reply_to_email: string;
    use_host_from_name: boolean;
    use_host_reply_to_email: boolean;
    include_ics: boolean;
    footer: string;
  };
  theme: {
    color_scheme: string;
  };
}; 