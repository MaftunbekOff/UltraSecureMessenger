
import { useState, useEffect, useCallback } from 'react';

interface ClientMetrics {
  renderFPS: number;
  componentMountTime: number;
  messageLatency: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface PerformanceData {
  messagesPerSecond: number;
  averageLatency: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  renderFPS: number;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    renderFPS: 60,
    componentMountTime: 0,
    messageLatency: 0,
    connectionStatus: 'connected'
  });
  
  const [serverMetrics, setServerMetrics] = useState<PerformanceData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // FPS monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, renderFPS: fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoring]);

  // Component mount time tracking
  const trackComponentMount = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const mountTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, componentMountTime: mountTime }));
      console.log(`[Performance] ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
    };
  }, []);

  // Message latency tracking
  const trackMessageLatency = useCallback((startTime: number) => {
    const latency = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, messageLatency: latency }));
    
    // Send to server for aggregation
    fetch('/api/performance/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message_latency',
        value: latency,
        timestamp: Date.now()
      })
    }).catch(console.error);
    
    return latency;
  }, []);

  // Fetch server metrics
  const fetchServerMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/performance/metrics');
      const data = await response.json();
      setServerMetrics(data);
    } catch (error) {
      console.error('Failed to fetch server metrics:', error);
    }
  }, []);

  // Network condition simulation
  const simulateNetworkCondition = useCallback(async (condition: 'slow' | 'fast' | 'unstable') => {
    try {
      await fetch(`/api/performance/simulate/${condition}`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to simulate network condition:', error);
    }
  }, []);

  // Load testing
  const runLoadTest = useCallback(async (messagesPerSecond: number, durationSeconds: number) => {
    try {
      await fetch('/api/performance/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messagesPerSecond, durationSeconds })
      });
    } catch (error) {
      console.error('Failed to run load test:', error);
    }
  }, []);

  return {
    metrics,
    serverMetrics,
    isMonitoring,
    setIsMonitoring,
    trackComponentMount,
    trackMessageLatency,
    fetchServerMetrics,
    simulateNetworkCondition,
    runLoadTest
  };
}
