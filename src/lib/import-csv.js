import fs from "fs";
import csv from "csv-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function importPeppolCSV() {
  const dbFile = "C:\\Users\\Can Matik\\Desktop\\my-peppol-api\\src\\app\\data\\participants.db";
  const csvFile = "C:\\Users\\Can Matik\\Desktop\\my-peppol-api\\src\\app\\data\\directory-export-business-cards.csv";

  const db = await open({ filename: dbFile, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      full_pid TEXT PRIMARY KEY,
      scheme_id TEXT,
      endpoint_id TEXT,
      supports_invoice BOOLEAN,
      supports_creditnote BOOLEAN
    );
  `);

  console.log("[INFO] Starting CSV import from business cards...");

  const BATCH_SIZE = 500;
  let buffer = [];
  let rowCount = 0;

  const stream = fs.createReadStream(csvFile)
    .pipe(csv({ 
      separator: ";",
      skipEmptyLines: true,
      quote: '"'
    }));

  stream.on("data", async (row) => {
    try {
      const scheme = row["Identifier schemes"];
      const value = row["Identifier values"];
      const docField = row["Document types"] || "";

      if (!scheme || !value || scheme.trim() === "" || value.trim() === "") return;

      const [schemeId, endpointId] = value.split(":");
      if (!schemeId || !endpointId) return;

      const fullPid = `${schemeId}:${endpointId}`;
      const supportsInvoice = docField.includes("Invoice-2::Invoice");
      const supportsCredit = docField.includes("CreditNote-2::CreditNote");

      buffer.push([fullPid, schemeId, endpointId, supportsInvoice ? 1 : 0, supportsCredit ? 1 : 0]);
      rowCount++;

      if (buffer.length >= BATCH_SIZE) {
        const placeholders = buffer.map(() => "(?, ?, ?, ?, ?)").join(",");
        await db.run(`INSERT OR REPLACE INTO participants VALUES ${placeholders}`, buffer.flat());
        console.log(`[INFO] Processed ${rowCount} rows...`);
        buffer = [];
      }
    } catch (err) {
      console.error("[ERROR] CSV parse error:", err.message);
    }
  });

  stream.on("end", async () => {
    if (buffer.length) {
      const placeholders = buffer.map(() => "(?, ?, ?, ?, ?)").join(",");
      await db.run(`INSERT OR REPLACE INTO participants VALUES ${placeholders}`, buffer.flat());
    }
    await db.close();
    console.log(`[INFO] ✅ CSV import finished successfully. Total rows: ${rowCount}`);
  });

  stream.on("error", (err) => {
    console.error("[ERROR] Stream error:", err);
  });
}

importPeppolCSV().catch((err) => console.error("[FATAL]", err));