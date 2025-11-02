/**
 * Shared types for JobSeeker profile components
 */

export interface FormData {
    first_name: string;
    last_name: string;
    location: string;
    about_me: string;
    profile_picture_url?: string;
    about?: string; // Alias for about_me for compatibility
}
