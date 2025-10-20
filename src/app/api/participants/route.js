import { NextResponse } from "next/server";
import pkg from 'pg';
const { Client } = pkg;

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

// Document types'ı parse etme
function parseDocumentTypes(participant) {
  const allDocumentTypes = [];
  
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
  
  if (allDocumentTypes.length === 0 && participant.raw_document_types) {
    const docTypes = participant.raw_document_types.split('\n')
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
    
    docTypes.forEach(name => allDocumentTypes.push(name));
  }
  
  if (participant.supports_invoice && !allDocumentTypes.some(doc => doc.toLowerCase() === 'invoice')) {
    allDocumentTypes.push('Invoice');
  }
  if (participant.supports_creditnote && !allDocumentTypes.some(doc => doc.toLowerCase() === 'creditnote')) {
    allDocumentTypes.push('CreditNote');
  }
  
  return [...new Set(allDocumentTypes)];
}

// Tüm participants'ı sayfalama ile çekme
async function getAllParticipants(page = 1, limit = 100) {
  let client;
  try {
    client = await getNeonClient();
    
    const offset = (page - 1) * limit;
    
    console.log(`[SEARCH] Fetching participants: page=${page}, limit=${limit}, offset=${offset}`);
    
    const countResult = await client.query('SELECT COUNT(*) FROM participants');
    const totalCount = parseInt(countResult.rows[0].count);
    
    const result = await client.query(`
      SELECT 
        id,
        full_pid,
        scheme_id,
        endpoint_id,
        supports_invoice,
        supports_creditnote,
        company_name,
        country_code,
        registration_date,
        raw_document_types,
        document_types,
        created_at
      FROM participants
      ORDER BY company_name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    console.log(`[FOUND] ${result.rows.length} participants retrieved for page ${page}`);
    
    const participants = result.rows.map(participant => ({
      id: participant.id,
      full_pid: participant.full_pid,
      scheme_id: participant.scheme_id,
      endpoint_id: participant.endpoint_id,
      supports_invoice: participant.supports_invoice,
      supports_creditnote: participant.supports_creditnote,
      company_name: participant.company_name,
      country_code: participant.country_code,
      registration_date: participant.registration_date,
      document_types: parseDocumentTypes(participant),
      created_at: participant.created_at
    }));
    
    return {
      success: true,
      count: participants.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      participants
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch all participants:", error);
    throw new Error("Failed to fetch participants");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Toplam participant sayısını alma
async function getParticipantCount() {
  let client;
  try {
    client = await getNeonClient();
    
    console.log('[SEARCH] Fetching participant count');
    
    const result = await client.query('SELECT COUNT(*) FROM participants');
    const totalCount = parseInt(result.rows[0].count);
    
    console.log(`[FOUND] Total participants: ${totalCount}`);
    
    return {
      success: true,
      totalCount
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch participant count:", error);
    throw new Error("Failed to fetch participant count");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Ülke koduna göre participants'ı çekme
async function getParticipantsByCountry(countryCode, page = 1, limit = 100) {
  let client;
  try {
    client = await getNeonClient();
    
    const offset = (page - 1) * limit;
    
    console.log(`[SEARCH] Fetching participants for country: ${countryCode}, page=${page}, limit=${limit}, offset=${offset}`);
    
    const countResult = await client.query('SELECT COUNT(*) FROM participants WHERE country_code = $1', [countryCode]);
    const totalCount = parseInt(countResult.rows[0].count);
    
    const result = await client.query(`
      SELECT 
        id,
        full_pid,
        scheme_id,
        endpoint_id,
        supports_invoice,
        supports_creditnote,
        company_name,
        country_code,
        registration_date,
        raw_document_types,
        document_types,
        created_at
      FROM participants
      WHERE country_code = $1
      ORDER BY company_name ASC
      LIMIT $2 OFFSET $3
    `, [countryCode, limit, offset]);
    
    console.log(`[FOUND] ${result.rows.length} participants retrieved for country ${countryCode}, page ${page}`);
    
    const participants = result.rows.map(participant => ({
      id: participant.id,
      full_pid: participant.full_pid,
      scheme_id: participant.scheme_id,
      endpoint_id: participant.endpoint_id,
      supports_invoice: participant.supports_invoice,
      supports_creditnote: participant.supports_creditnote,
      company_name: participant.company_name,
      country_code: participant.country_code,
      registration_date: participant.registration_date,
      document_types: parseDocumentTypes(participant),
      created_at: participant.created_at
    }));
    
    return {
      success: true,
      count: participants.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      participants
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch participants by country:", error);
    throw new Error(`Failed to fetch participants for country ${countryCode}`);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  
  try {
    // Header'dan page ve limit al, yoksa query parametrelerini kullan
    const pageHeader = request.headers.get('page');
    const limitHeader = request.headers.get('limit');
    
    const page = parseInt(pageHeader || searchParams.get('page') || '1');
    const limit = parseInt(limitHeader || searchParams.get('limit') || '100');
    
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid page or limit parameters" },
        { status: 400 }
      );
    }
    
    // 1. Toplam participant sayısı endpoint'i
    if (pathname.endsWith('/count')) {
      console.log('[API] GET request: Fetching participant count');
      
      const result = await getParticipantCount();
      
      const response = NextResponse.json({
        success: true,
        totalCount: result.totalCount
      });
      
      // Header'a toplam sayfa sayısını ekle (count için anlamlı değil ama tutarlılık için 1)
      response.headers.set('X-Total-Pages', '1');
      return response;
    }
    
    // 2. Ülke koduna göre participant'lar endpoint'i
    if (pathname.includes('/by-country/')) {
      const countryCode = pathname.split('/by-country/')[1];
      if (!countryCode) {
        return NextResponse.json(
          { success: false, error: "Country code is required" },
          { status: 400 }
        );
      }
      
      console.log(`[API] GET request: Fetching participants for country=${countryCode}, page=${page}, limit=${limit}`);
      
      const result = await getParticipantsByCountry(countryCode, page, limit);
      
      const response = NextResponse.json({
        success: true,
        count: result.count,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        data: result.participants
      });
      
      // Header'a toplam sayfa sayısını ekle
      response.headers.set('X-Total-Pages', result.totalPages.toString());
      return response;
    }
    
    // 3. Tüm participant'lar endpoint'i (sayfalama ile)
    console.log(`[API] GET request: Fetching all participants, page=${page}, limit=${limit}`);
    
    const result = await getAllParticipants(page, limit);
    
    const response = NextResponse.json({
      success: true,
      count: result.count,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      data: result.participants
    });
    
    // Header'a toplam sayfa sayısını ekle
    response.headers.set('X-Total-Pages', result.totalPages.toString());
    return response;
    
  } catch (error) {
    console.error("[ERROR] API Route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}