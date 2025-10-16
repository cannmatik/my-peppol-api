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

// Basit ve güvenli document types parser
function parseDocumentTypes(participant) {
  const allDocumentTypes = [];
  
  // 1. Önce JSON document_types'dan dene
  if (participant.document_types) {
    try {
      let parsedData;
      
      if (typeof participant.document_types === 'string') {
        parsedData = JSON.parse(participant.document_types);
      } else {
        parsedData = participant.document_types;
      }
      
      if (Array.isArray(parsedData)) {
        parsedData.forEach(docType => {
          if (typeof docType === 'string' && docType.trim()) {
            allDocumentTypes.push(docType.trim());
          }
        });
      }
    } catch (e) {
      console.log(`JSON parse failed:`, e.message);
    }
  }
  
  // 2. Eğer JSON boşsa, raw_document_types'dan parse et
  if (allDocumentTypes.length === 0 && participant.raw_document_types) {
    const docTypeNames = extractDocumentTypes(participant.raw_document_types);
    docTypeNames.forEach(name => allDocumentTypes.push(name));
  }
  
  // 3. supports_invoice ve supports_creditnote'dan da ekle (fallback)
  if (participant.supports_invoice && !allDocumentTypes.some(doc => doc.toLowerCase() === 'invoice')) {
    allDocumentTypes.push('Invoice');
  }
  if (participant.supports_creditnote && !allDocumentTypes.some(doc => doc.toLowerCase() === 'creditnote')) {
    allDocumentTypes.push('CreditNote');
  }
  
  return [...new Set(allDocumentTypes)];
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

// Yardımcı fonksiyon - Neon response oluştur
function createNeonResponse(participant, schemeID, participantID, documentType, matchType) {
  const allDocumentTypes = parseDocumentTypes(participant);
  
  // Document type kontrolü - SADECE documentType belirtilmişse kontrol et
  let supportsDocumentType = null;
  if (documentType && documentType.trim() !== '') {
    const supportedDocumentTypes = {};
    allDocumentTypes.forEach(doc => {
      supportedDocumentTypes[doc.toLowerCase()] = true;
    });
    supportsDocumentType = supportedDocumentTypes[documentType.toLowerCase()];
  }
  
  const message = documentType && documentType.trim() !== ''
    ? (supportsDocumentType 
        ? `✅ ${documentType} supported - ${participant.company_name}` 
        : `❌ ${documentType} not supported - ${participant.company_name}`)
    : `ℹ️ Participant found - ${participant.company_name}`;

  return {
    found: true,
    response: {
      participantID,
      schemeID,
      documentType: documentType || null,
      companyName: participant.company_name,
      supportsDocumentType: supportsDocumentType, // null, true, veya false
      matchType,
      foundIn: "neon_database",
      message,
      allDocumentTypes,
      actualFullPid: participant.full_pid
    }
  };
}

// Alternatif scheme'ler için response oluştur
function createAlternativeSchemesResponse(participantID, schemeID, documentType, alternatives) {
  // Document type support kontrolü - SADECE documentType belirtilmişse
  let supportsRequestedDoc = null;
  let alternativeMessage = `⚠️ Participant not found with scheme ${schemeID}, but found with alternative schemes`;

  if (documentType && documentType.trim() !== '') {
    // İlk alternatifte document type support kontrol et
    const firstAlternative = alternatives[0];
    const firstAltDocTypes = firstAlternative.documentTypes || [];
    supportsRequestedDoc = firstAltDocTypes.some(doc => 
      doc.toLowerCase() === documentType.toLowerCase()
    );
    
    alternativeMessage = supportsRequestedDoc
      ? `✅ ${documentType} supported with alternative schemes` 
      : `❌ ${documentType} not supported with scheme ${schemeID}, but participant found with alternative schemes`;
  }

  return {
    found: true,
    response: {
      participantID: participantID,
      schemeID: schemeID,
      documentType: documentType || null,
      companyName: alternatives[0]?.companyName || "Unknown",
      supportsDocumentType: false, // Ana scheme ile bulunamadığı için false
      matchType: "alternative_schemes",
      foundIn: "neon_database", 
      message: alternativeMessage,
      allDocumentTypes: [],
      alternativeSchemes: alternatives,
      note: "Participant found with alternative schemes. Try using one of the schemes below."
    }
  };
}

// Participant bulunamadığında alternatifleri göster
function createNotFoundResponse(participantID, schemeID, documentType, alternativesFromCSV = []) {
  let message = `❌ Participant not found with scheme ${schemeID}`;
  
  if (alternativesFromCSV.length > 0) {
    message += ", but found potential matches in directory";
  }

  return {
    found: false,
    response: {
      participantID,
      schemeID,
      documentType: documentType || null,
      companyName: null,
      supportsDocumentType: false,
      matchType: "not_found",
      foundIn: "none",
      message,
      allDocumentTypes: [],
      alternativeSchemes: alternativesFromCSV,
      note: alternativesFromCSV.length > 0 
        ? "Participant not found with requested scheme, but potential matches found in directory."
        : "Participant not found in Peppol directory."
    }
  };
}

// Neon'da ara - GELİŞMİŞ VERSİYON
async function searchInNeon(schemeID, participantID, documentType) {
  let client;
  
  try {
    client = await getNeonClient();
    const fullPid = `${schemeID}:${participantID}`;
    
    console.log(`[SEARCH] Looking for: ${fullPid}`);
    
    // 1. ÖNCE TAM EŞLEŞME
    let result = await client.query(
      'SELECT * FROM participants WHERE full_pid = $1',
      [fullPid]
    );
    
    if (result.rows.length > 0) {
      const participant = result.rows[0];
      console.log(`[FOUND] Exact match: ${participant.company_name}`);
      return createNeonResponse(participant, schemeID, participantID, documentType, "direct");
    }
    
    // 2. ENDPOINT ID İLE ARA (case insensitive)
    console.log(`[SEARCH] Trying endpoint_id: ${participantID}`);
    result = await client.query(
      'SELECT * FROM participants WHERE LOWER(endpoint_id) = LOWER($1)',
      [participantID]
    );
    
    if (result.rows.length > 0) {
      const participant = result.rows[0];
      console.log(`[FOUND] Endpoint match: ${participant.full_pid}`);
      
      // Eğer scheme ID eşleşmiyorsa, alternatif scheme olarak değerlendir
      if (participant.scheme_id !== schemeID) {
        const alternatives = result.rows.map(row => ({
          scheme: row.scheme_id,
          participantId: row.endpoint_id,
          fullId: row.full_pid,
          companyName: row.company_name,
          documentTypes: parseDocumentTypes(row),
          countryCode: row.country_code
        }));
        
        console.log(`[FOUND] Scheme mismatch, returning as alternative`);
        return createAlternativeSchemesResponse(participantID, schemeID, documentType, alternatives);
      }
      
      return createNeonResponse(participant, schemeID, participantID, documentType, "endpoint_match");
    }
    
    // 3. NORMALIZE EDİLMİŞ ENDPOINT ID İLE ARA
    const normalizedId = normalizeParticipantId(participantID);
    if (normalizedId !== participantID) {
      console.log(`[SEARCH] Trying normalized: ${normalizedId}`);
      result = await client.query(
        'SELECT * FROM participants WHERE LOWER(endpoint_id) = LOWER($1)',
        [normalizedId]
      );
      
      if (result.rows.length > 0) {
        const participant = result.rows[0];
        console.log(`[FOUND] Normalized match: ${participant.full_pid}`);
        
        // Eğer scheme ID eşleşmiyorsa, alternatif scheme olarak değerlendir
        if (participant.scheme_id !== schemeID) {
          const alternatives = result.rows.map(row => ({
            scheme: row.scheme_id,
            participantId: row.endpoint_id,
            fullId: row.full_pid,
            companyName: row.company_name,
            documentTypes: parseDocumentTypes(row),
            countryCode: row.country_code
          }));
          
          console.log(`[FOUND] Scheme mismatch, returning as alternative`);
          return createAlternativeSchemesResponse(participantID, schemeID, documentType, alternatives);
        }
        
        return createNeonResponse(participant, schemeID, participantID, documentType, "normalized_match");
      }
    }
    
    // 4. ALTERNATİF SCHEME'LERİ BUL (TÜM EŞLEŞENLERİ GETİR)
    console.log(`[SEARCH] Searching for alternative schemes...`);
    result = await client.query(
      `SELECT * FROM participants 
       WHERE endpoint_id = $1 OR LOWER(endpoint_id) = LOWER($2)
       ORDER BY 
         CASE WHEN endpoint_id = $1 THEN 1 ELSE 2 END,
         scheme_id`,
      [participantID, normalizedId || participantID]
    );
    
    if (result.rows.length > 0) {
      const alternatives = result.rows.map(row => ({
        scheme: row.scheme_id,
        participantId: row.endpoint_id,
        fullId: row.full_pid,
        companyName: row.company_name,
        documentTypes: parseDocumentTypes(row),
        countryCode: row.country_code
      }));

      console.log(`[FOUND] ${alternatives.length} alternative schemes`);
      return createAlternativeSchemesResponse(participantID, schemeID, documentType, alternatives);
    }
    
    console.log(`[NOT FOUND] No matches in Neon`);
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

export async function POST(request) {
  try {
    const { documentType, schemeID, participantID } = await request.json();
    
    if (!schemeID || !participantID) {
      return NextResponse.json({ 
        error: "Missing required fields: schemeID and participantID" 
      }, { status: 400 });
    }

    console.log(`[API] Request: ${schemeID}:${participantID} - ${documentType || 'No document type'}`);

    // 1. AŞAMA: Önce Neon'da gelişmiş arama
    let result = await searchInNeon(schemeID, participantID, documentType);
    if (result.found) {
      console.log(`[API] Response: ${result.response.matchType}`);
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
    console.log(`[API] Searching in CSV cache...`);
    const csvResult = await searchAlternativeSchemes(participantID, documentType, participantListCache);
    
    if (csvResult.found) {
      return NextResponse.json(csvResult.response);
    }

    // 4. AŞAMA: Hiçbir şey bulunamadı
    return NextResponse.json(
      createNotFoundResponse(participantID, schemeID, documentType).response
    );

  } catch (error) {
    console.error("[ERROR] API Route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    );
  }
}