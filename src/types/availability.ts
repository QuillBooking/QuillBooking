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

export interface AvailabilityValue {
  weekly_hours: WeeklyHours;
  override: DateOverrides;
}

export interface Availability {
  id: number;
  user_id: number;
  name: string;
  value: AvailabilityValue;
  timezone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  events_count?: number;
}

export interface EventAvailabilityMeta {
  custom_availability: Availability;
  is_common?: boolean;
  hosts_schedules?: Record<string, number>;
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
