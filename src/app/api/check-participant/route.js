import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { NextResponse } from "next/server";
import { 
  searchInDatabase, 
  searchAlternativeSchemes,
  loadParticipantList
} from "../../../lib/participant-utils";

let db;
let participantListCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function POST(request) {
  if (!db) {
    db = await open({
      filename: "C:\\Users\\Can Matik\\Desktop\\my-peppol-api\\src\\app\\data\\participants.db",
      driver: sqlite3.Database,
    });
  }

  const { documentType, schemeID, participantID } = await request.json();
  
  if (!schemeID || !participantID) {
    return NextResponse.json({ error: "Missing required fields: schemeID and participantID" }, { status: 400 });
  }

  const fullPid = `${schemeID}:${participantID}`;
  console.log(`[SEARCH] Looking for: ${fullPid}`);

  // Cache participant list
  const now = Date.now();
  if (!participantListCache || (now - lastCacheTime) > CACHE_DURATION) {
    console.log(`[CACHE] Loading participant list...`);
    participantListCache = await loadParticipantList();
    lastCacheTime = now;
  }

  // 1. AŞAMA: Önce veritabanında doğru scheme ile ara
  let result = await searchInDatabase(db, fullPid, documentType);
  if (result.found) {
    console.log(`[FOUND] Direct database match with details`);
    return NextResponse.json(result.response);
  }

  // 2. AŞAMA: Yanlış scheme yazılmışsa, alternatifleri ara (business cards'a BAKMIYOR)
  console.log(`[SEARCH] Not found directly, searching alternative schemes...`);
  result = await searchAlternativeSchemes(participantID, documentType, participantListCache);
  
  return NextResponse.json(result.response);
}