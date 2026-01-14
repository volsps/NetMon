import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  routerIp: text("router_ip").notNull(),
  routerMac: text("router_mac").notNull(),
  routerModel: text("router_model").notNull(),
  status: text("status").notNull().default("online"), // online, offline, warning
});

export const switches = pgTable("switches", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  mac: text("mac").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull().default("online"),
});

export const accessPoints = pgTable("access_points", {
  id: serial("id").primaryKey(),
  switchId: integer("switch_id").notNull(), // Connected to a specific switch
  siteId: integer("site_id").notNull(),     // Denormalized for easier querying
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  mac: text("mac").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull().default("online"),
});

// === RELATIONS ===

export const sitesRelations = relations(sites, ({ many }) => ({
  switches: many(switches),
  accessPoints: many(accessPoints),
}));

export const switchesRelations = relations(switches, ({ one, many }) => ({
  site: one(sites, {
    fields: [switches.siteId],
    references: [sites.id],
  }),
  accessPoints: many(accessPoints),
}));

export const accessPointsRelations = relations(accessPoints, ({ one }) => ({
  switch: one(switches, {
    fields: [accessPoints.switchId],
    references: [switches.id],
  }),
  site: one(sites, {
    fields: [accessPoints.siteId],
    references: [sites.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertSiteSchema = createInsertSchema(sites);
export const insertSwitchSchema = createInsertSchema(switches);
export const insertAccessPointSchema = createInsertSchema(accessPoints);

export type Site = typeof sites.$inferSelect;
export type Switch = typeof switches.$inferSelect;
export type AccessPoint = typeof accessPoints.$inferSelect;

// Response types for the frontend
export type SiteWithDetails = Site & {
  switches: (Switch & { accessPoints: AccessPoint[] })[];
  accessPoints: AccessPoint[]; // All APs for the site flat list if needed
};
// ... (после всех таблиц sites, switches, accessPoints и схем insertSiteSchema)

export const api = {
  sites: {
    create: {
      input: insertSiteSchema,
    },
    update: {
      input: insertSiteSchema.partial(),
    }
  },
  switches: {
    create: {
      input: insertSwitchSchema,
    }
  },
  accessPoints: {
    create: {
      input: insertAccessPointSchema,
    }
  }
};
