import fs from "fs";
import https from "https";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URLS = {
  businessCards: "https://test-directory.peppol.eu/export/businesscards-csv",
  participants: "https://test-directory.peppol.eu/export/participants-csv"
};

// Dosya yolları - ana dizinden başlayarak
const CSV_PATHS = {
  businessCards: path.join(__dirname, "../src/app/data/directory-export-business-cards.csv"),
  participants: path.join(__dirname, "../src/app/data/directory-export-participants.csv")
};

const DB_PATH = path.join(__dirname, "../src/app/data/participants.db");

// data klasörünü kontrol et ve oluştur
function ensureDataDirectory() {
  const dataDir = path.join(__dirname, "../src/app/data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }
}

// CSV dosyasını indir
async function downloadCSV(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(filePath)}`);
        resolve();
      });
      
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Veritabanını oluştur
async function buildDatabase() {
  console.log("🚀 Starting database build process...");
  
  try {
    // Data klasörünü oluştur
    ensureDataDirectory();
    
    // CSV dosyalarını indir
    await downloadCSV(CSV_URLS.businessCards, CSV_PATHS.businessCards);
    await downloadCSV(CSV_URLS.participants, CSV_PATHS.participants);
    
    // Veritabanını oluştur
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    
    // Tabloyu oluştur
    await db.exec(`
      DROP TABLE IF EXISTS participants;
      
      CREATE TABLE participants (
        full_pid TEXT PRIMARY KEY,
        scheme_id TEXT,
        endpoint_id TEXT,
        supports_invoice BOOLEAN,
        supports_creditnote BOOLEAN,
        company_name TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_endpoint_id ON participants(endpoint_id);
      CREATE INDEX idx_scheme_id ON participants(scheme_id);
    `);
    
    console.log("🗃️ Database table created");
    
    // Business cards CSV'sini işle
    await processBusinessCardsCSV(db);
    
    await db.close();
    console.log("🎉 Database build completed successfully!");
    
  } catch (error) {
    console.error("❌ Database build failed:", error);
    throw error;
  }
}

// Business cards CSV'sini işle
async function processBusinessCardsCSV(db) {
  // Dynamic import for csv-parser
  const csvModule = await import('csv-parser');
  const csv = csvModule.default;
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    console.log("📊 Processing business cards CSV...");
    
    fs.createReadStream(CSV_PATHS.businessCards)
      .pipe(csv({ 
        separator: ";",
        skipEmptyLines: true,
        quote: '"',
        headers: [
          'participant_id',
          'names',
          'identifier_schemes',
          'identifier_values',
          'document_types',
          'process_ids',
          'transport_profiles',
          'environment'
        ]
      }))
      .on('data', (data) => {
        try {
          const scheme = data.identifier_schemes;
          const value = data.identifier_values;
          const docField = data.document_types || "";
          const companyName = data.names || "Unknown";

          if (!scheme || !value || scheme.trim() === "" || value.trim() === "") return;

          const [schemeId, endpointId] = value.split(":");
          if (!schemeId || !endpointId) return;

          const fullPid = `${schemeId}:${endpointId}`;
          const supportsInvoice = docField.includes("Invoice-2::Invoice") || docField.includes("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2");
          const supportsCredit = docField.includes("CreditNote-2::CreditNote") || docField.includes("urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2");

          results.push({
            full_pid: fullPid,
            scheme_id: schemeId,
            endpoint_id: endpointId,
            supports_invoice: supportsInvoice ? 1 : 0,
            supports_creditnote: supportsCredit ? 1 : 0,
            company_name: companyName
          });
        } catch (err) {
          console.warn("⚠️ CSV parse warning:", err.message);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${results.length} records...`);
          
          // Batch insert
          const BATCH_SIZE = 500;
          for (let i = 0; i < results.length; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?)").join(",");
            const values = batch.flatMap(row => [
              row.full_pid,
              row.scheme_id,
              row.endpoint_id,
              row.supports_invoice,
              row.supports_creditnote,
              row.company_name
            ]);
            
            await db.run(
              `INSERT INTO participants VALUES ${placeholders}`,
              values
            );
            
            console.log(`✅ Processed ${Math.min(i + BATCH_SIZE, results.length)}/${results.length} records...`);
          }
          
          console.log(`🗃️ Inserted ${results.length} records into database`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Build script'ini çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  buildDatabase().catch(console.error);
}

export { buildDatabase };