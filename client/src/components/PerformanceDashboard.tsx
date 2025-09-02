
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Zap, Users, Clock, Wifi, WifiOff, Play, Pause } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function PerformanceDashboard() {
  const {
    metrics,
    serverMetrics,
    isMonitoring,
    setIsMonitoring,
    fetchServerMetrics,
    simulateNetworkCondition,
    runLoadTest
  } = usePerformanceMonitor();

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(fetchServerMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, fetchServerMetrics]);

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'reconnecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="testing">Performance Testing</TabsTrigger>
          <TabsTrigger value="network">Network Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {/* Real-time metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(metrics.connectionStatus)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{metrics.connectionStatus}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Render FPS</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.renderFPS}</div>
                <Badge variant={metrics.renderFPS >= 50 ? "default" : "destructive"}>
                  {metrics.renderFPS >= 50 ? "Good" : "Poor"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Message Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.messageLatency.toFixed(1)}ms</div>
                <Badge variant={metrics.messageLatency < 100 ? "default" : "destructive"}>
                  {metrics.messageLatency < 100 ? "Fast" : "Slow"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Component Mount</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.componentMountTime.toFixed(1)}ms</div>
              </CardContent>
            </Card>
          </div>

          {/* Server metrics */}
          {serverMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages/Second</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serverMetrics.messagesPerSecond}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serverMetrics.activeConnections}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serverMetrics.memoryUsage}%</div>
                  <Badge variant={serverMetrics.memoryUsage < 80 ? "default" : "destructive"}>
                    {serverMetrics.memoryUsage < 80 ? "Normal" : "High"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => runLoadTest(10, 30)}>
                  Light Load (10 MPS)
                </Button>
                <Button onClick={() => runLoadTest(50, 30)}>
                  Medium Load (50 MPS)
                </Button>
                <Button onClick={() => runLoadTest(100, 30)} variant="destructive">
                  Heavy Load (100 MPS)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Condition Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => simulateNetworkCondition('fast')}>
                  <Wifi className="h-4 w-4 mr-2" />
                  Fast Connection
                </Button>
                <Button onClick={() => simulateNetworkCondition('slow')} variant="secondary">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Slow Connection
                </Button>
                <Button onClick={() => simulateNetworkCondition('unstable')} variant="destructive">
                  <Activity className="h-4 w-4 mr-2" />
                  Unstable Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
