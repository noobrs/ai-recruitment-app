/**
 * Composite Types
 * 
 * This file contains composite and extended types that combine multiple database types
 * or add additional properties for application-specific use cases.
 * 
 * All types here are built on top of the base types from database.types.ts
 */

import { User as DBUser, JobSeeker, Recruiter } from './index';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type BaseUser = SupabaseUser & DBUser;

/**
 * User with JobSeeker profile joined
 * Used when displaying job seeker information with user details
 */
// export type UserWithJobSeeker = User & {
//     job_seeker: JobSeeker;
// };

// /**
//  * User with Recruiter profile joined
//  * Used when displaying recruiter information with user details
//  */
// export type UserWithRecruiter = User & {
//     recruiter: Recruiter;
// };

// /**
//  * JobSeeker Profile with optional job_seeker data
//  * Used in useJobSeeker hook for client-side fetching
//  */
// export type JobSeekerProfile = User & {
//     job_seeker: JobSeeker | null;
// };

// /**
//  * Recruiter Profile with optional recruiter data
//  * Used in useRecruiter hook for client-side fetching
//  */
// export type RecruiterProfile = User & {
//     recruiter: Recruiter | null;
// };

/**
 * Full Recruiter Profile with Company details
 * Used when displaying complete recruiter information with company data
 */
// export type RecruiterWithCompany = User & {
//     recruiter: Recruiter & {
//         company: Company;
//     };
// };

// /**
//  * Authentication User type
//  * Extends base User with optional email for auth context
//  */
// export type AuthUser = User & {
//     email?: string;
// };
