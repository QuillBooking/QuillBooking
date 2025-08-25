import type { EventMetaData } from './availability';
import type { BookingLocation } from './common';

export type BookingsTabsTypes =
  | 'upcoming'
  | 'completed'
  | 'pending'
  | 'latest'
  | 'cancelled'
  | 'no-show'
  | 'all';

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
  location: BookingLocation;
  event: any; // Using any to avoid circular dependency with Event
  meta: EventMetaData[];
}

export interface Booking extends BookingResponse {
  time_span: string;
  guest?: any; // Using any to avoid circular dependency with Guest
  calendar?: any; // Using any to avoid circular dependency with Calendar
  logs?: BookingLog[];
  booking_title?: string;
  hosts: any[]; // Using any to avoid circular dependency with User
  order: {
    booking_id: number;
    created_at: string;
    updated_at: string;
    transaction_id: string;
    currency: string;
    discount: number;
    id: number;
    items: any[] | null;
    payment_method: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
    total: number;
  };
} 