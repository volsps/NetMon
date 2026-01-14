import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const log = (msg: string) => {
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);
};

(async () => {
  // 1. Регистрируем API
  await registerRoutes(app);

  // 2. Создаем сервер
  const server = createServer(app);

  // 3. Обработка ошибок
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  // 4. Запуск фронта (ПОРЯДОК АРГУМЕНТОВ ИСПРАВЛЕН)
  if (app.get("env") === "development") {
    await setupVite(server, app); 
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
