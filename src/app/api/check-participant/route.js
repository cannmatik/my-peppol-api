import { NextResponse } from "next/server";
import pkg from 'pg';
const { Client } = pkg;
import { 
  searchAlternativeSchemes,
  loadParticipantList
} from "../../../lib/participant-utils";

let participantListCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Neon client helper
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

// Document types'ı parse et
function extractDocumentTypes(rawDocumentTypes) {
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

// JSON document types'ı parse et
function parseJSONDocumentTypes(jsonData) {
  if (!jsonData) return [];
  
  try {
    const docTypes = JSON.parse(jsonData);
    if (Array.isArray(docTypes)) {
      return docTypes.map(shortName => ({
        shortName: shortName,
        longName: `busdox-docid-qns::urn:oasis:names:specification:ubl:schema:xsd:${shortName}-2::${shortName}##...`,
        supported: true
      }));
    }
  } catch (e) {
    console.log("❌ JSON parse error:", e);
  }
  
  return [];
}

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

// Neon'da ara - GELİŞMİŞ VERSİYON (alternatif search ile)
async function searchInNeon(schemeID, participantID, documentType) {
  let client;
  
  try {
    client = await getNeonClient();
    const fullPid = `${schemeID}:${participantID}`;
    
    console.log(`[DEBUG] Searching for full_pid: ${fullPid}`);
    
    // 1. ÖNCE TAM EŞLEŞME
    let result = await client.query(
      'SELECT * FROM participants WHERE full_pid = $1',
      [fullPid]
    );
    
    if (result.rows.length > 0) {
      console.log(`[DEBUG] Found exact match: ${result.rows[0].company_name}`);
      return createNeonResponse(result.rows[0], schemeID, participantID, documentType, "direct");
    }
    
    // 2. ENDPOINT ID İLE ARA (case insensitive)
    console.log(`[DEBUG] Trying endpoint_id search: ${participantID}`);
    result = await client.query(
      'SELECT * FROM participants WHERE LOWER(endpoint_id) = LOWER($1)',
      [participantID]
    );
    
    if (result.rows.length > 0) {
      const participant = result.rows[0];
      console.log(`[DEBUG] Found by endpoint_id: ${participant.full_pid}`);
      return createNeonResponse(participant, schemeID, participantID, documentType, "endpoint_match");
    }
    
    // 3. NORMALIZE EDİLMİŞ ENDPOINT ID İLE ARA (ülke kodu olmadan)
    const normalizedId = normalizeParticipantId(participantID);
    if (normalizedId !== participantID) {
      console.log(`[DEBUG] Trying normalized endpoint_id: ${normalizedId}`);
      result = await client.query(
        'SELECT * FROM participants WHERE LOWER(endpoint_id) = LOWER($1)',
        [normalizedId]
      );
      
      if (result.rows.length > 0) {
        const participant = result.rows[0];
        console.log(`[DEBUG] Found by normalized endpoint_id: ${participant.full_pid}`);
        return createNeonResponse(participant, schemeID, participantID, documentType, "normalized_match");
      }
    }
    
    // 4. ALTERNATİF SCHEME'LERİ BUL
    console.log(`[DEBUG] Searching for alternative schemes...`);
    result = await client.query(
      'SELECT * FROM participants WHERE endpoint_id = $1 OR LOWER(endpoint_id) = LOWER($2)',
      [participantID, normalizedId || participantID]
    );
    
    if (result.rows.length > 0) {
      const alternatives = result.rows.map(row => ({
        scheme: row.scheme_id,
        participantId: row.endpoint_id,
        fullId: row.full_pid,
        companyName: row.company_name,
        supportsInvoice: row.supports_invoice,
        supportsCreditNote: row.supports_creditnote
      }));

      return {
        found: true,
        response: {
          participantID: participantID,
          schemeID: schemeID,
          documentType,
          supportsDocumentType: false,
          matchType: "alternative_schemes",
          message: `❌ No participant exists with scheme ${schemeID}, but found with alternative schemes`,
          foundIn: "neon_database",
          alternativeSchemes: alternatives
        }
      };
    }
    
    console.log(`[DEBUG] No matches found in Neon`);
    return { found: false };
    
  } catch (error) {
    console.error("[ERROR] Neon search:", error);
    return { found: false };
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Yardımcı fonksiyon - Neon response oluştur
function createNeonResponse(participant, schemeID, participantID, documentType, matchType) {
  // Document types'ı al (JSON veya raw)
  let allDocumentTypes = [];
  let supportedDocumentTypes = {};
  
  if (participant.document_types) {
    // JSON formatında document_types varsa
    allDocumentTypes = parseJSONDocumentTypes(participant.document_types);
  } else if (participant.raw_document_types) {
    // Raw document_types varsa parse et
    const docTypeNames = extractDocumentTypes(participant.raw_document_types);
    allDocumentTypes = docTypeNames.map(shortName => ({
      shortName: shortName,
      longName: `busdox-docid-qns::urn:oasis:names:specification:ubl:schema:xsd:${shortName}-2::${shortName}##...`,
      supported: true
    }));
  }
  
  // Supported document types map oluştur
  allDocumentTypes.forEach(doc => {
    supportedDocumentTypes[doc.shortName.toLowerCase()] = true;
  });

  let supportsDoc = false;
  let message = "";

  if (documentType) {
    // Önce supportedDocumentTypes'tan kontrol et, yoksa fallback
    supportsDoc = supportedDocumentTypes[documentType.toLowerCase()] || 
                 (documentType.toLowerCase() === "invoice" ? participant.supports_invoice : 
                  documentType.toLowerCase() === "creditnote" ? participant.supports_creditnote : false);

    message = supportsDoc ? 
      `✅ ${documentType} supported - ${participant.company_name}` : 
      `❌ ${documentType} not supported - ${participant.company_name}`;
  } else {
    message = `⚠️ No document type specified - ${participant.company_name}`;
  }

  return {
    found: true,
    response: {
      participantID: participantID,
      schemeID: schemeID,
      documentType,
      companyName: participant.company_name,
      supportsDocumentType: documentType ? supportsDoc : null,
      matchType: matchType,
      foundIn: "neon_database",
      message: message,
      allDocumentTypes: allDocumentTypes,
      supportedDocumentTypes: supportedDocumentTypes,
      actualFullPid: participant.full_pid
    }
  };
}

export async function POST(request) {
  try {
    const { documentType, schemeID, participantID } = await request.json();
    
    if (!schemeID || !participantID) {
      return NextResponse.json({ 
        error: "Missing required fields: schemeID and participantID" 
      }, { status: 400 });
    }

    const fullPid = `${schemeID}:${participantID}`;
    console.log(`[SEARCH] Looking for: ${fullPid}`);

    // 1. AŞAMA: Önce Neon'da gelişmiş arama
    let result = await searchInNeon(schemeID, participantID, documentType);
    if (result.found) {
      console.log(`[FOUND] ${result.response.matchType} match in Neon`);
      return NextResponse.json(result.response);
    }

    // 2. AŞAMA: Participants CSV'den alternatif scheme'ler
    const now = Date.now();
    if (!participantListCache || (now - lastCacheTime) > CACHE_DURATION) {
      console.log(`[CACHE] Loading participant list...`);
      participantListCache = await loadParticipantList();
      lastCacheTime = now;
    }

    // 3. AŞAMA: Participants CSV'de alternatif scheme'leri ara
    console.log(`[SEARCH] Not found in Neon, searching alternative schemes in CSV...`);
    result = await searchAlternativeSchemes(participantID, documentType, participantListCache);
    
    return NextResponse.json(result.response);

  } catch (error) {
    console.error("[ERROR] API Route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    );
  }
}