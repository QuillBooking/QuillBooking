import type { Availability } from './availability';

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
  availabilities?: Availability[];
};

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