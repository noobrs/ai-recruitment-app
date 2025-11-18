/**
 * FastAPI Response Types
 * 
 * These types match the Pydantic models from api/types/types.py
 * Used for type-safe communication between Next.js frontend and FastAPI backend
 */

/**
 * Candidate information extracted from resume
 */
export interface CandidateOut {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
}

/**
 * Education entry extracted from resume
 */
export interface EducationOut {
    degree: string | null;
    institution: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

/**
 * Work experience entry extracted from resume
 */
export interface ExperienceOut {
    job_title: string | null;
    company: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

/**
 * Certification entry extracted from resume
 */
export interface CertificationOut {
    name: string | null;
    description: string | null;
}

/**
 * Activity/project entry extracted from resume
 */
export interface ActivityOut {
    name: string | null;
    description: string | null;
}

/**
 * Complete resume data structure returned by FastAPI
 */
export interface ResumeData {
    candidate: CandidateOut;
    education: EducationOut[];
    experience: ExperienceOut[];
    skills: string[];
    languages: string[];
    certifications: CertificationOut[];
    activities: ActivityOut[];
}

/**
 * Standard API response wrapper from FastAPI
 */
export interface ApiResponse<T = ResumeData> {
    status: 'success' | 'error' | 'warning';
    data: T | null;
    message?: string;
}

/**
 * Type guard to check if API response is successful
 */
export function isSuccessResponse<T>(
    response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } {
    return response.status === 'success' && response.data !== null;
}
