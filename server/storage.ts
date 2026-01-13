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
  
  // Seeding methods
  createSite(site: any): Promise<Site>;
  createSwitch(sw: any): Promise<Switch>;
  createAccessPoint(ap: any): Promise<AccessPoint>;
  updateSite(id: number, updates: Partial<any>): Promise<Site | undefined>;
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

    return {
      ...site,
      switches: switchesWithAPs,
      accessPoints: siteAPs
    };
  }

  async searchGlobal(query: string): Promise<Array<{ id: number, type: 'site' | 'switch' | 'ap', name: string, detail: string, siteId: number }>> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const results: Array<{ id: number, type: 'site' | 'switch' | 'ap', name: string, detail: string, siteId: number }> = [];

    const foundSites = await db.select().from(sites).where(
      or(
        like(sites.name, lowerQuery),
        like(sites.address, lowerQuery),
        like(sites.routerIp, lowerQuery),
        like(sites.routerMac, lowerQuery)
      )
    ).limit(5);
    
    foundSites.forEach(s => results.push({ id: s.id, type: 'site', name: s.name, detail: s.address, siteId: s.id }));

    const foundSwitches = await db.select().from(switches).where(
      or(
        like(switches.name, lowerQuery),
        like(switches.ip, lowerQuery),
        like(switches.mac, lowerQuery)
      )
    ).limit(5);

    foundSwitches.forEach(s => results.push({ id: s.id, type: 'switch', name: s.name, detail: s.ip, siteId: s.siteId }));

    const foundAPs = await db.select().from(accessPoints).where(
      or(
        like(accessPoints.name, lowerQuery),
        like(accessPoints.ip, lowerQuery),
        like(accessPoints.mac, lowerQuery)
      )
    ).limit(5);

    foundAPs.forEach(s => results.push({ id: s.id, type: 'ap', name: s.name, detail: s.ip, siteId: s.siteId }));

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
}

export const storage = new DatabaseStorage();
