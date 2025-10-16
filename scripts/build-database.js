import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URLS = {
  businessCards: "https://test-directory.peppol.eu/export/businesscards-csv",
  participants: "https://test-directory.peppol.eu/export/participants-csv"
};

const CSV_PATHS = {
  businessCards: path.join(__dirname, "../src/app/data/directory-export-business-cards.csv"),
  participants: path.join(__dirname, "../src/app/data/directory-export-participants.csv")
};

// data klasörünü oluştur
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
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

// Neon database'e bağlan
async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('NEON_DATABASE_URL environment variable is required');
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  return client;
}

// Schema'yı oluştur
async function createSchema(client) {
  console.log("🗄️ Creating database schema...");
  
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      full_pid VARCHAR(255) UNIQUE NOT NULL,
      scheme_id VARCHAR(50) NOT NULL,
      endpoint_id VARCHAR(255) NOT NULL,
      supports_invoice BOOLEAN DEFAULT FALSE,
      supports_creditnote BOOLEAN DEFAULT FALSE,
      company_name TEXT,
      raw_document_types TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_participants_full_pid ON participants(full_pid);
    CREATE INDEX IF NOT EXISTS idx_participants_endpoint_id ON participants(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_participants_scheme_id ON participants(scheme_id);
    CREATE INDEX IF NOT EXISTS idx_participants_supports_invoice ON participants(supports_invoice);
    CREATE INDEX IF NOT EXISTS idx_participants_supports_creditnote ON participants(supports_creditnote);
  `;

  await client.query(schemaSQL);
  console.log("✅ Database schema created");
}

// CSV'yi process et ve Neon'a yükle
async function processCSVToNeon(client) {
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
        mapHeaders: ({ header }) => header.trim()
      }))
      .on('data', (data) => {
        try {
          const scheme = data["Identifier schemes"];
          const value = data["Identifier values"];
          const docField = data["Document types"] || "";
          const companyName = data["Names"] || "Unknown";

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
            supports_invoice: supportsInvoice,
            supports_creditnote: supportsCredit,
            company_name: companyName,
            raw_document_types: docField
          });
        } catch (err) {
          console.warn("⚠️ CSV parse warning:", err.message);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${results.length} records...`);
          
          // Batch insert
          const BATCH_SIZE = 100;
          for (let i = 0; i < results.length; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            
            const placeholders = batch.map((_, index) => {
              const offset = index * 6;
              return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
            }).join(",");
            
            const values = batch.flatMap(row => [
              row.full_pid,
              row.scheme_id,
              row.endpoint_id,
              row.supports_invoice,
              row.supports_creditnote,
              row.company_name
            ]);
            
            const query = `
              INSERT INTO participants 
              (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name) 
              VALUES ${placeholders}
              ON CONFLICT (full_pid) 
              DO UPDATE SET
                supports_invoice = EXCLUDED.supports_invoice,
                supports_creditnote = EXCLUDED.supports_creditnote,
                company_name = EXCLUDED.company_name,
                updated_at = CURRENT_TIMESTAMP
            `;
            
            await client.query(query, values);
            console.log(`✅ Processed ${Math.min(i + BATCH_SIZE, results.length)}/${results.length} records...`);
          }
          
          console.log(`🎉 Inserted/updated ${results.length} records into Neon database`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Neon database build
async function buildNeonDatabase() {
  console.log("🚀 Starting Neon database build process...");
  
  let client;
  
  try {
    // Data klasörünü oluştur
    ensureDataDirectory();
    
    // CSV dosyalarını indir
    console.log("📥 Downloading CSV files...");
    await downloadCSV(CSV_URLS.businessCards, CSV_PATHS.businessCards);
    
    // Neon'a bağlan
    client = await getNeonClient();
    console.log("✅ Connected to Neon database");
    
    // Schema oluştur
    await createSchema(client);
    
    // Verileri yükle
    await processCSVToNeon(client);
    
    console.log("🎉 Neon database build completed successfully!");
    
  } catch (error) {
    console.error("❌ Neon build failed:", error);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected from Neon database");
    }
    
    // Temizlik
    try {
      fs.unlinkSync(CSV_PATHS.businessCards);
      console.log("🧹 Temporary CSV file cleaned up");
    } catch (e) {
      // ignore
    }
  }
}

// Build script'ini çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  buildNeonDatabase().catch(console.error);
}

export { buildNeonDatabase };