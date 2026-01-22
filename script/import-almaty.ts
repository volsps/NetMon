// scripts/import-access-points.ts
import { db } from "../server/db.js";
import { sites, switches, accessPoints } from "../shared/schema.ts";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { eq, and } from "drizzle-orm";

// Таблица соответствия объектов в ASTANA
const astanaSitesMap: { [key: string]: string } = {
  "Аэропорт": "09-KRG-OWF-Airport",
  "ТРЦ Хан-Шатыр": "01-AST-OWF-KhanShatyr",
  "МегаХолд": "01-AST-OWF-Megahold",
  "Еуразия": "01-AST-OWF-Eurasiya",
  "Сарыарка": "01-AST-OWF-Saryarka",
  "Астана-Арена": "01-AST-OWF-AstanaArena",
  // Добавьте соответствие для всех объектов
};

async function importAccessPoints() {
  console.log("🚀 Запуск импорта точек доступа для Астаны...");
  
  const apFile = "./importAP/WIFI_SUMM(Астана OWF).csv";
  
  if (!fs.existsSync(apFile)) {
    console.error(`❌ Файл ${apFile} не найден!`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(apFile, 'utf8');
  const records = parse(fileContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
    delimiter: ','
  });

  console.log(`📊 Обработка ${records.length} записей...`);

  let currentSite = null;
  let siteId = null;
  let controllerIp = null;

  for (const record of records) {
    const objectName = record['Объект / наименование']?.trim();
    const ipAddress = record['ip address']?.trim();
    const macAddress = record['mac-address']?.trim();
    const model = record['Модель ТД']?.trim();
    const vendor = record['Вендор ТД']?.trim();

    // Если это строка с объектом
    if (objectName && !objectName.match(/^\d+/) && !objectName.includes('Контроллер')) {
      console.log(`\n🏢 Обработка объекта: ${objectName}`);
      
      // Ищем соответствующий сайт в базе
      const siteKey = astanaSitesMap[objectName] || objectName;
      const site = await db.query.sites.findFirst({
        where: eq(sites.name, siteKey)
      });

      if (site) {
        currentSite = site;
        siteId = site.id;
        console.log(`✅ Найден объект: ${site.name} (ID: ${site.id})`);
      } else {
        console.log(`⚠️ Объект не найден: ${objectName}`);
        currentSite = null;
        siteId = null;
      }
      continue;
    }

    // Если это строка с контроллером
    if (objectName && objectName.toLowerCase().includes('контроллер')) {
      controllerIp = ipAddress;
      console.log(`📡 Контроллер: ${controllerIp}`);
      continue;
    }

    // Если это точка доступа
    if (siteId && ipAddress && macAddress) {
      try {
        // Проверяем, существует ли уже точка доступа
        const existingAP = await db.query.accessPoints.findFirst({
          where: eq(accessPoints.mac, macAddress)
        });

        if (!existingAP) {
          // Находим подходящий свитч по IP подсети
          const switchMatch = ipAddress.match(/^(\d+\.\d+\.\d+)\./);
          let switchId = null;
          
          if (switchMatch) {
            const subnet = switchMatch[1];
            const sw = await db.query.switches.findFirst({
              where: and(
                eq(switches.siteId, siteId),
                // LIKE по IP в той же подсети
                // Это нужно будет адаптировать под вашу структуру
              )
            });
            if (sw) switchId = sw.id;
          }

          [ap] = await db.insert(accessPoints).values({
            name: objectName || `AP-${ipAddress}`,
            ip: ipAddress,
            mac: macAddress,
            model: model || "Unknown",
            vendor: vendor || "Unknown",
            switchId: switchId,
            siteId: siteId,
            status: "online"
          }).returning();

          console.log(`  📶 Добавлена точка доступа: ${ap.name} (${ap.ip})`);
        } else {
          console.log(`  ℹ️ Точка доступа уже существует: ${ipAddress}`);
        }

      } catch (error) {
        console.error(`❌ Ошибка при добавлении точки доступа ${ipAddress}:`, error.message);
      }
    }
  }

  console.log("\n🏁 Импорт точек доступа завершен!");
  process.exit(0);
}

importAccessPoints();
