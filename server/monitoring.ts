
import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export class MonitoringService {
  static logError(error: Error, req?: Request) {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      request: req ? {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      } : undefined
    };

    console.error('Error:', JSON.stringify(logData, null, 2));
    
    // In production, send to external service like Sentry
  }

  static trackPerformance(label: string, startTime: number) {
    const duration = Date.now() - startTime;
    console.log(`Performance [${label}]: ${duration}ms`);
    
    // Send to analytics service
  }
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  MonitoringService.logError(err, req);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;

  res.status(status).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
