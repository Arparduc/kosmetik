/**
 * Migráló script a hardcoded szolgáltatások Firestore-ba való mentésére
 * Ez a script egyszer futtatható le az admin felületen keresztül
 */

import { saveService } from "./firebase";
import { slugify } from "./utils";

const hardcodedServices = [
  // Alap kezelések
  {
    label: "Szemöldökigazítás",
    price: 1000,
    duration: 15,
    category: "Alap kezelések",
  },
  {
    label: "Szemöldökfestés",
    price: 1500,
    duration: 15,
    category: "Alap kezelések",
  },
  {
    label: "Szempillafestés",
    price: 1500,
    duration: 20,
    category: "Alap kezelések",
  },
  {
    label: "Bajuszgyanta",
    price: 500,
    duration: 5,
    category: "Alap kezelések",
  },
  {
    label: "Arcgyanta",
    price: 800,
    duration: 10,
    category: "Alap kezelések",
  },

  // Gyantázás
  {
    label: "Hónaljgyanta",
    price: 1500,
    duration: 10,
    category: "Gyantázás",
  },
  {
    label: "Kargyanta (félig)",
    price: 2000,
    duration: 10,
    category: "Gyantázás",
  },
  {
    label: "Kargyanta (teljes)",
    price: 2500,
    duration: 15,
    category: "Gyantázás",
  },
  {
    label: "Lábszárgyanta",
    price: 2200,
    duration: 10,
    category: "Gyantázás",
  },
  {
    label: "Lábgyanta (teljes)",
    price: 3800,
    duration: 20,
    category: "Gyantázás",
  },
  {
    label: "Bikinivonalgyanta",
    price: 2500,
    duration: 10,
    category: "Gyantázás",
  },
  {
    label: "Teljes fazon gyanta",
    price: 4000,
    duration: 30,
    category: "Gyantázás",
  },
  {
    label: "Hasgyanta",
    price: 4000,
    duration: 10,
    category: "Gyantázás",
  },
  {
    label: "Férfi hátgyanta",
    price: 3500,
    duration: 15,
    category: "Gyantázás",
  },
  {
    label: "Férfi mellkasgyanta",
    price: 3500,
    duration: 10,
    category: "Gyantázás",
  },

  // Masszírozás
  {
    label: "Arcmasszázs",
    price: 5000,
    duration: 25,
    category: "Masszírozás",
  },
  {
    label: "Arc- és dekoltázsmasszázs",
    price: 6000,
    duration: 25,
    category: "Masszírozás",
  },
  {
    label: "Masszázs kezelésben",
    price: 2000,
    duration: 25,
    category: "Masszírozás",
  },

  // Arckezelések
  {
    label: "Radír + maszk",
    price: 3500,
    duration: 15,
    category: "Arckezelések",
  },
  {
    label: "Tini kezelés",
    price: 8000,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "Tisztító kezelés",
    price: 10000,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "Glycopure kezelés",
    price: 9500,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "Bioplasma kezelés",
    price: 11500,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "Nutri-Peptide kezelés",
    price: 12500,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "Ester C kezelés",
    price: 13500,
    duration: 60,
    category: "Arckezelések",
  },
  {
    label: "New Age G4 kezelés",
    price: 17000,
    duration: 60,
    category: "Arckezelések",
  },
];

export async function migrateServicesToFirestore() {
  console.log("🔄 Szolgáltatások migrálása megkezdve...");
  console.log("📊 Összes szolgáltatás száma:", hardcodedServices.length);
  let successCount = 0;
  let errorCount = 0;

  for (const service of hardcodedServices) {
    try {
      const serviceData = {
        slug: slugify(service.label),
        label: service.label,
        price: service.price,
        duration: service.duration,
        category: service.category,
        active: true,
      };

      console.log("💾 Mentés kísérlet:", serviceData);
      await saveService(serviceData);
      successCount++;
      console.log(`✅ Mentve: ${service.label}`);
    } catch (err) {
      errorCount++;
      console.error(`❌ Hiba mentés közben (${service.label}):`, err);
      console.error("📋 Hiba részletei:", err.message, err.code);
    }
  }

  console.log(`\n✅ Migráció befejezve!`);
  console.log(`   Sikeres: ${successCount}`);
  console.log(`   Sikertelen: ${errorCount}`);

  return { success: successCount, error: errorCount };
}
