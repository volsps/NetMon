import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existing = await storage.getAllSites();
  if (existing.length > 0) return;

  console.log("Seeding database with network data...");

  // Site 1: NY Office
  const nySite = await storage.createSite({
    name: "HQ - New York",
    region: "North America",
    city: "New York",
    address: "1 World Trade Center, NY",
    lat: 40.7128,
    lng: -74.0060,
    routerIp: "10.0.0.1",
    routerMac: "00:1A:2B:3C:4D:5E",
    routerModel: "Cisco ISR 4451",
    status: "online"
  });

  const nySwitch1 = await storage.createSwitch({
    siteId: nySite.id,
    name: "Core Switch 01",
    ip: "10.0.0.2",
    mac: "00:1A:2B:3C:4D:5F",
    model: "Cisco Catalyst 9300",
    status: "online"
  });

  const nySwitch2 = await storage.createSwitch({
    siteId: nySite.id,
    name: "Access Switch 01 (Floor 24)",
    ip: "10.0.0.3",
    mac: "00:1A:2B:3C:4D:60",
    model: "Cisco Catalyst 9200",
    status: "online"
  });

  // APs for NY
  await storage.createAccessPoint({ switchId: nySwitch1.id, siteId: nySite.id, name: "AP-Lobby-01", ip: "10.0.0.101", mac: "AA:BB:CC:00:00:01", model: "Meraki MR46", status: "online" });
  await storage.createAccessPoint({ switchId: nySwitch1.id, siteId: nySite.id, name: "AP-Lobby-02", ip: "10.0.0.102", mac: "AA:BB:CC:00:00:02", model: "Meraki MR46", status: "online" });
  await storage.createAccessPoint({ switchId: nySwitch2.id, siteId: nySite.id, name: "AP-Office-24A", ip: "10.0.0.103", mac: "AA:BB:CC:00:00:03", model: "Meraki MR56", status: "online" });
  await storage.createAccessPoint({ switchId: nySwitch2.id, siteId: nySite.id, name: "AP-Office-24B", ip: "10.0.0.104", mac: "AA:BB:CC:00:00:04", model: "Meraki MR56", status: "warning" });
  await storage.createAccessPoint({ switchId: nySwitch2.id, siteId: nySite.id, name: "AP-ConfRoom-A", ip: "10.0.0.105", mac: "AA:BB:CC:00:00:05", model: "Meraki MR56", status: "online" });

  // Site 2: London Branch
  const ldnSite = await storage.createSite({
    name: "Branch - London",
    region: "Europe",
    city: "London",
    address: "30 St Mary Axe, London",
    lat: 51.5145,
    lng: -0.0803,
    routerIp: "172.16.0.1",
    routerMac: "00:50:56:C0:00:01",
    routerModel: "Juniper SRX340",
    status: "online"
  });

  const ldnSwitch1 = await storage.createSwitch({
    siteId: ldnSite.id,
    name: "Main Switch",
    ip: "172.16.0.2",
    mac: "00:50:56:C0:00:02",
    model: "Juniper EX2300",
    status: "online"
  });

  await storage.createAccessPoint({ switchId: ldnSwitch1.id, siteId: ldnSite.id, name: "AP-LDN-01", ip: "172.16.0.101", mac: "BB:CC:DD:11:11:11", model: "Ubiquiti U6-Pro", status: "online" });
  await storage.createAccessPoint({ switchId: ldnSwitch1.id, siteId: ldnSite.id, name: "AP-LDN-02", ip: "172.16.0.102", mac: "BB:CC:DD:11:11:12", model: "Ubiquiti U6-Pro", status: "offline" });
  
  // Site 3: Tokyo Branch
  const tkySite = await storage.createSite({
    name: "Branch - Tokyo",
    region: "Asia Pacific",
    city: "Tokyo",
    address: "Roppongi Hills Mori Tower",
    lat: 35.6605,
    lng: 139.7292,
    routerIp: "192.168.50.1",
    routerMac: "00:0C:29:AB:CD:EF",
    routerModel: "Cisco ISR 1100",
    status: "warning"
  });
  
  const tkySwitch1 = await storage.createSwitch({
     siteId: tkySite.id,
     name: "SW-Floor-10",
     ip: "192.168.50.2",
     mac: "00:0C:29:AB:CD:F0",
     model: "Cisco Catalyst 1000",
     status: "online"
  });

  await storage.createAccessPoint({ switchId: tkySwitch1.id, siteId: tkySite.id, name: "AP-TKY-101", ip: "192.168.50.10", mac: "CC:DD:EE:22:22:01", model: "Cisco Aironet 1850", status: "online" });

  console.log("Database seeded successfully.");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await seedDatabase();

  app.get(api.sites.list.path, async (req, res) => {
    const sites = await storage.getAllSites();
    res.json(sites);
  });

  app.get(api.sites.get.path, async (req, res) => {
    const site = await storage.getSiteDetails(Number(req.params.id));
    if (!site) return res.status(404).json({ message: "Site not found" });
    res.json(site);
  });

  app.post(api.sites.create.path, async (req, res) => {
    try {
      const { site, switches: sws, accessPoints: aps } = api.sites.create.input.parse(req.body);
      
      const newSite = await storage.createSite(site);
      
      const createdSwitches = [];
      for (const sw of sws) {
        const newSw = await storage.createSwitch({ ...sw, siteId: newSite.id });
        createdSwitches.push(newSw);
      }
      
      for (const ap of aps) {
        const sw = createdSwitches[ap.switchIndex];
        await storage.createAccessPoint({
          name: ap.name,
          ip: ap.ip,
          mac: ap.mac,
          model: ap.model,
          status: ap.status,
          siteId: newSite.id,
          switchId: sw.id
        });
      }
      
      res.status(201).json(newSite);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.sites.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = api.sites.update.input.parse(req.body);
      const updated = await storage.updateSite(id, updates);
      if (!updated) return res.status(404).json({ message: "Site not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.search.global.path, async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);
    
    const results = await storage.searchGlobal(query);
    res.json(results);
  });

  return httpServer;
}
