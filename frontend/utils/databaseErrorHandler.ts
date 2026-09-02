export class DatabaseErrorHandler {
  private static retryAttempts = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 second

  static async handleDatabaseError(error: any, retryCallback?: () => Promise<any>): Promise<any> {
    const errorMessages = [
      'Database temporarily unavailable',
      'Connection timeout',
      'Could not translate host name',
      'Connection refused'
    ];

    const isDatabaseError = errorMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    );

    if (isDatabaseError && this.retryAttempts < this.maxRetries && retryCallback) {
      this.retryAttempts++;
        
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await retryCallback();
        this.retryAttempts = 0; // Reset on success
        return result;
      } catch (retryError) {
        return this.handleDatabaseError(retryError, retryCallback);
      }
    }

    // Reset retry attempts and throw the error
    this.retryAttempts = 0;
    throw error;
  }

  static isDatabaseError(error: any): boolean {
    const databaseErrorMessages = [
      'database temporarily unavailable',
      'connection timeout',
      'could not translate host name',
      'connection refused',
      'too many connections'
    ];

    return databaseErrorMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    );
  }

  static getUserFriendlyMessage(error: any): string {
    if (this.isDatabaseError(error)) {
      return 'Database temporarily unavailable. Please try again in a moment.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  }
}
