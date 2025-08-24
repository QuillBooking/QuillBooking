import type { EventLimits } from './event';

export interface EventTabHandle {
  saveSettings: () => Promise<void>;
}

export interface EventTabProps {
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
}

export interface LimitBaseProps {
  limits: EventLimits;
  handleChange: (section: keyof EventLimits, key: string, value: any) => void;
}

export interface GettingStartedComponentProps {
  event: any; // Using any to avoid circular dependency with Event
  onEventChange?: (field: string, value: any) => void;
  onAvailabilityChange?: (
    dayKey: string,
    field: string,
    value: boolean | { start: string; end: string }[]
  ) => void;
} 