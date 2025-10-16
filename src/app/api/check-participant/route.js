import { NextResponse } from "next/server";
import { getJSONDatabase } from "../../../lib/json-database";
import { 
  searchAlternativeSchemes,
  loadParticipantList 
} from "../../../lib/participant-utils";

let participantListCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

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

    // JSON database'den ara
    const jsonDB = getJSONDatabase();
    const participant = await jsonDB.findByFullPid(fullPid);

    if (participant) {
      let supportsDoc = false;
      let message = "";

      if (documentType) {
        supportsDoc = documentType.toLowerCase() === "invoice" ? 
          participant.supports_invoice : 
          participant.supports_creditnote;

        message = supportsDoc ? 
          `✅ ${documentType} supported - ${participant.company_name}` : 
          `❌ ${documentType} not supported - ${participant.company_name}`;
      } else {
        message = `⚠️ No document type specified - ${participant.company_name}`;
      }

      return NextResponse.json({
        participantID: participantID,
        schemeID: schemeID,
        documentType,
        companyName: participant.company_name,
        supportsDocumentType: documentType ? supportsDoc : null,
        matchType: "direct",
        foundIn: "json_database",
        message: message,
        allDocumentTypes: participant.raw_document_types ? 
          extractDocumentTypes(participant.raw_document_types) : []
      });
    }

    // Cache participant list for alternative schemes
    const now = Date.now();
    if (!participantListCache || (now - lastCacheTime) > CACHE_DURATION) {
      console.log(`[CACHE] Loading participant list...`);
      participantListCache = await loadParticipantList();
      lastCacheTime = now;
    }

    // Alternative schemes ara
    console.log(`[SEARCH] Not found directly, searching alternative schemes...`);
    const result = await searchAlternativeSchemes(participantID, documentType, participantListCache);
    
    return NextResponse.json(result.response);

  } catch (error) {
    console.error("[ERROR] API Route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    );
  }
}

// Document types'ı parse et
function extractDocumentTypes(rawDocumentTypes) {
  if (!rawDocumentTypes) return [];
  
  const docTypes = rawDocumentTypes.split('\n')
    .filter(line => line.trim().length > 0 && line.includes('busdox-docid-qns::'))
    .map(line => {
      const lineClean = line.trim().replace(/^"|"$/g, '');
      
      // Belge tipini çıkar
      let shortName = '';
      
      // Pattern 1: ...::DocumentType-2::DocumentType##...
      const pattern1 = /::([A-Za-z]+)-2::([A-Za-z]+)##/;
      const match1 = lineClean.match(pattern1);
      
      if (match1) {
        shortName = match1[2];
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
            shortName = shortName.replace(/-2$/, '');
          }
        }
      }
      
      return shortName.trim();
    })
    .filter(name => name && name.length > 0 && name !== '2.1');

  return [...new Set(docTypes)]; // Remove duplicates
}