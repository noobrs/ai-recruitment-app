/**
 * Centralized logging utility for consistent error and debug logs.
 * 
 * Usage:
 *   logError('getAllJobs', error);
 *   logInfo('Job created successfully', data);
 */
export function logError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[JobService] ${context}: ${error.message}\nStack: ${error.stack}`);
  } else {
    console.error(`[JobService] ${context}:`, error);
  }
}

export function logInfo(context: string, message: string, data?: unknown) {
  console.info(`[JobService] ${context}: ${message}`, data || '');
}
