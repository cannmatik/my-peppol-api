import fs from "fs";
import csv from "csv-parser";

// Participant ID'den ülke kodunu çıkarmak için yardımcı fonksiyon
function normalizeParticipantId(participantId) {
  if (!participantId) return participantId;
  
  const countryCodes = ['BE', 'NL', 'PL', 'FR', 'DE', 'IT', 'ES', 'GB', 'US', 'TR'];
  const upperId = participantId.toUpperCase();
  
  for (const code of countryCodes) {
    if (upperId.startsWith(code) && upperId.length > 2) {
      const remaining = upperId.substring(2);
      if (/^[A-Z0-9]+$/.test(remaining)) {
        return participantId.substring(2);
      }
    }
  }
  
  return participantId;
}

// Sadece participant listesini oku (hızlı)
export async function loadParticipantList() {
  return new Promise((resolve, reject) => {
    const participants = new Map();
    
    const csvFile = "C:\\Users\\Can Matik\\Desktop\\my-peppol-api\\src\\app\\data\\directory-export-participants.csv";
    
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on("data", (row) => {
        const participantId = row["Participant ID"];
        if (participantId && participantId.startsWith("iso6523-actorid-upis::")) {
          const parts = participantId.split("::");
          if (parts.length === 2) {
            const [scheme, id] = parts[1].split(":");
            if (scheme && id) {
              const originalKey = id.toLowerCase();
              if (!participants.has(originalKey)) {
                participants.set(originalKey, []);
              }
              participants.get(originalKey).push({
                scheme: scheme,
                participantId: id,
                fullId: participantId,
                isOriginal: true
              });

              const normalizedId = normalizeParticipantId(id);
              if (normalizedId !== id && normalizedId.length > 0) {
                const normalizedKey = normalizedId.toLowerCase();
                if (!participants.has(normalizedKey)) {
                  participants.set(normalizedKey, []);
                }
                participants.get(normalizedKey).push({
                  scheme: scheme,
                  participantId: id,
                  fullId: participantId,
                  isNormalized: true,
                  originalId: id
                });
              }
            }
          }
        }
      })
      .on("end", () => {
        console.log(`[INFO] Loaded ${participants.size} unique participant keys from directory`);
        resolve(participants);
      })
      .on("error", reject);
  });
}

// Business cards'tan belge tiplerini al - DÜZELTİLMİŞ VERSİYON
export async function getParticipantDetailsFromBusinessCards(participantID) {
  return new Promise((resolve) => {
    const csvFile = "C:\\Users\\Can Matik\\Desktop\\my-peppol-api\\src\\app\\data\\directory-export-business-cards.csv";
    
    if (!fs.existsSync(csvFile)) {
      console.error(`[ERROR] Business cards CSV not found`);
      resolve(null);
      return;
    }

    console.log(`[INFO] Searching business cards for: ${participantID}`);
    
    let buffer = '';
    let isInDocumentTypes = false;
    let currentRow = {};
    
    fs.createReadStream(csvFile, { encoding: 'utf8' })
      .on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Son satırı tamamlanmamış olabilir

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') continue;
          
          // Yeni satır başlangıcı (Participant ID ile başlıyorsa)
          if (trimmedLine.startsWith('"iso6523-actorid-upis::')) {
            // Önceki satırı işle
            if (currentRow.participantId) {
              processRow(currentRow, participantID, resolve);
            }
            
            // Yeni satırı başlat
            currentRow = {};
            const parts = trimmedLine.split(';');
            if (parts.length >= 1) {
              const participantId = parts[0].replace(/^"|"$/g, '');
              if (participantId.startsWith('iso6523-actorid-upis::')) {
                const idParts = participantId.split('::')[1].split(':');
                if (idParts.length === 2) {
                  currentRow.scheme = idParts[0];
                  currentRow.participantId = idParts[1];
                  currentRow.documentTypes = '';
                  isInDocumentTypes = false;
                }
              }
            }
            
            // Names alanını al
            if (parts.length >= 2) {
              currentRow.names = parts[1].replace(/^"|"$/g, '');
            }
            
            // Document types alanı başladı mı?
            if (trimmedLine.includes('"busdox-docid-qns::') && !trimmedLine.endsWith('"')) {
              isInDocumentTypes = true;
              const docTypesStart = trimmedLine.indexOf('"busdox-docid-qns::');
              if (docTypesStart !== -1) {
                currentRow.documentTypes = trimmedLine.substring(docTypesStart + 1);
              }
            } else if (trimmedLine.includes('"busdox-docid-qns::')) {
              // Document types tek satırda
              const docTypesStart = trimmedLine.indexOf('"busdox-docid-qns::');
              const docTypesEnd = trimmedLine.lastIndexOf('"');
              if (docTypesStart !== -1 && docTypesEnd !== -1) {
                currentRow.documentTypes = trimmedLine.substring(docTypesStart + 1, docTypesEnd);
                processRow(currentRow, participantID, resolve);
                currentRow = {};
              }
            }
          } else if (isInDocumentTypes) {
            // Document types devam ediyor
            if (trimmedLine.includes('"')) {
              // Document types sonu
              currentRow.documentTypes += '\n' + trimmedLine.substring(0, trimmedLine.indexOf('"'));
              isInDocumentTypes = false;
              processRow(currentRow, participantID, resolve);
              currentRow = {};
            } else {
              // Document types devamı
              currentRow.documentTypes += '\n' + trimmedLine;
            }
          }
        }
      })
      .on('end', () => {
        // Son satırı işle
        if (currentRow.participantId) {
          processRow(currentRow, participantID, resolve);
        }
        console.log(`[INFO] Business cards search completed`);
        resolve(null);
      })
      .on('error', (error) => {
        console.error(`[ERROR] Business cards search:`, error);
        resolve(null);
      });
  });
}

