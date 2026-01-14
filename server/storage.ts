import { db } from "./db";
import {
  sites, switches, accessPoints,
  type Site, type Switch, type AccessPoint,
  type SiteWithDetails
} from "@shared/schema";
import { eq, like, or } from "drizzle-orm";

export interface IStorage {
  getAllSites(): Promise<Site[]>;
  getSiteDetails(id: number): Promise<SiteWithDetails | undefined>;
  searchGlobal(query: string): Promise<Array<{ id: number, type: 'site' | 'switch' | 'ap', name: string, detail: string, siteId: number }>>;
  createSite(site: any): Promise<Site>;
  createSwitch(sw: any): Promise<Switch>;
  createAccessPoint(ap: any): Promise<AccessPoint>;
  updateSite(id: number, updates: Partial<any>): Promise<Site | undefined>;
  updateSwitch(id: number, updates: Partial<any>): Promise<Switch | undefined>;
  updateAP(id: number, updates: Partial<any>): Promise<AccessPoint | undefined>;
  deleteSite(id: number): Promise<void>;
  deleteSwitch(id: number): Promise<void>; // Добавили
  deleteAP(id: number): Promise<void>;     // Добавили
}

export class DatabaseStorage implements IStorage {
  async getAllSites(): Promise<Site[]> {
    return await db.select().from(sites);
  }

  async getSiteDetails(id: number): Promise<SiteWithDetails | undefined> {
    const site = await db.select().from(sites).where(eq(sites.id, id)).then(res => res[0]);
    if (!site) return undefined;
    const siteSwitches = await db.select().from(switches).where(eq(switches.siteId, id));
    const siteAPs = await db.select().from(accessPoints).where(eq(accessPoints.siteId, id));
    const switchesWithAPs = siteSwitches.map(sw => ({
      ...sw,
      accessPoints: siteAPs.filter(ap => ap.switchId === sw.id)
    }));
    return { ...site, switches: switchesWithAPs, accessPoints: siteAPs };
  }

  async searchGlobal(query: string): Promise<any[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const results: any[] = [];
    const foundSites = await db.select().from(sites).where(or(like(sites.name, lowerQuery), like(sites.address, lowerQuery))).limit(5);
    foundSites.forEach(s => results.push({ id: s.id, type: 'site', name: s.name, detail: s.address, siteId: s.id }));
    return results;
  }

  async createSite(site: any): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }
  async createSwitch(sw: any): Promise<Switch> {
    const [newSwitch] = await db.insert(switches).values(sw).returning();
    return newSwitch;
  }
  async createAccessPoint(ap: any): Promise<AccessPoint> {
    const [newAp] = await db.insert(accessPoints).values(ap).returning();
    return newAp;
  }

  async updateSite(id: number, updates: Partial<any>): Promise<Site | undefined> {
    const [updated] = await db.update(sites).set(updates).where(eq(sites.id, id)).returning();
    return updated;
  }
  async updateSwitch(id: number, updates: Partial<any>): Promise<Switch | undefined> {
    const [updated] = await db.update(switches).set(updates).where(eq(switches.id, id)).returning();
    return updated;
  }
  async updateAP(id: number, updates: Partial<any>): Promise<AccessPoint | undefined> {
    const [updated] = await db.update(accessPoints).set(updates).where(eq(accessPoints.id, id)).returning();
    return updated;
  }

  async deleteSite(id: number): Promise<void> {
    await db.delete(accessPoints).where(eq(accessPoints.siteId, id));
    await db.delete(switches).where(eq(switches.siteId, id));
    await db.delete(sites).where(eq(sites.id, id));
  }

  async deleteSwitch(id: number): Promise<void> {
    await db.delete(accessPoints).where(eq(accessPoints.switchId, id));
    await db.delete(switches).where(eq(switches.id, id));
  }

  async deleteAP(id: number): Promise<void> {
    await db.delete(accessPoints).where(eq(accessPoints.id, id));
  }
}

export const storage = new DatabaseStorage();
