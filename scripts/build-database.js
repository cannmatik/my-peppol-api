import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

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

const JSON_PATH = path.join(__dirname, "../src/app/data/participants.json");

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

// CSV'yi JSON'a dönüştür
async function processCSVToJSON() {
  const csvModule = await import('csv-parser');
  const csv = csvModule.default;
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    console.log("📊 Processing business cards CSV...");
    
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
      .on('end', () => {
        console.log(`✅ Processed ${results.length} records from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

// JSON database oluştur
async function buildJSONDatabase() {
  console.log("🚀 Starting JSON database build process...");
  
  try {
    // Data klasörünü oluştur
    ensureDataDirectory();
    
    // CSV dosyalarını indir
    console.log("📥 Downloading CSV files...");
    await downloadCSV(CSV_URLS.businessCards, CSV_PATHS.businessCards);
    await downloadCSV(CSV_URLS.participants, CSV_PATHS.participants);
    
    // CSV'yi JSON'a dönüştür
    const jsonData = await processCSVToJSON();
    
    // JSON dosyasını oluştur
    fs.writeFileSync(JSON_PATH, JSON.stringify(jsonData, null, 2));
    
    console.log(`🎉 JSON database built with ${jsonData.length} records!`);
    console.log(`📁 JSON file: ${JSON_PATH}`);
    
    // Temizlik: CSV dosyalarını sil (opsiyonel)
    fs.unlinkSync(CSV_PATHS.businessCards);
    fs.unlinkSync(CSV_PATHS.participants);
    console.log("🧹 Temporary CSV files cleaned up");
    
  } catch (error) {
    console.error("❌ JSON build failed:", error);
    throw error;
  }
}

// Build script'ini çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  buildJSONDatabase().catch(console.error);
}

export { buildJSONDatabase };