// Satır işleme fonksiyonu
function processRow(row, searchParticipantID, resolve) {
  if (!row.participantId || !row.documentTypes) return;

  // Participant ID eşleşmesini kontrol et
  const normalizedRowId = normalizeParticipantId(row.participantId);
  const normalizedSearchId = normalizeParticipantId(searchParticipantID);
  
  const isMatch = 
    row.participantId.toLowerCase() === searchParticipantID.toLowerCase() ||
    row.participantId.toLowerCase() === normalizedSearchId.toLowerCase() ||
    normalizedRowId.toLowerCase() === searchParticipantID.toLowerCase() ||
    normalizedRowId.toLowerCase() === normalizedSearchId.toLowerCase();
  
  if (isMatch) {
    console.log(`[FOUND] ✅ Details found for: ${row.participantId}`);
    
    // Document types'ı parse et
    const docTypes = row.documentTypes.split('\n')
      .filter(line => line.trim().length > 0 && line.includes('busdox-docid-qns::'))
      .map(line => {
        const lineClean = line.trim().replace(/^"|"$/g, '');
        
        // Belge tipini çıkar
        let shortName = '';
        
        // Pattern 1: ...::DocumentType-2::DocumentType##...
        const pattern1 = /::([A-Za-z]+)-2::([A-Za-z]+)##/;
        const match1 = lineClean.match(pattern1);
        
        if (match1) {
          shortName = match1[2]; // İkinci kısım: Invoice, CreditNote, etc.
        } else {
          // Pattern 2: ...::DocumentType##...
          const pattern2 = /::([A-Za-z]+)##/;
          const match2 = lineClean.match(pattern2);
          if (match2) {
            shortName = match2[1];
          } else {
            // Pattern 3: Son :: sonrasını al
            const parts = lineClean.split('::');
            if (parts.length > 1) {
              const lastPart = parts[parts.length - 1];
              shortName = lastPart.split('##')[0];
              // -2 varsa temizle
              shortName = shortName.replace(/-2$/, '');
            } else {
              shortName = lineClean;
            }
          }
        }
        
        return {
          shortName: shortName.trim(),
          longName: lineClean,
          supported: true
        };
      })
      .filter(doc => doc.shortName && doc.shortName.length > 0 && doc.shortName !== '2.1');

    console.log(`[DEBUG] Found ${docTypes.length} document types:`, docTypes.map(d => d.shortName));

    // Desteklenen belge tipleri
    const supportedDocumentTypes = {};
    docTypes.forEach(doc => {
      supportedDocumentTypes[doc.shortName.toLowerCase()] = true;
    });

    resolve({
      companyName: row.names || "Unknown",
      scheme: row.scheme,
      participantId: row.participantId,
      allDocumentTypes: docTypes,
      supportedDocumentTypes: supportedDocumentTypes,
      rawDocumentTypes: row.documentTypes
    });
  }
}

