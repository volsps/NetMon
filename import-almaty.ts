// scripts/import-all-csv.ts
import { db } from "../server/db.js";
import { sites, switches } from "../shared/schema.ts";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

// Соответствие ваших файлов регионам и городам
const fileInfo: { [key: string]: { city: string, region: string, lat: number, lng: number } } = {
  "Karagandy": { city: "Karagandy", region: "17", lat: 49.8344, lng: 73.0866 },
  "Konaev": { city: "Konaev", region: "85", lat: 43.3086, lng: 76.9175 },
  "Kyzylorda": { city: "Kyzylorda", region: "31", lat: 44.8524, lng: 65.5084 },
  "Semey": { city: "Semey", region: "37", lat: 50.4267, lng: 80.2363 },
  "Ust-Kamenogorsk": { city: "Ust-Kamenogorsk", region: "35", lat: 49.9668, lng: 82.5944 },
  "Zhetigen": { city: "Zhetigen", region: "02", lat: 43.4333, lng: 77.0667 },
  "Актау": { city: "Aktau", region: "43", lat: 43.6500, lng: 51.1700 },
  "Актобе": { city: "Aktobe", region: "23", lat: 50.2839, lng: 57.1694 },
  "Астана": { city: "Astana", region: "71", lat: 51.1694, lng: 71.4491 },
  "Атырау": { city: "Atyrau", region: "25", lat: 47.0931, lng: 51.9233 },
  "Кокшетау": { city: "Kokshetau", region: "27", lat: 53.2833, lng: 69.4000 },
  "Пограничные пункты": { city: "Border Points", region: "99", lat: 48.0196, lng: 66.9237 },
  "Тараз": { city: "Taraz", region: "33", lat: 42.9000, lng: 71.3667 },
  "Туркестан": { city: "Turkestan", region: "87", lat: 43.2684, lng: 68.2684 },
  "Хоргос": { city: "Khorgos", region: "07", lat: 44.2419, lng: 80.4181 },
  "Шымкент": { city: "Shymkent", region: "79", lat: 42.3000, lng: 69.6000 }
};

function getFileInfo(filename: string) {
  for (const [key, info] of Object.entries(fileInfo)) {
    if (filename.includes(key)) {
      return info;
    }
  }
  return { city: "Unknown", region: "99", lat: 43.2389, lng: 76.8897 };
}

async function importAllCSVFiles() {
  console.log("🚀 Запуск импорта всех CSV файлов...");
  
  const importDir = "./importcsv";
  
  if (!fs.existsSync(importDir)) {
    console.error(`❌ Папка ${importDir} не найдена!`);
    process.exit(1);
  }

  const csvFiles = fs.readdirSync(importDir).filter(file => file.endsWith('.csv'));
  console.log(`📁 Найдено ${csvFiles.length} CSV файлов`);

  for (const csvFile of csvFiles) {
    console.log(`\n📄 Обработка файла: ${csvFile}`);
    
    const filePath = path.join(importDir, csvFile);
    const fileData = getFileInfo(csvFile);
    const { city, region, lat, lng } = fileData;
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const records = parse(fileContent, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true,
        delimiter: ','
      });

      console.log(`📊 Обработка ${records.length} записей для ${city}...`);

      for (const record of records) {
        const objectName = record['Customer']?.trim() || record['Объект']?.trim();
        const routerIP = record['Router IP']?.trim() || record['router']?.trim();
        const switchIP = record['Switch IP']?.trim() || record['switch']?.trim();
        const address = record['Address']?.trim() || record['Адрес']?.trim();

        if (!objectName || objectName === '№' || objectName === 'Customer') continue;

        try {
          const networkType = objectName.includes('B2B') ? 'B2B' : 'OWF';
          const firstRouterIP = routerIP ? routerIP.split(' ')[0].split('/')[0] : "0.0.0.0";

          // Создаем или находим сайт
          let site = await db.query.sites.findFirst({
            where: eq(sites.name, objectName)
          });

          if (!site) {
            [site] = await db.insert(sites).values({
              name: objectName,
              region: region,
              city: city,
              address: address || "",
              lat: lat,
              lng: lng,
              routerIp: firstRouterIP,
              routerMac: "00:00:00:00:00:00",
              routerModel: "Router",
              status: "online",
              networkType: networkType
            }).returning();
            console.log(`✅ Создан объект: ${objectName} (${city})`);
          }

          // Обрабатываем свитчи
          if (switchIP && switchIP !== '') {
            const switchList = switchIP.split(/[,;]+/).map(s => s.trim()).filter(s => s);
            
            for (const switchItem of switchList) {
              let switchAddr = '';
              let switchName = '';
              
              const match = switchItem.match(/^(\d+\.\d+\.\d+\.\d+)/);
              if (match) {
                switchAddr = match[1];
                const nameMatch = switchItem.match(/\(([^)]+)\)/);
                switchName = nameMatch ? nameMatch[1] : `SW-${switchAddr}`;
              } else {
                continue;
              }

              let sw = await db.query.switches.findFirst({
                where: eq(switches.ip, switchAddr)
              });

              if (!sw) {
                [sw] = await db.insert(switches).values({
                  siteId: site.id,
                  name: switchName,
                  ip: switchAddr,
                  mac: "00:00:00:00:00:00",
                  model: "Switch",
                  status: "online"
                }).returning();
                console.log(`  📦 Добавлен свитч: ${switchName} (${switchAddr})`);
              }
            }
          }

        } catch (error) {
          console.error(`❌ Ошибка при обработке объекта ${objectName}:`, error.message);
        }
      }

      console.log(`✅ Файл ${csvFile} успешно обработан!`);

    } catch (error) {
      console.error(`❌ Ошибка при обработке файла ${csvFile}:`, error.message);
    }
  }

  console.log("\n🏁 Импорт всех CSV файлов завершен!");
  process.exit(0);
}

importAllCSVFiles();
