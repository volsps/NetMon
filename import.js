import { db } from "./server/db.js";
import { sites, switches, accessPoints } from "./shared/schema.ts";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

async function run() {
  console.log("🚀 Запуск глубокого импорта (OWF/B2B)...");
  
  if (!fs.existsSync("data.csv")) {
    console.error("❌ Файл data.csv не найден в корне!");
    process.exit(1);
  }

  const fileContent = fs.readFileSync("data.csv");
  const records = parse(fileContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
    delimiter: ';' 
  });

  console.log(`📊 Обработка ${records.length} строк...`);

  for (const r of records) {
    // Чистим ключ Site_Name от возможных скрытых символов (BOM)
    const rawSiteName = r.Site_Name || r['﻿Site_Name'] || "";
    const siteName = rawSiteName.trim();

    if (!siteName) continue;

    // Опрделяем тип: B2B или OWF
    const networkType = siteName.toUpperCase().includes('B2B') ? 'B2B' : 'OWF';

    try {
      // 1. Поиск или создание Сайта
      let site = await db.query.sites.findFirst({
        where: eq(sites.name, siteName)
      });

      if (!site) {
        [site] = await db.insert(sites).values({
          name: siteName,
          networkType: networkType,
          region: (r.Region || "01").trim(),
          city: (r.City || "Almaty").trim(),
          address: (r.Address || "").trim(),
          lat: 43.2389, 
          lng: 76.8897,
          routerIp: r.Router_IP || "0.0.0.0",
          routerMac: "00:00:00:00:00:00",
          routerModel: "Mikrotik",
        }).returning();
      }

      // 2. Поиск или создание Свитча
      let sw = await db.query.switches.findFirst({
        where: eq(switches.ip, r.Switch_IP)
      });

      if (!sw) {
        [sw] = await db.insert(switches).values({
          siteId: site.id,
          name: `SW-${r.Switch_IP}`,
          ip: r.Switch_IP || "0.0.0.0",
          mac: "00:00:00:00:00:00",
          model: "Transit",
        }).returning();
      }

      // 3. Добавление Точки доступа
      await db.insert(accessPoints).values({
        siteId: site.id,
        switchId: sw.id,
        name: r.AP_Name,
        ip: r.AP_IP || "0.0.0.0",
        mac: r.AP_MAC || "00:00:00:00:00:00",
        model: "Ubiquiti",
      });
      
    } catch (e) {
      console.error(`❌ Ошибка на объекте ${siteName}:`, e.message);
    }
  }

  console.log("🏁 Импорт успешно завершен!");
  process.exit(0);
}

run();
