// Export all hooks
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

export { useJobSeeker } from './useJobSeeker';
export type { UseJobSeekerReturn, JobSeekerProfile } from './useJobSeeker';

export { useRecruiter } from './useRecruiter';
export type { UseRecruiterReturn, RecruiterProfile } from './useRecruiter';

export { useGetUser } from './useGetUser';

// Export auth context (with alias to avoid conflicts)
export { AuthProvider, useAuthContext } from '../contexts/AuthContext';
export type { AuthContextValue, AuthUser, AuthProviderProps } from '../contexts/AuthContext';
