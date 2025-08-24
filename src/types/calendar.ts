import type { Location } from './common';
import type { AdditionalSettings, EventTypes } from './event';
import type { PaymentsSettings } from './payments';

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
  user?: any; // Using any to avoid circular dependency with User
  team_members: number[];
}; 