// Centralized error handling service
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class ErrorService {
  static createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  static handleSupabaseError(error: any): AppError {
    // Map common Supabase errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Referenced record not found',
      '42501': 'Permission denied',
      'PGRST116': 'Record not found',
      'PGRST301': 'Permission denied',
    };

    const code = error.code || 'UNKNOWN_ERROR';
    const message = errorMappings[code] || error.message || 'An unexpected error occurred';

    return this.createError(code, message, error);
  }

  static handleNetworkError(): AppError {
    return this.createError(
      'NETWORK_ERROR',
      'Network connection failed. Please check your internet connection.'
    );
  }

  static handleValidationError(field: string, message: string): AppError {
    return this.createError(
      'VALIDATION_ERROR',
      `${field}: ${message}`,
      { field }
    );
  }

  static logError(error: AppError, context?: string): void {
    console.error(`[${error.timestamp}] ${context || 'Error'}:`, {
      code: error.code,
      message: error.message,
      details: error.details,
    });

    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    // this.sendToErrorTracking(error, context);
  }

  static getErrorMessage(error: any): string {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }
}

// Global error boundary for React components
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const appError = error.code 
      ? ErrorService.handleSupabaseError(error)
      : ErrorService.createError('OPERATION_FAILED', ErrorService.getErrorMessage(error));
    
    ErrorService.logError(appError, context);
    throw appError;
  }
};