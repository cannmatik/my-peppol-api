import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 ATOMIC Build Starting...");

const CSV_URLS = {
  businessCards: "https://test-directory.peppol.eu/export/businesscards-csv"
};

const CSV_PATHS = {
  businessCards: path.join(__dirname, "../src/app/data/directory-export-business-cards.csv")
};

async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function downloadCSV(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function buildDatabase() {
  let client;
  
  try {
    console.log("🔗 Connecting to Neon...");
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // CSV indir
    await downloadCSV(CSV_URLS.businessCards, CSV_PATHS.businessCards);

    // 1. ÖNCE participants2 TABLOSUNU OLUŞTUR
    console.log("🗄️ Creating participants2 table...");
    await client.query('DROP TABLE IF EXISTS participants2');
    
    await client.query(`
      CREATE TABLE participants2 (
        id SERIAL PRIMARY KEY,
        full_pid VARCHAR(255) UNIQUE NOT NULL,
        scheme_id VARCHAR(50) NOT NULL,
        endpoint_id VARCHAR(255) NOT NULL,
        supports_invoice BOOLEAN DEFAULT FALSE,
        supports_creditnote BOOLEAN DEFAULT FALSE,
        company_name TEXT,
        raw_document_types TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("📊 Processing CSV into participants2...");
    
    // CSV'yi işle - BATCH INSERT ile participants2'ye
    const csvModule = await import('csv-parser');
    const csv = csvModule.default;
    
    const batchSize = 500;
    let currentBatch = [];
    let totalProcessed = 0;
    const seenPids = new Set();

    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATHS.businessCards)
        .pipe(csv({ 
          separator: ";",
          skipEmptyLines: true,
          quote: '"'
        }))
        .on('data', (data) => {
          try {
            const scheme = data["Identifier schemes"];
            const value = data["Identifier values"];
            const docField = data["Document types"] || "";
            const companyName = data["Names"] || "Unknown";

            if (!scheme || !value) return;

            const [schemeId, endpointId] = value.split(":");
            if (!schemeId || !endpointId) return;

            const fullPid = `${schemeId}:${endpointId}`;

            // Duplicate kontrolü
            if (seenPids.has(fullPid)) return;
            seenPids.add(fullPid);

            const supportsInvoice = docField.includes("Invoice-2::Invoice");
            const supportsCredit = docField.includes("CreditNote-2::CreditNote");

            currentBatch.push({
              full_pid: fullPid,
              scheme_id: schemeId,
              endpoint_id: endpointId,
              supports_invoice: supportsInvoice,
              supports_creditnote: supportsCredit,
              company_name: companyName,
              raw_document_types: docField
            });

            // Batch dolunca insert et
            if (currentBatch.length >= batchSize) {
              processBatch([...currentBatch], client);
              currentBatch = [];
            }

          } catch (error) {
            console.warn("⚠️ Data processing warning:", error.message);
          }
        })
        .on('end', async () => {
          // Son batch'i işle
          if (currentBatch.length > 0) {
            await processBatch(currentBatch, client);
          }
          resolve();
        })
        .on('error', reject);
    });

    console.log(`✅ Processed ${totalProcessed} records into participants2`);

    // 2. ATOMIC SWAP: participants2 -> participants
    console.log("🔄 Performing atomic swap...");
    await client.query('DROP TABLE IF EXISTS participants_old');
    await client.query('ALTER TABLE IF EXISTS participants RENAME TO participants_old');
    await client.query('ALTER TABLE participants2 RENAME TO participants');
    
    // 3. INDEX'LERİ OLUŞTUR
    console.log("📈 Creating indexes...");
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_full_pid ON participants(full_pid)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_endpoint_id ON participants(endpoint_id)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_scheme_id ON participants(scheme_id)');

    // 4. TEMİZLİK
    console.log("🧹 Cleaning up...");
    await client.query('DROP TABLE IF EXISTS participants_old');
    
    console.log("🎉 ATOMIC UPDATE COMPLETED!");

  } catch (error) {
    console.error("💥 Error:", error);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected");
    }
    // CSV temizle
    try {
      fs.unlinkSync(CSV_PATHS.businessCards);
      console.log("🧹 Cleaned up CSV");
    } catch (e) {}
  }
}

// Batch insert fonksiyonu
async function processBatch(batch, client) {
  if (batch.length === 0) return;
  
  const placeholders = batch.map((_, batchIndex) => {
    const offset = batchIndex * 6;
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

  try {
    await client.query(
      `INSERT INTO participants2 
       (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name) 
       VALUES ${placeholders}`,
      values
    );
    console.log(`✅ Batch inserted: ${batch.length} records`);
  } catch (error) {
    console.error("❌ Batch insert failed, trying one-by-one...");
    // Batch başarısız olursa tek tek dene
    for (const row of batch) {
      try {
        await client.query(
          `INSERT INTO participants2 
           (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [row.full_pid, row.scheme_id, row.endpoint_id, row.supports_invoice, row.supports_creditnote, row.company_name]
        );
      } catch (singleError) {
        console.log(`⚠️ Skipped duplicate: ${row.full_pid}`);
      }
    }
  }
}

// Çalıştır
buildDatabase().catch(console.error);