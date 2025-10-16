import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 ENHANCED ATOMIC BUILD Starting...");

const CSV_URLS = {
  businessCards: "https://test-directory.peppol.eu/export/businesscards-csv"
};

const CSV_PATHS = {
  businessCards: path.join(__dirname, "../app/data/business-cards.csv")
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

// Business Cards'tan company name ve document types'ı çıkar
async function parseBusinessCardsData(csvPath) {  // ✅ async ekledim
  const csvModule = await import('csv-parser');
  const csv = csvModule.default;
  
  return new Promise((resolve, reject) => {
    const businessData = new Map();
    
    console.log("📊 Parsing business cards for enhanced data...");
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ";", skipEmptyLines: true, quote: '"' }))
      .on('data', (data) => {
        try {
          const scheme = data["Identifier schemes"];
          const value = data["Identifier values"];
          const docField = data["Document types"] || "";
          const companyName = data["Names"] || "";

          if (!scheme || !value) return;

          const [schemeId, endpointId] = value.split(":");
          if (!schemeId || !endpointId) return;

          const fullPid = `${schemeId}:${endpointId}`;
          
          // Document types'ı parse et
          const docTypes = docField.split('\n')
            .filter(line => line.trim().length > 0 && line.includes('busdox-docid-qns::'))
            .map(line => {
              const lineClean = line.trim().replace(/^"|"$/g, '');
              let shortName = '';
              
              const pattern1 = /::([A-Za-z]+)-2::([A-Za-z]+)##/;
              const match1 = lineClean.match(pattern1);
              
              if (match1) {
                shortName = match1[2];
              } else {
                const pattern2 = /::([A-Za-z]+)##/;
                const match2 = lineClean.match(pattern2);
                if (match2) {
                  shortName = match2[1];
                } else {
                  const parts = lineClean.split('::');
                  if (parts.length > 1) {
                    const lastPart = parts[parts.length - 1];
                    shortName = lastPart.split('##')[0];
                    shortName = shortName.replace(/-2$/, '');
                  }
                }
              }
              
              return shortName.trim();
            })
            .filter(name => name && name.length > 0 && name !== '2.1');

          businessData.set(fullPid, {
            company_name: companyName,
            raw_document_types: docField,
            document_types: docTypes,
            supports_invoice: docTypes.some(doc => doc.toLowerCase() === 'invoice'),
            supports_creditnote: docTypes.some(doc => doc.toLowerCase() === 'creditnote')
          });

        } catch (error) {
          // skip
        }
      })
      .on('end', () => {
        console.log(`✅ Parsed ${businessData.size} business cards`);
        resolve(businessData);
      })
      .on('error', reject);
  });
}

async function enhancedBuild() {
  let client;
  
  try {
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // CSV indir
    await downloadCSV(CSV_URLS.businessCards, CSV_PATHS.businessCards);

    // Business cards data'sını parse et
    const businessData = await parseBusinessCardsData(CSV_PATHS.businessCards);

    // participants2 tablosu oluştur (ENHANCED)
    console.log("🗄️ Creating enhanced participants2 table...");
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
        document_types JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Business data'yı database'e yükle
    console.log("📥 Loading enhanced data into participants2...");
    
    const batchSize = 100;
    const entries = Array.from(businessData.entries());
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      
      batch.forEach(([fullPid, data], index) => {
        const [schemeId, endpointId] = fullPid.split(':');
        const offset = index * 7;
        
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        
        values.push(
          fullPid,
          schemeId,
          endpointId,
          data.supports_invoice,
          data.supports_creditnote,
          data.company_name,
          JSON.stringify(data.document_types) // document_types as JSON
        );
      });

      await client.query(
        `INSERT INTO participants2 
         (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name, document_types) 
         VALUES ${placeholders.join(',')}`,
        values
      );

      console.log(`✅ Processed ${Math.min(i + batchSize, entries.length)}/${entries.length} records...`);
    }

    // Atomic swap
    console.log("🔄 Performing atomic swap...");
    await client.query('DROP TABLE IF EXISTS participants_old');
    await client.query('ALTER TABLE IF EXISTS participants RENAME TO participants_old');
    await client.query('ALTER TABLE participants2 RENAME TO participants');

    // Index'ler
    console.log("📈 Creating indexes...");
    await client.query('CREATE INDEX idx_participants_full_pid ON participants(full_pid)');
    await client.query('CREATE INDEX idx_participants_endpoint_id ON participants(endpoint_id)');
    await client.query('CREATE INDEX idx_participants_scheme_id ON participants(scheme_id)');

    console.log("🎉 ENHANCED BUILD COMPLETED!");

  } catch (error) {
    console.error("💥 Error:", error);
  } finally {
    if (client) {
      await client.end();
      console.log("🔌 Disconnected");
    }
    // Temizlik
    try {
      fs.unlinkSync(CSV_PATHS.businessCards);
    } catch (e) {}
  }
}

enhancedBuild();