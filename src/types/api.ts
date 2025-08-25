import type { Response } from './common';

export type CalendarResponse = Response & {
  data: any[]; // Using any to avoid circular dependency with Calendar
}; 