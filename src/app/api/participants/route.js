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

// Filtreleme için WHERE koşulu oluşturma
function buildWhereClause(filters) {
  const conditions = [];
  const values = [];
  let paramCount = 0;

  if (filters.countryCode) {
    paramCount++;
    conditions.push(`country_code = $${paramCount}`);
    values.push(filters.countryCode.toUpperCase());
  }

  if (filters.schemeId) {
    paramCount++;
    conditions.push(`scheme_id = $${paramCount}`);
    values.push(filters.schemeId);
  }

  if (filters.companyName) {
    paramCount++;
    conditions.push(`company_name ILIKE $${paramCount}`);
    values.push(`%${filters.companyName}%`);
  }

  if (filters.supportsInvoice !== undefined) {
    paramCount++;
    conditions.push(`supports_invoice = $${paramCount}`);
    values.push(filters.supportsInvoice);
  }

  if (filters.supportsCreditnote !== undefined) {
    paramCount++;
    conditions.push(`supports_creditnote = $${paramCount}`);
    values.push(filters.supportsCreditnote);
  }

  if (filters.documentType) {
    paramCount++;
    conditions.push(`(
      document_types::text ILIKE $${paramCount} OR 
      raw_document_types ILIKE $${paramCount} OR
      (document_types IS NOT NULL AND document_types::text ILIKE $${paramCount})
    )`);
    values.push(`%${filters.documentType}%`);
  }

  if (filters.startDate) {
    paramCount++;
    conditions.push(`registration_date >= $${paramCount}`);
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    paramCount++;
    conditions.push(`registration_date <= $${paramCount}`);
    values.push(filters.endDate);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

// Tüm participants'ı filtrelerle çekme - DÜZELTİLDİ: parametre sırası doğru
async function getParticipantsWithFilters(filters = {}, page = 1, limit = 100) {
  let client;
  try {
    client = await getNeonClient();
    
    const offset = (page - 1) * limit;
    const { whereClause, values } = buildWhereClause(filters);
    
    console.log(`[SEARCH] Fetching participants with filters:`, filters, `page=${page}, limit=${limit}, offset=${offset}`);
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM participants ${whereClause}`;
    const countResult = await client.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Data query
    const dataQuery = `
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
      ${whereClause}
      ORDER BY company_name ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const queryValues = [...values, limit, offset];
    const result = await client.query(dataQuery, queryValues);
    
    console.log(`[FOUND] ${result.rows.length} participants retrieved with filters for page ${page}`);
    
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
      participants,
      filters
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch participants with filters:", error);
    throw new Error("Failed to fetch participants with filters");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Benzersiz ülke kodlarını getirme
async function getUniqueCountries() {
  let client;
  try {
    client = await getNeonClient();
    
    console.log('[SEARCH] Fetching unique countries');
    
    const result = await client.query(`
      SELECT DISTINCT country_code 
      FROM participants 
      WHERE country_code IS NOT NULL AND country_code != ''
      ORDER BY country_code ASC
    `);
    
    const countries = result.rows.map(row => row.country_code);
    
    console.log(`[FOUND] ${countries.length} unique countries`);
    
    return {
      success: true,
      count: countries.length,
      countries
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch unique countries:", error);
    throw new Error("Failed to fetch unique countries");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Benzersiz şema ID'lerini getirme
async function getUniqueSchemes() {
  let client;
  try {
    client = await getNeonClient();
    
    console.log('[SEARCH] Fetching unique schemes');
    
    const result = await client.query(`
      SELECT DISTINCT scheme_id 
      FROM participants 
      WHERE scheme_id IS NOT NULL AND scheme_id != ''
      ORDER BY scheme_id ASC
    `);
    
    const schemes = result.rows.map(row => row.scheme_id);
    
    console.log(`[FOUND] ${schemes.length} unique schemes`);
    
    return {
      success: true,
      count: schemes.length,
      schemes
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch unique schemes:", error);
    throw new Error("Failed to fetch unique schemes");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Toplam participant sayısını alma
async function getParticipantCount(filters = {}) {
  let client;
  try {
    client = await getNeonClient();
    
    console.log('[SEARCH] Fetching participant count with filters:', filters);
    
    const { whereClause, values } = buildWhereClause(filters);
    const query = `SELECT COUNT(*) FROM participants ${whereClause}`;
    
    const result = await client.query(query, values);
    const totalCount = parseInt(result.rows[0].count);
    
    console.log(`[FOUND] Total participants: ${totalCount}`);
    
    return {
      success: true,
      totalCount,
      filters
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

export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  
  try {
    // Header'dan page ve limit al, yoksa query parametrelerini kullan
    const pageHeader = request.headers.get('page');
    const limitHeader = request.headers.get('limit');
    
    const page = parseInt(pageHeader || searchParams.get('page') || '1');
    const limit = parseInt(limitHeader || searchParams.get('limit') || '100');
    
    // Limit için maksimum değer
    const maxLimit = 1000;
    const actualLimit = Math.min(limit, maxLimit);
    
    if (page < 1 || actualLimit < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid page or limit parameters" },
        { status: 400 }
      );
    }
    
    // Filtre parametrelerini topla
    const filters = {
      countryCode: searchParams.get('country') || searchParams.get('countryCode'),
      schemeId: searchParams.get('scheme') || searchParams.get('schemeId'),
      companyName: searchParams.get('company') || searchParams.get('companyName') || searchParams.get('search'),
      documentType: searchParams.get('documentType') || searchParams.get('docType'),
      supportsInvoice: searchParams.get('supportsInvoice') ? searchParams.get('supportsInvoice') === 'true' : undefined,
      supportsCreditnote: searchParams.get('supportsCreditnote') ? searchParams.get('supportsCreditnote') === 'true' : undefined,
      startDate: searchParams.get('startDate') || searchParams.get('fromDate'),
      endDate: searchParams.get('endDate') || searchParams.get('toDate')
    };
    
    // Boş string'leri undefined yap
    Object.keys(filters).forEach(key => {
      if (filters[key] === '') {
        filters[key] = undefined;
      }
    });

    // 1. Benzersiz ülkeler endpoint'i
    if (pathname.endsWith('/countries')) {
      console.log('[API] GET request: Fetching unique countries');
      
      const result = await getUniqueCountries();
      
      return NextResponse.json({
        success: true,
        count: result.count,
        countries: result.countries
      });
    }

    // 2. Benzersiz şemalar endpoint'i
    if (pathname.endsWith('/schemes')) {
      console.log('[API] GET request: Fetching unique schemes');
      
      const result = await getUniqueSchemes();
      
      return NextResponse.json({
        success: true,
        count: result.count,
        schemes: result.schemes
      });
    }
    
    // 3. Toplam participant sayısı endpoint'i (filtreli)
    if (pathname.endsWith('/count')) {
      console.log('[API] GET request: Fetching participant count with filters:', filters);
      
      const result = await getParticipantCount(filters);
      
      return NextResponse.json({
        success: true,
        totalCount: result.totalCount,
        filters: result.filters
      });
    }
    
    // 4. Ülke koduna göre participant'lar endpoint'i (backward compatibility)
    if (pathname.includes('/by-country/')) {
      const countryCode = pathname.split('/by-country/')[1];
      if (!countryCode) {
        return NextResponse.json(
          { success: false, error: "Country code is required" },
          { status: 400 }
        );
      }
      
      filters.countryCode = countryCode;
      
      console.log(`[API] GET request: Fetching participants for country=${countryCode}, page=${page}, limit=${actualLimit}`);
      
      // DÜZELTME: Parametre sırası doğru şekilde
      const result = await getParticipantsWithFilters(filters, page, actualLimit);
      
      const response = NextResponse.json({
        success: true,
        count: result.count,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        filters: result.filters,
        data: result.participants
      });
      
      response.headers.set('X-Total-Pages', result.totalPages.toString());
      response.headers.set('X-Total-Count', result.totalCount.toString());
      return response;
    }
    
    // 5. Ana endpoint - tüm participant'lar (filtreli ve sayfalı)
    console.log(`[API] GET request: Fetching participants with filters:`, filters, `page=${page}, limit=${actualLimit}`);
    
    // DÜZELTME: Parametre sırası doğru şekilde
    const result = await getParticipantsWithFilters(filters, page, actualLimit);
    
    const response = NextResponse.json({
      success: true,
      count: result.count,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      filters: result.filters,
      data: result.participants
    });
    
    response.headers.set('X-Total-Pages', result.totalPages.toString());
    response.headers.set('X-Total-Count', result.totalCount.toString());
    return response;
    
  } catch (error) {
    console.error("[ERROR] API Route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}