import { NextResponse } from "next/server";
import pkg from 'pg';
const { Client } = pkg;

// Neon client helper
async function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error('NEON_DATABASE_URL is not defined');
    throw new Error('NEON_DATABASE_URL environment variable is required');
  }
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Successfully connected to Neon DB');
    return client;
  } catch (err) {
    console.error('Failed to connect to Neon DB:', err);
    throw err;
  }
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

// Toplam participant sayısını alma
async function getParticipantCount(filters = {}) {
  let client;
  try {
    client = await getNeonClient();
    console.log('[SEARCH] Fetching participant count with filters:', filters);
    const { whereClause, values } = buildWhereClause(filters);
    const query = `SELECT COUNT(*) FROM participants ${whereClause}`;
    console.log('Executing query:', query, 'with values:', values);
    const result = await client.query(query, values);
    const totalCount = parseInt(result.rows[0].count);
    console.log(`[FOUND] Total participants: ${totalCount}`);
    return {
      success: true,
      totalCount,
      filters
    };
  } catch (error) {
    console.error("[ERROR] Neon fetch participant count:", error.stack);
    throw new Error(`Failed to fetch participant count: ${error.message}`);
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

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

    console.log('[API] GET request: Fetching participant count with filters:', filters);
    const result = await getParticipantCount(filters);

    return NextResponse.json({
      success: true,
      totalCount: result.totalCount,
      filters: result.filters
    });
  } catch (error) {
    console.error("[ERROR] API Route:", error.stack);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}