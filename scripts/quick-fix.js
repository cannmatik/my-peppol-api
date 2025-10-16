import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 QUICK FIX Starting...");

async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function quickFix() {
  let client;
  
  try {
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // 1. Mevcut tabloları kontrol et
    console.log("📋 Checking current tables...");
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Current tables:", tables.rows.map(r => r.table_name));

    // 2. Eğer participants2 varsa, onu participants yap
    const participants2Exists = tables.rows.some(r => r.table_name === 'participants2');
    const participantsExists = tables.rows.some(r => r.table_name === 'participants');

    if (participants2Exists) {
      console.log("🔄 Found participants2, performing swap...");
      
      if (participantsExists) {
        await client.query('DROP TABLE IF EXISTS participants_old');
        await client.query('ALTER TABLE participants RENAME TO participants_old');
      }
      
      await client.query('ALTER TABLE participants2 RENAME TO participants');
      console.log("✅ Swapped participants2 -> participants");
      
      // Eski tabloyu temizle
      await client.query('DROP TABLE IF EXISTS participants_old');
    } else if (!participantsExists) {
      console.log("❌ No participants table found, creating empty one...");
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
    }

    // 3. Index'leri kontrol et
    console.log("📈 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_full_pid ON participants(full_pid)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_endpoint_id ON participants(endpoint_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_scheme_id ON participants(scheme_id)
    `);

    // 4. Son durumu göster
    const countResult = await client.query('SELECT COUNT(*) as count FROM participants');
    console.log(`🎉 Final: ${countResult.rows[0].count} records in participants table`);

  } catch (error) {
    console.error("💥 Error:", error);
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected");
    }
  }
}

quickFix();