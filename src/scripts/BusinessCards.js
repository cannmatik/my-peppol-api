import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
import { XMLParser } from 'fast-xml-parser';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("😎 MATIK BUILD Starting Download XML Business Cards...");

const EXPORT_URLS = {
  xml: "https://test-directory.peppol.eu/export/businesscards",
};

const FILE_PATHS = {
  xml: path.join(__dirname, "../app/data/directory-export-business-cards.xml"),
};

async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const fileSize = fs.statSync(filePath).size;
        console.log(`✅ Downloaded ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        resolve(fileSize);
      });
    }).on('error', (err) => {
      console.error('💥 Download error:', err);
      reject(err);
    });
  });
}

function extractDocumentType(doctypeValue) {
  if (!doctypeValue) return null;
  
  // Pattern 1: urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##...
  const pattern1 = /::([A-Za-z]+)-2::([A-Za-z]+)##/;
  const match1 = doctypeValue.match(pattern1);
  if (match1 && match1[2]) return match1[2];

  // Pattern 2: urn:oasis:names:specification:ubl:schema:xsd:Invoice##...
  const pattern2 = /::([A-Za-z]+)##/;
  const match2 = doctypeValue.match(pattern2);
  if (match2 && match2[1]) return match2[1];

  // Pattern 3: CrossIndustryInvoice gibi özel durumlar
  if (doctypeValue.includes('CrossIndustryInvoice')) return 'CrossIndustryInvoice';
  if (doctypeValue.includes('ApplicationResponse')) return 'ApplicationResponse';
  if (doctypeValue.includes('Order')) return 'Order';
  if (doctypeValue.includes('Catalogue')) return 'Catalogue';

  return null;
}

async function parsePeppolBusinessCardsXML(xmlPath) {
  console.log("📊 Parsing Business Cards XML file...");
  
  const xmlData = fs.readFileSync(xmlPath, 'utf8');
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
    processEntities: true,
    htmlEntities: true,
    allowBooleanAttributes: true,
    ignoreDeclaration: true,
    alwaysCreateTextNode: false
  });

  console.log("🔄 Parsing XML data...");
  const result = parser.parse(xmlData);
  console.log("✅ XML parsed successfully");

  const businessData = new Map();
  let processedCount = 0;
  let skippedCount = 0;

  // XML yapısını kontrol et - businesscard array'ini bul
  const businessCards = result?.root?.businesscard;
  
  if (!businessCards) {
    console.log("❌ No business cards found in XML");
    console.log("Available keys:", Object.keys(result));
    if (result.root) console.log("Root keys:", Object.keys(result.root));
    return businessData;
  }

  const cardsArray = Array.isArray(businessCards) ? businessCards : [businessCards];
  console.log(`📈 Found ${cardsArray.length} business cards in XML`);

  for (const card of cardsArray) {
    try {
      const participant = card.participant;
      if (!participant || !participant["@_value"]) {
        skippedCount++;
        continue;
      }

      const participantValue = participant["@_value"];
      const scheme = participant["@_scheme"];

      // Participant value formatı: "9945:pl5882175542"
      if (!participantValue.includes(':')) {
        skippedCount++;
        continue;
      }

      const [schemeId, endpointId] = participantValue.split(':');
      if (!schemeId || !endpointId) {
        skippedCount++;
        continue;
      }

      const fullPid = `${schemeId}:${endpointId}`;

      // Company name'i bul
      let companyName = "Unknown";
      const entity = card.entity;
      if (entity && entity.name) {
        if (Array.isArray(entity.name)) {
          // Birden fazla name varsa ilkini al
          companyName = entity.name[0]["@_name"] || "Unknown";
        } else {
          companyName = entity.name["@_name"] || "Unknown";
        }
      }

      // Document types'ı topla
      const documentTypes = [];
      let doctypeids = card.doctypeid;
      
      if (doctypeids) {
        // Tek doctypeid veya array olabilir
        if (!Array.isArray(doctypeids)) {
          doctypeids = [doctypeids];
        }
        
        for (const doctype of doctypeids) {
          if (doctype && doctype["@_value"]) {
            const docType = extractDocumentType(doctype["@_value"]);
            if (docType) {
              documentTypes.push(docType);
            }
          }
        }
      }

      const uniqueDocTypes = [...new Set(documentTypes)];

      businessData.set(fullPid, {
        company_name: companyName,
        raw_document_types: documentTypes.join(', '),
        document_types: uniqueDocTypes,
        supports_invoice: uniqueDocTypes.some(doc => 
          doc && doc.toLowerCase().includes('invoice')
        ),
        supports_creditnote: uniqueDocTypes.some(doc => 
          doc && doc.toLowerCase().includes('creditnote')
        ),
        scheme_id: schemeId,
        endpoint_id: endpointId,
        country_code: entity ? entity["@_countrycode"] : null,
        registration_date: entity ? entity.regdate : null
      });

      processedCount++;
      
      if (processedCount % 50000 === 0) {
        console.log(`📊 Processed ${processedCount}/${cardsArray.length} business cards...`);
      }

    } catch (error) {
      skippedCount++;
      if (skippedCount <= 5) {
        console.warn(`⚠️ Error processing business card:`, error.message);
      }
    }
  }

  console.log(`✅ XML Processing completed:`);
  console.log(`   - Total business cards: ${cardsArray.length}`);
  console.log(`   - Successfully processed: ${processedCount}`);
  console.log(`   - Unique participants: ${businessData.size}`);
  console.log(`   - Skipped: ${skippedCount}`);
  
  // Örnek kayıtları göster
  const firstFew = Array.from(businessData.entries()).slice(0, 3);
  console.log('Sample records:');
  firstFew.forEach(([pid, data], index) => {
    console.log(`   ${index + 1}. ${pid}: ${data.company_name} - Docs: ${data.document_types.join(', ')}`);
  });

  return businessData;
}

async function finalBuild() {
  let client;
  try {
    client = await getNeonClient();
    console.log("✅ Connected to Neon!");

    // XML'i indir ve parse et
    console.log("🔄 Downloading and parsing XML Business Cards...");
    const xmlSize = await downloadFile(EXPORT_URLS.xml, FILE_PATHS.xml);
    const businessData = await parsePeppolBusinessCardsXML(FILE_PATHS.xml);

    console.log(`📊 Final business data: ${businessData.size} unique participants`);

    if (businessData.size === 0) {
      throw new Error("No data found in XML!");
    }

    console.log("🗄️ Recreating participants table...");
    await client.query('DROP TABLE IF EXISTS participants_final');
    await client.query(`
      CREATE TABLE participants_final (
        id SERIAL PRIMARY KEY,
        full_pid VARCHAR(500) UNIQUE NOT NULL,
        scheme_id VARCHAR(50) NOT NULL,
        endpoint_id VARCHAR(400) NOT NULL,
        supports_invoice BOOLEAN DEFAULT FALSE,
        supports_creditnote BOOLEAN DEFAULT FALSE,
        company_name TEXT,
        country_code VARCHAR(10),
        registration_date VARCHAR(50),
        raw_document_types TEXT,
        document_types JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("📥 Loading data to database...");
    const batchSize = 1000; // Daha büyük batch size
    const entries = Array.from(businessData.entries());

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];

      batch.forEach(([fullPid, data], index) => {
        const offset = index * 10;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`);

        values.push(
          fullPid,
          data.scheme_id,
          data.endpoint_id,
          data.supports_invoice,
          data.supports_creditnote,
          data.company_name,
          data.country_code,
          data.registration_date,
          data.raw_document_types,
          JSON.stringify(data.document_types)
        );
      });

      const query = `
        INSERT INTO participants_final 
        (full_pid, scheme_id, endpoint_id, supports_invoice, supports_creditnote, company_name, country_code, registration_date, raw_document_types, document_types) 
        VALUES ${placeholders.join(',')}
        ON CONFLICT (full_pid) DO UPDATE SET
          scheme_id = EXCLUDED.scheme_id,
          endpoint_id = EXCLUDED.endpoint_id,
          supports_invoice = EXCLUDED.supports_invoice,
          supports_creditnote = EXCLUDED.supports_creditnote,
          company_name = EXCLUDED.company_name,
          country_code = EXCLUDED.country_code,
          registration_date = EXCLUDED.registration_date,
          raw_document_types = EXCLUDED.raw_document_types,
          document_types = EXCLUDED.document_types
      `;
      
      await client.query(query, values);

      if (i % 50000 === 0 || i + batchSize >= entries.length) {
        console.log(`✅ Loaded ${Math.min(i + batchSize, entries.length)}/${entries.length} records...`);
      }
    }

    console.log(`🎯 FINAL: Loaded ${entries.length} records to database`);

    console.log("🔄 Performing atomic swap...");
    await client.query('DROP TABLE IF EXISTS participants');
    await client.query('ALTER TABLE participants_final RENAME TO participants');

    console.log("📈 Creating indexes...");
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_full_pid ON participants(full_pid)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_endpoint_id ON participants(endpoint_id)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_scheme_id ON participants(scheme_id)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_supports_invoice ON participants(supports_invoice)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_supports_creditnote ON participants(supports_creditnote)');
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_country_code ON participants(country_code)');

    const countResult = await client.query('SELECT COUNT(*) as count FROM participants');
    console.log(`📊 FINAL DATABASE COUNT: ${countResult.rows[0].count}`);

    // Detaylı istatistikler
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN supports_invoice THEN 1 END) as invoice_count,
        COUNT(CASE WHEN supports_creditnote THEN 1 END) as creditnote_count,
        COUNT(DISTINCT country_code) as unique_countries,
        COUNT(DISTINCT scheme_id) as unique_schemes
      FROM participants
    `);
    
    const stats = statsResult.rows[0];
    console.log(`📈 Database Statistics:`);
    console.log(`   - Total participants: ${stats.total}`);
    console.log(`   - Support Invoice: ${stats.invoice_count} (${((stats.invoice_count/stats.total)*100).toFixed(1)}%)`);
    console.log(`   - Support CreditNote: ${stats.creditnote_count} (${((stats.creditnote_count/stats.total)*100).toFixed(1)}%)`);
    console.log(`   - Unique countries: ${stats.unique_countries}`);
    console.log(`   - Unique schemes: ${stats.unique_schemes}`);

    // En çok doküman tipleri
    const docStats = await client.query(`
      SELECT jsonb_array_elements_text(document_types) as doc_type, COUNT(*)
      FROM participants 
      GROUP BY doc_type 
      ORDER BY COUNT(*) DESC 
      LIMIT 10
    `);
    
    console.log(`📄 Top document types:`);
    docStats.rows.forEach(row => {
      console.log(`   - ${row.doc_type}: ${row.count}`);
    });

    console.log("🎉 FINAL BUILD COMPLETED SUCCESSFULLY!");

  } catch (error) {
    console.error("💥 Error:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    if (client) await client.end();
    
    // Temizlik
    Object.values(FILE_PATHS).forEach(filePath => {
      try { 
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up ${filePath}`);
        }
      } catch (e) {
        // ignore
      }
    });
    
    console.log("🔌 Disconnected");
  }
}

// Gerekli paket kontrolü
try {
  await import('fast-xml-parser');
  console.log("✅ fast-xml-parser available");
} catch (e) {
  console.log("❌ Please install: npm install fast-xml-parser");
  process.exit(1);
}

finalBuild();