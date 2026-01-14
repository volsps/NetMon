import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // === SITES (ОБЪЕКТЫ) ===
  app.get("/api/sites", async (_req, res) => {
    const sites = await storage.getAllSites();
    res.json(sites);
  });

  app.get("/api/sites/:id", async (req, res) => {
    const site = await storage.getSiteDetails(Number(req.params.id));
    if (!site) return res.status(404).json({ message: "Объект не найден" });
    res.json(site);
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const data = api.sites.create.input.parse(req.body);
      const site = await storage.createSite(data);
      res.json(site);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.patch("/api/sites/:id", async (req, res) => {
    const updated = await storage.updateSite(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Объект не найден" });
    res.json(updated);
  });

  app.delete("/api/sites/:id", async (req, res) => {
    await storage.deleteSite(Number(req.params.id));
    res.sendStatus(204);
  });

  // === SWITCHES (СВИТЧИ) ===
  app.post("/api/switches", async (req, res) => {
    const sw = await storage.createSwitch(req.body);
    res.json(sw);
  });

  app.patch("/api/switches/:id", async (req, res) => {
    const updated = await storage.updateSwitch(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/switches/:id", async (req, res) => {
    // В storage.ts нужно будет добавить deleteSwitch, если его нет
    await storage.deleteSwitch(Number(req.params.id));
    res.sendStatus(204);
  });

  // === ACCESS POINTS (ТОЧКИ ДОСТУПА) ===
  app.post("/api/access-points", async (req, res) => {
    const ap = await storage.createAccessPoint(req.body);
    res.json(ap);
  });

  app.patch("/api/access-points/:id", async (req, res) => {
    const updated = await storage.updateAP(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/access-points/:id", async (req, res) => {
    await storage.deleteAP(Number(req.params.id));
    res.sendStatus(204);
  });

  // === GLOBAL SEARCH ===
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const results = await storage.searchGlobal(query);
    res.json(results);
  });

}
