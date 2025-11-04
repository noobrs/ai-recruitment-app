import { Database } from './database.types';

// Helper types for all tables
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role_enum'];
export type UserStatus = Database['public']['Enums']['user_status_enum'];
export type ApplicationStatus = Database['public']['Enums']['application_status_enum'];
export type JobStatus = Database['public']['Enums']['job_status_enum'];
export type ResumeStatus = Database['public']['Enums']['resume_status_enum'];
export type NotificationType = Database['public']['Enums']['notification_type_enum'];

// Table-specific types
export type User = Tables<'users'>;
export type JobSeeker = Tables<'job_seeker'>;
export type Job = Tables<'job'>;
export type Application = Tables<'application'>;
export type Resume = Tables<'resume'>;
export type Recruiter = Tables<'recruiter'>;
export type Company = Tables<'company'>;
export type JobRequirement = Tables<'job_requirement'>;
export type Notification = Tables<'notification'>;

// Insert types
export type UserInsert = TablesInsert<'users'>;
export type JobSeekerInsert = TablesInsert<'job_seeker'>;
export type JobInsert = TablesInsert<'job'>;
export type ApplicationInsert = TablesInsert<'application'>;
export type ResumeInsert = TablesInsert<'resume'>;
export type RecruiterInsert = TablesInsert<'recruiter'>;
export type CompanyInsert = TablesInsert<'company'>;
export type JobRequirementInsert = TablesInsert<'job_requirement'>;
export type NotificationInsert = TablesInsert<'notification'>;

// Update types
export type UserUpdate = TablesUpdate<'users'>;
export type JobSeekerUpdate = TablesUpdate<'job_seeker'>;
export type JobUpdate = TablesUpdate<'job'>;
export type ApplicationUpdate = TablesUpdate<'application'>;
export type ResumeUpdate = TablesUpdate<'resume'>;
export type RecruiterUpdate = TablesUpdate<'recruiter'>;
export type CompanyUpdate = TablesUpdate<'company'>;
export type JobRequirementUpdate = TablesUpdate<'job_requirement'>;
export type NotificationUpdate = TablesUpdate<'notification'>;

// Export composite types
export * from './composite.types';
