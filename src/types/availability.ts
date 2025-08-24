import type { DateOverrides, WeeklyHours } from './common';
import type { Event } from './event';

export interface EventMetaData {
  id: number;
  event_id: number;
  event: Event;
  meta_key: string;
  meta_value: string;
  updated_at: string;
  create_at: string;
}

// Updated availability value structure based on the JSON data
export interface AvailabilityValue {
  weekly_hours: WeeklyHours;
  override: DateOverrides;
}

// Updated availability structure based on migration
export interface Availability {
  id: number;
  user_id: number;
  name: string;
  value: AvailabilityValue; // This matches the JSON structure
  timezone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  events_count?: number;
}

// Custom availability structure used in event availability_meta
export interface CustomAvailability {
  name: string;
  value: AvailabilityValue;
}

// Event availability meta structure based on the new JSON format
export interface EventAvailabilityMeta {
  custom_availability: CustomAvailability;
  is_common: boolean;
  hosts_schedules: Record<string, number>; // Maps host ID to availability ID
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
