
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupSocketIO } from "./websocket";
import { performanceMonitor } from "./performanceMonitor";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🚀 [Server] Server ishga tushirilmoqda...');
    
    const server = await registerRoutes(app);
    console.log('📋 [Server] Routelar ro\'yxatga olindi');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('🚨 [Server] Serverda xatolik yuz berdi:', err);
      res.status(status).json({ message });
    });

    // Setup WebSocket
    setupSocketIO(server);
    console.log('🔌 [Server] WebSocket sozlandi');

    // Start performance monitoring
    performanceMonitor.startMonitoring();
    console.log('📊 [Server] Performance monitoring boshlandi');

    const PORT = parseInt(process.env.PORT || "5000");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ [Server] Server muvaffaqiyatli ishga tushdi: http://0.0.0.0:${PORT}`);
      log(`serving on port ${PORT}`);
    });

  } catch (error) {
    console.error('🚨 [Server] Server ishga tushirishda xatolik:', error);
    process.exit(1);
  }
})();
