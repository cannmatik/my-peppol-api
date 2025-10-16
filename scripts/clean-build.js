import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 CLEAN BUILD Starting...");

async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function cleanBuild() {
  let client;
  
  try {
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // 1. Tüm tabloları temizle
    console.log("🧹 Cleaning all tables...");
    await client.query('DROP TABLE IF EXISTS participants');
    await client.query('DROP TABLE IF EXISTS participants2');
    await client.query('DROP TABLE IF EXISTS participants_old');

    // 2. Yeni participants tablosu oluştur
    console.log("🗄️ Creating fresh participants table...");
    await client.query(`
      CREATE TABLE participants (
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

    // 3. Test için birkaç kayıt ekle
    console.log("📝 Adding test records...");
    const testRecords = [
      ['0208:0418159080', '0208', '0418159080', true, false, 'Test Şirket AŞ'],
      ['9908:123456789', '9908', '123456789', true, true, 'Test Şirket LTD'],
      ['0088:987654321', '0088', '987654321', false, true, 'Diğer Şirket']
    ];

    for (const record of testRecords) {
      await client.query(
        `INSERT INTO participants (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        record
      );
    }

    // 4. Index'leri oluştur
    console.log("📈 Creating indexes...");
    await client.query('CREATE INDEX idx_participants_full_pid ON participants(full_pid)');
    await client.query('CREATE INDEX idx_participants_endpoint_id ON participants(endpoint_id)');
    await client.query('CREATE INDEX idx_participants_scheme_id ON participants(scheme_id)');

    // 5. Kontrol et
    const countResult = await client.query('SELECT COUNT(*) as count FROM participants');
    console.log(`🎉 SUCCESS: ${countResult.rows[0].count} records in participants table`);

    // Kayıtları göster
    const records = await client.query('SELECT * FROM participants LIMIT 10');
    console.log("Sample records:", records.rows);

  } catch (error) {
    console.error("💥 Error:", error);
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected");
    }
  }
}

cleanBuild();