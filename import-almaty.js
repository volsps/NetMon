// import-almaty.js
import { db } from "./server/db.js";
import { sites, switches } from "./shared/schema.ts";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

async function importAlmatyData() {
  console.log("🚀 Запуск импорта данных Алматы...");
  
  const csvFile = "Wi-Fi subnets FTO(Алматы).csv";
  
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ Файл ${csvFile} не найден!`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFile, 'utf8');
  const records = parse(fileContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true,
    delimiter: ','
  });

  console.log(`📊 Обработка ${records.length} записей...`);

  for (const record of records) {
    const objectName = record['Объект']?.trim();
    const routerIP = record['router']?.trim();
    const switchData = record['switch']?.trim();
    const address = record['Адрес']?.trim();

    if (!objectName || objectName === '№') continue; // Пропускаем заголовок

    try {
      // Определяем тип сети (OWF или B2B)
      const networkType = objectName.includes('B2B') ? 'B2B' : 'OWF';

      // Извлекаем первый IP роутера (если их несколько)
      const firstRouterIP = routerIP ? routerIP.split(' ')[0] : "0.0.0.0";

      // 1. Создаем или находим сайт
      let site = await db.query.sites.findFirst({
        where: eq(sites.name, objectName)
      });

      if (!site) {
        [site] = await db.insert(sites).values({
          name: objectName,
          region: "02", // Алматы
          city: "Almaty",
          address: address || "",
          lat: 43.2389, // Координаты Алматы
          lng: 76.8897,
          routerIp: firstRouterIP,
          routerMac: "00:00:00:00:00:00",
          routerModel: "Router",
          status: "online",
          networkType: networkType
        }).returning();
        console.log(`✅ Создан объект: ${objectName}`);
      }

      // 2. Обрабатываем свитчи
      if (switchData && switchData !== '') {
        // Разделяем свитчи по разделителям
        const switchList = switchData.split(/[,;]+/).map(s => s.trim()).filter(s => s);
        
        for (const switchItem of switchList) {
          // Извлекаем IP адрес свитча
          let switchIP = '';
          let switchName = '';
          
          // Форматы: "10.40.66.2", "10.40.66.5(SW4_309)", "10.40.66.101(sw9)"
          const match = switchItem.match(/^(\d+\.\d+\.\d+\.\d+)/);
          if (match) {
            switchIP = match[1];
            // Извлекаем имя из скобок, если есть
            const nameMatch = switchItem.match(/\(([^)]+)\)/);
            switchName = nameMatch ? nameMatch[1] : `SW-${switchIP}`;
          } else {
            // Если IP не найден, пропускаем
            continue;
          }

          // Проверяем, существует ли уже свитч
          let sw = await db.query.switches.findFirst({
            where: eq(switches.ip, switchIP)
          });

          if (!sw) {
            [sw] = await db.insert(switches).values({
              siteId: site.id,
              name: switchName,
              ip: switchIP,
              mac: "00:00:00:00:00:00",
              model: "Switch",
              status: "online"
            }).returning();
            console.log(`  📦 Добавлен свитч: ${switchName} (${switchIP})`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ Ошибка при обработке объекта ${objectName}:`, error.message);
    }
  }

  console.log("🏁 Импорт данных Алматы завершен!");
  process.exit(0);
}

importAlmatyData();
