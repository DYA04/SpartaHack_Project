export interface AccessibilityFlags {
  heavy_lifting: boolean;
  standing_long: boolean;
  driving_required: boolean;
  outdoor_work: boolean;
}

export interface JobFormData {
  title: string;
  description: string;
  short_description: string;
  skill_tags: string[];
  accessibility_flags: AccessibilityFlags;
  latitude?: number;
  longitude?: number;
  shift_start?: string;
  shift_end?: string;
  image?: string;
}

export interface EnhanceJobResponse {
  title: string;
  description: string;
  short_description: string;
  skill_tags: string[];
  accessibility_flags: AccessibilityFlags;
  suggested_time: string | null;
  suggested_location: string | null;
}

export interface EnhanceJobAPIResponse {
  result: EnhanceJobResponse;
  remaining_requests: number;
}

export const SKILL_TAG_OPTIONS = [
  'Teaching',
  'Programming',
  'First Aid',
  'Physical Labor',
  'Driving',
  'Cooking',
  'Cleaning',
  'Gardening',
  'Photography',
  'Graphic Design',
  'Event Planning',
  'Animal Care',
  'Mechanical',
  'Communication',
  'Organization',
  'Healthcare',
  'Web Development',
  'Marketing',
  'Editing',
  'Errands',
  'Tutoring',
  'Music',
  'Childcare',
] as const;

export const DEFAULT_ACCESSIBILITY_FLAGS: AccessibilityFlags = {
  heavy_lifting: false,
  standing_long: false,
  driving_required: false,
  outdoor_work: false,
};
