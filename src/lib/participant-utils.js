import fs from "fs";
import csv from "csv-parser";
import path from "path";

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

// Sadece participant listesini oku (hızlı) - BU KALACAK
export async function loadParticipantList() {
  return new Promise((resolve, reject) => {
    const participants = new Map();
    
    const csvPath = path.join(process.cwd(), 'src/app/data/directory-export-participants.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`[ERROR] Participants CSV not found: ${csvPath}`);
      resolve(participants);
      return;
    }
    
    fs.createReadStream(csvPath)
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
      .on("error", (error) => {
        console.error(`[ERROR] Failed to load participant list:`, error);
        resolve(participants);
      });
  });
}

// Alternatif scheme'leri ara - BU KALACAK
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

// Document types'ı parse et - BU KALACAK (route'da kullanılıyor)
export function extractDocumentTypes(rawDocumentTypes) {
  if (!rawDocumentTypes) return [];
  
  const docTypes = rawDocumentTypes.split('\n')
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

  return [...new Set(docTypes)];
}