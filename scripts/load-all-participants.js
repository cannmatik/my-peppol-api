import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 LOAD ALL PARTICIPANTS Starting...");

const CSV_URLS = {
  participants: "https://test-directory.peppol.eu/export/participants-csv"
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

async function loadAllParticipants() {
  let client;
  
  try {
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // 1. PARTICIPANTS_MASTER TABLOSU OLUŞTUR
    console.log("🗄️ Creating participants_master table...");
    await client.query('DROP TABLE IF EXISTS participants_master');
    await client.query(`
      CREATE TABLE participants_master (
        id SERIAL PRIMARY KEY,
        participant_id TEXT NOT NULL,
        scheme_id VARCHAR(50) NOT NULL,
        endpoint_id VARCHAR(255) NOT NULL,
        full_pid VARCHAR(255) NOT NULL,
        country_code VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. PARTICIPANTS CSV'Yİ İNDİR VE YÜKLE
    const csvPath = path.join(__dirname, "../src/app/data/all-participants.csv");
    
    console.log("📥 Downloading participants CSV...");
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(csvPath);
      https.get(CSV_URLS.participants, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log("✅ Participants CSV downloaded");
          resolve();
        });
      }).on('error', reject);
    });

    // 3. CSV'Yİ YÜKLE
    const csvModule = await import('csv-parser');
    const csv = csvModule.default;
    
    let processed = 0;
    const batchSize = 500;
    let currentBatch = [];

    console.log("📊 Loading all participants...");
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', async (data) => {
          try {
            const participantId = data["Participant ID"];
            if (!participantId || !participantId.startsWith("iso6523-actorid-upis::")) return;

            const parts = participantId.split("::");
            if (parts.length !== 2) return;

            const [scheme, endpointId] = parts[1].split(":");
            if (!scheme || !endpointId) return;

            const fullPid = `${scheme}:${endpointId}`;
            const countryCode = endpointId.substring(0, 2).toUpperCase();

            currentBatch.push({
              participant_id: participantId,
              scheme_id: scheme,
              endpoint_id: endpointId,
              full_pid: fullPid,
              country_code: countryCode
            });

            // Batch insert
            if (currentBatch.length >= batchSize) {
              const batchToInsert = [...currentBatch];
              currentBatch = [];
              
              const placeholders = batchToInsert.map((_, i) => {
                const offset = i * 5;
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
              }).join(",");

              const values = batchToInsert.flatMap(row => [
                row.participant_id, row.scheme_id, row.endpoint_id, row.full_pid, row.country_code
              ]);

              await client.query(
                `INSERT INTO participants_master (participant_id, scheme_id, endpoint_id, full_pid, country_code) 
                 VALUES ${placeholders}`,
                values
              );

              processed += batchToInsert.length;
              console.log(`✅ Processed ${processed} participants...`);
            }

          } catch (error) {
            // skip
          }
        })
        .on('end', async () => {
          // Son batch
          if (currentBatch.length > 0) {
            for (const row of currentBatch) {
              try {
                await client.query(
                  `INSERT INTO participants_master (participant_id, scheme_id, endpoint_id, full_pid, country_code) 
                   VALUES ($1, $2, $3, $4, $5)`,
                  [row.participant_id, row.scheme_id, row.endpoint_id, row.full_pid, row.country_code]
                );
                processed++;
              } catch (error) {
                // skip duplicates
              }
            }
          }
          console.log(`🎉 FINISHED: ${processed} participants loaded to master table`);
          resolve();
        })
        .on('error', reject);
    });

    // 4. INDEX'LER
    console.log("📈 Creating indexes...");
    await client.query('CREATE INDEX idx_master_full_pid ON participants_master(full_pid)');
    await client.query('CREATE INDEX idx_master_endpoint_id ON participants_master(endpoint_id)');
    await client.query('CREATE INDEX idx_master_scheme_id ON participants_master(scheme_id)');
    await client.query('CREATE INDEX idx_master_country_code ON participants_master(country_code)');

    // 5. İSTATİSTİKLER
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT scheme_id) as unique_schemes,
        COUNT(DISTINCT country_code) as unique_countries
      FROM participants_master
    `);
    
    console.log("📊 Statistics:", stats.rows[0]);

  } catch (error) {
    console.error("💥 Error:", error);
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected");
    }
    // Temizlik
    try {
      fs.unlinkSync(path.join(__dirname, "../src/app/data/all-participants.csv"));
    } catch (e) {}
  }
}

loadAllParticipants();