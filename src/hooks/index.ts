// Export all hooks
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

export { useJobSeeker } from './useJobSeeker';
export type { UseJobSeekerReturn } from './useJobSeeker';

export { useRecruiter } from './useRecruiter';
export type { UseRecruiterReturn } from './useRecruiter';

// Export auth context (with alias to avoid conflicts)
export { AuthProvider, useAuthContext } from '../contexts/AuthContext';
export type { AuthContextValue, AuthProviderProps } from '../contexts/AuthContext';
