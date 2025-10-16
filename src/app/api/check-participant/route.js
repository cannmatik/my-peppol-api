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
// Neon'da participants_master'da ara
async function searchInMaster(schemeID, participantID, documentType) {
  let client;
  
  try {
    client = await getNeonClient();
    const fullPid = `${schemeID}:${participantID}`;
    
    // Önce master'da ara
    const result = await client.query(
      'SELECT * FROM participants_master WHERE endpoint_id = $1 OR full_pid = $2',
      [participantID, fullPid]
    );
    
    if (result.rows.length > 0) {
      const alternatives = result.rows.map(row => ({
        scheme: row.scheme_id,
        participantId: row.endpoint_id,
        fullId: row.full_pid,
        countryCode: row.country_code
      }));

      return {
        found: true,
        response: {
          participantID: participantID,
          schemeID: schemeID,
          documentType,
          supportsDocumentType: false,
          matchType: "alternative_schemes",
          message: "❌ No participant exists with the given schema, but found with alternative schemes",
          foundIn: "participants_master",
          alternativeSchemes: alternatives
        }
      };
    }
    
    return { found: false };
    
  } catch (error) {
    console.error("[ERROR] Master search:", error);
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