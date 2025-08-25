// Common/base types used across the application
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

export type GeneralOptions = {
  value: string;
  label: string;
};

export type LimitUnit = 'days' | 'weeks' | 'months';

export interface UnitOption {
  label: string;
  disabled: boolean;
}

export type UnitOptions = Record<LimitUnit, UnitOption>;

export interface LimitRule {
  limit: number;
  unit: LimitUnit;
}

export type TimeSlot = {
  start: string;
  end: string;
};

export type IconProps = {
  width?: number;
  height?: number;
  rectFill?: boolean;
};

export type Location = {
  type: string;
  id?: string;
  fields: {
    [key: string]: string;
  };
};

export type BookingLocation = {
  type: string;
  id?: string;
  label: string;
  value: string;
};

export type DateOverrides = {
  [date: string]: TimeSlot[];
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