import meet from '@quillbooking/assets/icons/google/google_meet.png';
import zoom from '@quillbooking/assets/icons/zoom/zoom_video.png';
import teams from '@quillbooking/assets/icons/teams/teams.png';
import type { IntegrationType } from './types';

export const INTEGRATION_ICONS = {
    'google-meet': meet,
    zoom: zoom,
    'ms-teams': teams,
} as const;

export const INTEGRATION_NAMES = {
    'google-meet': 'Google Meet',
    zoom: 'Zoom Video',
    'ms-teams': 'MS Teams',
} as const;

export const INTEGRATION_SLUGS: Record<IntegrationType, string> = {
    'google-meet': 'google',
    zoom: 'zoom',
    'ms-teams': 'outlook',
} as const;