// Veritabanında hızlı arama + business cards detayları
export async function searchInDatabase(db, fullPid, documentType) {
  try {
    const row = await db.get("SELECT * FROM participants WHERE full_pid = ?", fullPid);
    
    if (row) {
      const participantID = fullPid.split(":")[1];
      const businessDetails = await getParticipantDetailsFromBusinessCards(participantID);
      
      const response = {
        participantID: participantID,
        schemeID: fullPid.split(":")[0],
        documentType,
        matchType: "direct",
        foundIn: "database"
      };
      
      if (businessDetails) {
        response.companyName = businessDetails.companyName;
        response.allDocumentTypes = businessDetails.allDocumentTypes;
        response.supportedDocumentTypes = businessDetails.supportedDocumentTypes;
        
        if (documentType) {
          const docTypeLower = documentType.toLowerCase();
          response.supportsDocumentType = businessDetails.supportedDocumentTypes[docTypeLower] || false;
          response.message = response.supportsDocumentType ? 
            `✅ ${documentType} supported - ${businessDetails.companyName}` : 
            `❌ ${documentType} not supported - ${businessDetails.companyName}`;
        } else {
          response.supportsDocumentType = null;
          response.message = `⚠️ No document type specified - ${businessDetails.companyName}`;
        }
      } else {
        response.companyName = "Unknown";
        response.allDocumentTypes = [];
        response.supportedDocumentTypes = {};
        
        if (documentType) {
          response.supportsDocumentType = documentType === "Invoice" ? 
            Boolean(row.supports_invoice) : 
            Boolean(row.supports_creditnote);
          response.message = response.supportsDocumentType ? 
            `✅ ${documentType} supported` : 
            `❌ ${documentType} not supported`;
        } else {
          response.supportsDocumentType = null;
          response.message = "⚠️ No document type specified";
        }
      }
      
      return { found: true, response };
    }
  } catch (error) {
    console.error(`[ERROR] Database search:`, error);
  }
  
  return { found: false };
}

// Alternatif scheme'leri ara (business cards'a BAKMIYOR)
export async function searchAlternativeSchemes(participantID, documentType, participantList) {
  const searchKeys = [
    participantID.toLowerCase(),
    normalizeParticipantId(participantID).toLowerCase()
  ].filter((value, index, self) => self.indexOf(value) === index);

  let allAlternativeSchemes = [];
  
  for (const key of searchKeys) {
    if (participantList.has(key)) {
      allAlternativeSchemes = allAlternativeSchemes.concat(participantList.get(key));
    }
  }

  if (allAlternativeSchemes.length === 0) {
    return {
      found: false,
      response: {
        message: "❌ No participant exists with the given schema and endpoint ID",
        participantID,
        documentType,
        supportsDocumentType: false,
        matchType: "not_found",
        allDocumentTypes: [],
        supportedDocumentTypes: {}
      }
    };
  }

  const uniqueSchemes = allAlternativeSchemes.filter((scheme, index, self) => 
    index === self.findIndex(s => s.fullId === scheme.fullId)
  );

  return {
    found: true,
    response: {
      participantID: participantID,
      schemeID: "unknown",
      documentType,
      supportsDocumentType: false,
      matchType: "alternative_schemes",
      message: "❌ No participant exists with the given schema, but found with alternative schemes",
      foundIn: "peppol_directory",
      allDocumentTypes: [],
      supportedDocumentTypes: {},
      alternativeSchemes: uniqueSchemes.map(s => ({
        scheme: s.scheme,
        participantId: s.participantId,
        fullId: s.fullId,
        isNormalized: s.isNormalized || false,
        originalId: s.originalId || s.participantId
      }))
    }
  };
}