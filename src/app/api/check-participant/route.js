import { NextResponse } from "next/server";
import pkg from 'pg';
const { Client } = pkg;
import { 
  searchAlternativeSchemes,
  loadParticipantList,
  extractDocumentTypes 
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

// Neon'da ara
async function searchInNeon(schemeID, participantID, documentType) {
  let client;
  
  try {
    client = await getNeonClient();
    const fullPid = `${schemeID}:${participantID}`;
    
    const result = await client.query(
      'SELECT * FROM participants WHERE full_pid = $1',
      [fullPid]
    );
    
    if (result.rows.length > 0) {
      const participant = result.rows[0];
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

      return {
        found: true,
        response: {
          participantID: participantID,
          schemeID: schemeID,
          documentType,
          companyName: participant.company_name,
          supportsDocumentType: documentType ? supportsDoc : null,
          matchType: "direct",
          foundIn: "neon_database",
          message: message,
          allDocumentTypes: participant.raw_document_types ? 
            extractDocumentTypes(participant.raw_document_types) : []
        }
      };
    }
    
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

    const fullPid = `${schemeID}:${participantID}`;
    console.log(`[SEARCH] Looking for: ${fullPid}`);

    // 1. AŞAMA: Önce Neon'da ara
    let result = await searchInNeon(schemeID, participantID, documentType);
    if (result.found) {
      console.log(`[FOUND] Direct Neon database match`);
      return NextResponse.json(result.response);
    }

    // 2. AŞAMA: Alternatif scheme'ler için participant list cache
    const now = Date.now();
    if (!participantListCache || (now - lastCacheTime) > CACHE_DURATION) {
      console.log(`[CACHE] Loading participant list...`);
      participantListCache = await loadParticipantList();
      lastCacheTime = now;
    }

    // 3. AŞAMA: Alternatif scheme'leri ara
    console.log(`[SEARCH] Not found directly, searching alternative schemes...`);
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