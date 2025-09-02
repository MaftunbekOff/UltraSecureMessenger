
import { Request, Response, NextFunction } from 'express';

interface PerformanceMetric {
  timestamp: number;
  type: 'message_latency' | 'api_response' | 'websocket_event' | 'user_action';
  value: number;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  messagesPerSecond: number;
  averageLatency: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  renderFPS: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private activeConnections = 0;
  private messageCount = 0;
  private lastSecond = Date.now();

  recordMetric(type: PerformanceMetric['type'], value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      timestamp: Date.now(),
      type,
      value,
      metadata
    });

    // Clean old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Count messages for MPS calculation
    if (type === 'message_latency') {
      this.messageCount++;
    }
  }

  getMetrics(since?: number): PerformanceMetric[] {
    const cutoff = since || Date.now() - 60000; // Last minute by default
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const recentMetrics = this.getMetrics(now - 60000); // Last minute
    
    // Calculate messages per second
    const messagesPerSecond = this.messageCount / Math.max(1, (now - this.lastSecond) / 1000);
    if (now - this.lastSecond >= 1000) {
      this.messageCount = 0;
      this.lastSecond = now;
    }

    // Calculate average latency
    const latencyMetrics = recentMetrics.filter(m => m.type === 'message_latency');
    const averageLatency = latencyMetrics.length > 0 
      ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length 
      : 0;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryUsage = memUsage.heapUsed / memUsage.heapTotal;

    return {
      messagesPerSecond: Math.round(messagesPerSecond * 100) / 100,
      averageLatency: Math.round(averageLatency * 100) / 100,
      activeConnections: this.activeConnections,
      cpuUsage: 0, // Would need additional monitoring
      memoryUsage: Math.round(memoryUsage * 100),
      renderFPS: 0 // Will be reported from frontend
    };
  }

  setActiveConnections(count: number) {
    this.activeConnections = count;
  }

  // Simulate network conditions for testing
  simulateNetworkDelay(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Load testing helper
  async simulateLoad(messagesPerSecond: number, durationSeconds: number) {
    const interval = 1000 / messagesPerSecond;
    const endTime = Date.now() + (durationSeconds * 1000);
    
    console.log(`Starting load simulation: ${messagesPerSecond} MPS for ${durationSeconds}s`);
    
    while (Date.now() < endTime) {
      this.recordMetric('message_latency', Math.random() * 100 + 50); // Simulate latency
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.log('Load simulation completed');
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Middleware to track API performance
export const trackAPIPerformance = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric('api_response', duration, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });
  });
  
  next();
};

// Network simulation middleware for testing
export const simulateNetworkConditions = (type: 'slow' | 'fast' | 'unstable') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    switch (type) {
      case 'slow':
        await performanceMonitor.simulateNetworkDelay(1000 + Math.random() * 2000);
        break;
      case 'fast':
        await performanceMonitor.simulateNetworkDelay(10 + Math.random() * 50);
        break;
      case 'unstable':
        const delay = Math.random() > 0.7 ? 2000 + Math.random() * 3000 : 50;
        await performanceMonitor.simulateNetworkDelay(delay);
        break;
    }
    
    next();
  };
};
