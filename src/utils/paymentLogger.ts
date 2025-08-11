interface PaymentLog {
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'callback';
  data: any;
  orderId?: string;
  amount?: number;
  status?: string;
}

class PaymentLogger {
  private logs: PaymentLog[] = [];
  private maxLogs = 100;

  log(type: PaymentLog['type'], data: any, metadata?: Partial<PaymentLog>) {
    const logEntry: PaymentLog = {
      timestamp: new Date().toISOString(),
      type,
      data,
      ...metadata,
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Payment ${type.toUpperCase()}]`, logEntry);
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem('paymentLogs', JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to store payment logs:', error);
    }
  }

  logRequest(data: any, orderId?: string, amount?: number) {
    this.log('request', data, { orderId, amount });
  }

  logResponse(data: any, orderId?: string, status?: string) {
    this.log('response', data, { orderId, status });
  }

  logError(error: any, orderId?: string) {
    this.log('error', {
      message: error.message,
      stack: error.stack,
      ...error,
    }, { orderId });
  }

  logCallback(data: any, orderId?: string, status?: string) {
    this.log('callback', data, { orderId, status });
  }

  getLogs(): PaymentLog[] {
    return [...this.logs];
  }

  getLogsForOrder(orderId: string): PaymentLog[] {
    return this.logs.filter(log => log.orderId === orderId);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('paymentLogs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Load logs from localStorage on initialization
  loadStoredLogs() {
    try {
      const storedLogs = localStorage.getItem('paymentLogs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.warn('Failed to load stored payment logs:', error);
    }
  }
}

export const paymentLogger = new PaymentLogger();

// Load stored logs on module initialization
paymentLogger.loadStoredLogs();