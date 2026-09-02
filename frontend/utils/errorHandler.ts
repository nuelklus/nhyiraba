

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
  isNetworkError?: boolean;
  isValidationError?: boolean;
}

export const handleError = (error: any): ApiError => {
  
  console.error('API Error:', error);

  if (error?.response) {
    const responseData = error.response.data;
    let message = 'Request failed';

    if (responseData?.message) {
      message = responseData.message;
    } else if (responseData?.error) {
      message = responseData.error;
    } else if (responseData?.detail) {
      message = responseData.detail;
    }

    else if (typeof responseData === 'object' && responseData !== null) {
      const fieldErrors: string[] = [];
      Object.keys(responseData).forEach(field => {
        const fieldError = responseData[field];
        if (Array.isArray(fieldError)) {
          fieldErrors.push(`${field}: ${fieldError.join(', ')}`);
        } else if (typeof fieldError === 'string') {
          fieldErrors.push(`${field}: ${fieldError}`);
        }
      });
      
      if (fieldErrors.length > 0) {
        message = fieldErrors.join(' | ');
      }
    }
    
    return {
      message,
      status: error.response.status,
      details: responseData,
      isValidationError: error.response.status === 400
    };
  }

  if (error instanceof Error) {
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        isNetworkError: true,
        details: error
      };
    }

    if ((error as any).data) {
      return {
        message: error.message,
        status: (error as any).status,
        details: (error as any).data,
        isValidationError: (error as any).status === 400
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      details: error
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      details: error
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    details: error
  };
};

export const getUserFriendlyMessage = (error: ApiError): string => {
  
  if (error.isNetworkError) {
    return 'Connection issue. Please check your internet connection and try again.';
  }

  if (error.isValidationError) {
    return error.message || 'Please check your input and try again.';
  }

  if (error.status === 401) {
    return 'Please log in to continue.';
  }

  if (error.status === 403) {
    return 'You don\'t have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message;
};

export const useErrorHandler = () => {
  const getError = (error: any) => handleError(error);
  const getUserMessage = (error: any) => getUserFriendlyMessage(handleError(error));
  
  return {
    getError,
    getUserMessage
  };
};
